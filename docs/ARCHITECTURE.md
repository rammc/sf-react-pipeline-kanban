# Architecture

A 30-minute read-through of how the pieces connect, why each layer
exists, and where the trade-offs are.

## System overview

```mermaid
flowchart LR
  Org["<b>Salesforce Org</b><br/><small>Sandbox or Scratch Org</small><br/><br/>Opportunity records<br/>StageName picklist<br/>GraphQL UI API"]

  Dev["<b>Local Dev Server</b><br/><small>sf ui-bundle dev</small><br/><br/>Vite + ui-bundle plugin<br/>Proxy with patch-package"]

  Browser["<b>Browser</b><br/><small>React UI Bundle</small><br/><br/>SDK · Hooks · Store<br/>KanbanBoard + Components"]

  Org -->|"HTTPS<br/>Bearer token"| Dev
  Dev -->|"fetch<br/>localhost:5173"| Browser

  classDef tier fill:#fbfaf6,stroke:#1a1a1a,stroke-width:1.5px,color:#1a1a1a
  class Org,Dev,Browser tier
```

Three tiers, one direction. Requests originate in the browser via the
SDK, flow through the local dev server's proxy (which adds the Bearer
token and forwards to the org's GraphQL UI API), and the response comes
back through the same path. In production this collapses to two tiers —
UI bundle code runs inside the org and the proxy disappears — but the
beta runs locally for now (see `docs/SETUP.md` for why).

## Browser tier

Inside the browser, four modules form a one-way chain — SDK → Hooks →
Board → Components — with a small zustand store on the side for filter
state. Reading the code follows the same direction. The `KanbanBoard`
component owns the optimistic local state; that's the load-bearing
design decision the rest of the architecture revolves around (see
"Decisions" below).

```mermaid
flowchart LR
  SDK["<b>Data SDK</b><br/>executeGraphQL"]
  Hooks["<b>Hooks</b><br/>useOpportunities<br/>useStages<br/>useUpdateStage<br/>useUpdateAmount"]
  Board["<b>KanbanBoard</b><br/>owns localOpps<br/>(optimistic state)"]
  Components["<b>Components</b><br/>Columns · Cards<br/>InlineEdit · FilterBar<br/>ForecastSidebar"]
  Filter[("<b>filterStore</b><br/>zustand")]

  SDK --> Hooks --> Board --> Components
  Filter -.-> Board
  Filter -.-> Components

  classDef node fill:#fbfaf6,stroke:#1a1a1a,stroke-width:1.5px,color:#1a1a1a
  classDef store fill:#f3f1e9,stroke:#7a7770,stroke-width:1.5px,color:#1a1a1a
  class SDK,Hooks,Board,Components node
  class Filter store

  linkStyle 0,1,2 stroke:#1a1a1a,stroke-width:1.5px
  linkStyle 3,4 stroke:#7a7770,stroke-width:1.5px,stroke-dasharray:4 3
```

## Data flow — initial load

How the board hydrates from a fresh page load.

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant B as KanbanBoard
  participant H as useOpportunities / useStages
  participant SDK as @salesforce/sdk-data
  participant P as Vite + ui-bundle proxy
  participant O as Salesforce GraphQL

  U->>B: navigate to /
  B->>H: mount, call hooks
  H->>SDK: executeGraphQL(OPPORTUNITIES_QUERY)
  H->>SDK: executeGraphQL(STAGES_QUERY)
  SDK->>P: POST /services/data/v66.0/graphql
  P->>O: fetch with Bearer token<br/>(rawInstanceUrl)
  O-->>P: { data: { uiapi: { ... } } }
  P-->>SDK: response body verbatim
  SDK-->>H: parsed JSON
  Note over H: flatten { value }<br/>envelopes
  H-->>B: opportunities[], stages[]
  B->>B: setLocalOpps(opportunities)
  B-->>U: render board
