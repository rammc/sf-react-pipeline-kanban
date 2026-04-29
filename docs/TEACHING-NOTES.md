# Teaching Notes

The reasoning behind why *this* use case, *these* libraries, and
*this* structure — written for the next reader who wants to know
"why didn't they just…?".

## Why a Pipeline Kanban?

| Concern | Why a Pipeline Kanban demonstrates it |
|---|---|
| **Where React beats LWC** | Drag-and-drop between columns is the canonical "this is awkward in LWC" example. The optimistic-with-rollback pattern fits in two screens of code. |
| **Domain familiarity** | Opportunity, Stage, Amount, CloseDate, Owner are universal across Sales / Service / Marketing devs. No CPQ datamodel or Industries object hierarchy to learn before the lesson starts. |
| **SDK coverage in one feature** | A single board touches `createDataSDK`, GraphQL queries, GraphQL mutations, picklist metadata, and client-side derived state — every public surface of `@salesforce/sdk-data` that a beginner would meet. |
| **Approachability** | Six React components, four hooks, one zustand store. Reads end-to-end in half an hour. |

## Library choices

### shadcn/ui (kept, despite the original brief excluding "design systems")

shadcn isn't a vendor library. It copies component files into your
repo and wraps [Radix primitives](https://www.radix-ui.com/primitives)
for accessibility. Result: you own the code, you can tweak it, and
the keyboard / focus / ARIA behaviour comes pre-baked. That's a
different category from SLDS-React or MUI.

The discipline rule we follow: only the components actually used
(Card, Avatar, Skeleton, Button, Input, sonner). Nothing pulled in
"just because it's there." Look at `src/components/ui/` — anything
present but unused is fair game to delete.

### zustand (one store, deliberately)

The filter inputs (selected owners + date range) need to be read by
three components: `FilterBar` (writes), `KanbanBoard` (filters),
`ForecastSidebar` (derives). Three options:

1. Lift state into `KanbanBoard` and prop-drill.
2. React Context + custom Provider.
3. zustand.

Option 1 means three layers of unrelated props. Option 2 means a
context file plus boilerplate per consumer. zustand's
`useFilterStore(s => s.thing)` selector is one line per read with
narrowed re-renders.

The lesson: pick the dependency to the size of the problem. One
shared piece of state ≠ Redux.

### dnd-kit (Phase 4)

`@dnd-kit/core` gives `useDraggable` + `useDroppable` + `DndContext`
as plain React hooks. Keyboard sensor works out of the box.
Comparing to alternatives:

- `react-dnd`: older API, requires a backend (HTML5 / touch).
- `react-beautiful-dnd`: archived.
- HTML5 drag-and-drop: no keyboard, hostile to test.

dnd-kit was not the cheapest dependency, but it was the cheapest
*correct* one.

### react-hook-form (Phase 5)

For one numeric field in an inline editor it's overkill. We added it
specifically so the example shows the integration pattern (register,
handleSubmit, isSubmitting) — once you have it for the inline edit,
adding a richer "edit Opportunity" dialog later is two more
`register()` calls.

### What's not here, and why

- **TanStack Query / SWR / Apollo Client**: hides the data flow.
  Plain `useState` + `useEffect` makes the optimistic-update pattern
  visible in 20 lines. With a query cache, the same code is "set
  the cache and trust it" — fine for production, bad for teaching.
- **Redux**: same reason, plus boilerplate.
- **Material UI / Mantine / SLDS-React**: a design system would push
  the focus toward styling decisions instead of Multi-Framework
  patterns.
- **Storybook**: real value at scale, no payoff for six components.
- **Jest**: the template ships Vitest; there is no reason to switch.

## Stretch exercises

These are good "now read this code, then add this" exercises. Each
should be one PR.

| Exercise | Touches | Skill |
|---|---|---|
| Add a `/opportunity/:id` route with a detail view | `src/routes.tsx`, `react-router`, a new query | Routing + dynamic data fetch |
| Move the Amount mutation pattern into one `useUpdateOpportunity({ partial })` hook | `src/hooks/`, both card + drag-end paths | Refactoring without changing behaviour |
| Persist filter state to URL search params | `filterStore.ts`, `react-router` `useSearchParams` | State sync between store and URL |
| Add a "Closed Won this quarter" KPI card to ForecastSidebar | `ForecastSidebar.tsx` | Derived state via `useMemo` |
| Replace hand-written types with codegen | `codegen.yml`, `tsconfig.json`, all `src/types/` consumers | Build pipelines |
| Add server-side filtering (Owner, CloseDate) via GraphQL `where:` | `OPPORTUNITIES_QUERY`, `useOpportunities`, `FilterBar` | Push filtering across the network boundary |

## What to read next

In rough order of "this repo → recipes → real app":

1. **[`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes)** — pattern-by-pattern recipes for each Multi-Framework primitive. Where this repo shows one full feature, recipes show many small ones in isolation.
2. **The Property Management Multi-Framework Sample App** — a full app, more code than this one, with multiple routes and several real features. Useful once recipes feel familiar.
3. **The Multi-Framework Beta documentation** — for definitive answers on the SDK API surface, the `_uibundle.uibundle-meta.xml` schema, and the `sf ui-bundle dev` command.

If you finish all three and want to dig into the React-on-Salesforce
runtime itself (LWR, the proxy plugin, manifest routing), the
`@salesforce/ui-bundle` source on npm is small and readable.