```

## Data flow — drag-and-drop with optimistic update

The "why React" beat. UI moves immediately; the server reconciles
afterwards. On rejection, local state rolls back and a toast surfaces
the SDK's error.

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant C as DraggableOpportunityCard
  participant Col as KanbanColumn (droppable)
  participant B as KanbanBoard
  participant H as useUpdateStage
  participant SDK as @salesforce/sdk-data
  participant O as Salesforce

  U->>C: pick up card
  C->>B: onDragStart(activeId)
  U->>Col: drop on target column
  Col->>B: onDragEnd(active, over)
  B->>B: snapshot = localOpps
  B->>B: setLocalOpps(prev where StageName replaced)
  B-->>U: card visually in new column instantly
  B->>H: updateStage(oppId, targetStage)
  H->>SDK: executeGraphQL(UPDATE_OPPORTUNITY_STAGE_MUTATION)
  SDK->>O: POST /graphql

  alt success
    O-->>SDK: { Record: { Id, StageName: { value } } }
    SDK-->>H: resolved
    H-->>B: void (no state change — already optimistic)
    Note over B,U: nothing more to render
  else error (FLS, network, validation)
    O-->>SDK: errors[] or HTTP failure
    SDK-->>H: throw
    H-->>B: rejected promise
    B->>B: setLocalOpps(snapshot)
    B->>U: toast.error("Couldn't move to …")
    B-->>U: card snaps back
  end
```

## Data flow — inline Amount edit

Same optimistic shape applied to a single field. The form component
stays dumb; KanbanBoard owns the rollback.

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant Card as OpportunityCard
  participant Form as InlineEditAmount
  participant B as KanbanBoard
  participant H as useUpdateAmount
  participant O as Salesforce

  U->>Card: click Amount
  Card->>Form: render inline form (auto-focus)
  U->>Form: edit value, press Enter
  Form->>B: handleUpdateAmount(id, next)
  B->>B: snapshot = localOpps
  B->>B: setLocalOpps(prev with new Amount)
  B->>H: updateAmount(id, next)
  H->>O: POST /graphql (mutation)

  alt success
    O-->>H: resolved
    H-->>B: void
    B-->>Form: resolved
    Form->>Card: close editor
    Note over U: ForecastSidebar updates<br/>via useMemo on localOpps
  else error
    O-->>H: throw
    H-->>B: rejected
    B->>B: setLocalOpps(snapshot)
    B->>U: toast.error("Couldn't update amount")
    B-->>Form: rejected (editor stays open for retry)
  end
```

## Data flow — filter + forecast (no network)

Filters never hit the server. Both the filtered card list and the
weighted-forecast totals are pure derivations over `localOpps`.

```mermaid
flowchart LR
  U[User] -->|toggle owner / set date| FB[FilterBar]
  FB -->|toggleOwner / setCloseDateFrom/To| FS[(zustand filterStore)]
  FS --> KB[KanbanBoard]
  KB -->|"useMemo(filter)"| VO["visibleOpps[]"]
  VO -->|groupByStage| Cols[KanbanColumns]
  VO --> Forecast[ForecastSidebar]
  Forecast -->|"Σ Amount × probability"| U
  Cols -->|cards re-render| U

  classDef store fill:#fef3c7,stroke:#b45309,color:#3c2c00
  class FS store
```

## Layers

### `src/api/`

Single-purpose: GraphQL strings + the thin `executeGraphQL` wrapper
around `createDataSDK`. No knowledge of React or business logic.

### `src/hooks/`

Plain `useState` + `useEffect`. No third-party data layer (TanStack
Query, Apollo, SWR…). Each hook is ~50 lines and does one thing —
load opportunities, load stages, fire one mutation. Tests mock
`@/api/graphqlClient`.

### `src/store/filterStore.ts`

The single shared piece of UI state — selected owners + close-date
range — lives in zustand. Three components read it (`FilterBar`
writes, `KanbanBoard` filters, `ForecastSidebar` aggregates), so
prop-drilling would have crossed three layers. Context would have
worked too, but with more boilerplate per consumer.

### `src/components/kanban/`

Behavior split from display:

| File                                  | Owns                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `KanbanBoard.tsx`                     | Hook orchestration, optimistic local state, drag-end + amount-update handlers, layout               |
| `KanbanColumn.tsx`                    | One column; `useDroppable` so cards can be dropped onto it                                          |
| `DraggableOpportunityCard.tsx`        | `useDraggable` wrapper — `transform`, `listeners`, `attributes`                                     |
| `OpportunityCard.tsx`                 | Pure visual card (Name / Amount / Date / Owner). Reused in `DragOverlay` without dnd-kit knowledge. |
| `InlineEditAmount.tsx`                | `react-hook-form` for one numeric field; resolves or rejects so the parent can roll back            |
| `FilterBar.tsx`                       | Owner chips + date inputs; reads/writes the zustand store                                           |
| `ForecastSidebar.tsx`                 | Pure derivation over the filtered list — no own state, no own queries                               |
| `BoardSkeleton.tsx`, `EmptyState.tsx` | Loading + empty placeholders                                                                        |

## Decisions

### Filter is client-side

`OPPORTUNITIES_QUERY` caps at `first: 200`, the dataset is bounded.
A round-trip per filter change adds latency and doubles the GraphQL
surface for no teaching benefit. If a real customer needed
server-side filtering, the right move is to push it into the query
via `where:` clauses on the GraphQL connection.

### Types are hand-written, not codegen

The template ships codegen wiring (`graphql-codegen` + a schema
fetcher), but it requires an authenticated org at build time. For a
tutorial repo that should clone-and-run, hand-typed shapes in
`src/types/opportunity.ts` are clearer and remove the org gate.
`docs/SETUP.md#codegen-requires-a-connected-org` describes how to
enable codegen if you want to.

### Optimistic update lives in `KanbanBoard`

A local `Opportunity[]` state mirrors `useOpportunities` via
`useEffect`. Mutations (drag-drop, inline-edit) snapshot, update
locally, fire the SDK call, and roll back on rejection — surfacing
errors via sonner toast.

This is the **why React** moment of the repo: the user sees
immediate UI changes without spinners, the network reconciles
afterwards, and the rollback is six lines of code. The same
behavior in LWC needs `@track`-shaped mutable state, manual revert
plumbing, and no built-in DnD primitive.

### Two near-identical mutation hooks (`useUpdateStage` + `useUpdateAmount`)

Deliberate duplication. They have the same five-line shape; merging
into a single `useUpdateOpportunity(partial)` would hide the pattern
behind one parameter. For a tutorial it's clearer to show the
parallel structure twice. A future refactor commit can collapse them
once a reader has internalised the shape.

### shadcn/ui kept (despite "no design system" in the original brief)

shadcn copies components into your repo and wraps Radix primitives —
no vendor lock-in, accessibility baseline included. Different from
SLDS-React or MUI. The discipline rule: only use the shadcn pieces
you actually need (Card, Avatar, Skeleton, Button, Input, sonner).
We do **not** add components ahead of demand.

### react-router kept, single route

The template ships `react-router` as part of its shell. Stripping it
would have cost more than it saved. A single `/` route renders
KanbanBoard. Adding `/opportunity/:id` is a stretch goal —
see `docs/TEACHING-NOTES.md`.

## What this repo intentionally does not show

- A second route. Adding one is the recommended exercise.
- A custom Apex callout. Everything is GraphQL.
- A real test pyramid. There are 9 tests — three for each hook plus
  one suite for the board. They're examples of where to put tests,
  not a coverage target.
- Server-side filtering, pagination, infinite scroll. Bounded dataset.
- Real-time updates / Streaming API. Optimistic UI is the substitute.
- A design system. Spacing and colour come straight from Tailwind +
  shadcn defaults.
