# Teaching Notes

The reasoning behind why _this_ use case, _these_ libraries, and
_this_ structure — written for the next reader who wants to know
"why didn't they just…?".

## Why a Pipeline Kanban?

| Concern                         | Why a Pipeline Kanban demonstrates it                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Where React beats LWC**       | Drag-and-drop between columns is the canonical "this is awkward in LWC" example. The optimistic-with-rollback pattern fits in two screens of code.                                                        |
| **Domain familiarity**          | Opportunity, Stage, Amount, CloseDate, Owner are universal across Sales / Service / Marketing devs. No CPQ datamodel or Industries object hierarchy to learn before the lesson starts.                    |
| **SDK coverage in one feature** | A single board touches `createDataSDK`, GraphQL queries, GraphQL mutations, picklist metadata, and client-side derived state — every public surface of `@salesforce/sdk-data` that a beginner would meet. |
| **Approachability**             | Six React components, four hooks, one zustand store. Reads end-to-end in half an hour.                                                                                                                    |

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
_correct_ one.

### react-hook-form (Phase 5)

For one numeric field in an inline editor it's overkill. We added it
specifically so the example shows the integration pattern (register,
handleSubmit, isSubmitting) — once you have it for the inline edit,
adding a richer "edit Opportunity" dialog later is two more
`register()` calls.

### Recharts (Phase 7)

React-native, declarative, composable. The `StageFunnel` is a
horizontal stacked `BarChart` with one `Bar` per stage and a `Cell`
per segment for the per-stage accent — about 80 lines including the
data transform. Comparing to alternatives:

- **Visx**: more low-level, requires more boilerplate for a small
  chart. The right call once you need bespoke axes or a chart type
  Recharts doesn't ship.
- **Chart.js**: imperative API, awkward in React. The wrapping
  `react-chartjs-2` works but the seams show.
- **D3 directly**: powerful but overkill for a single funnel; the lib
  that always tempts you to build your own framework on top.
- **ECharts**: large bundle (~400 KB gzipped), opinionated theming
  that fights our custom palette.
- **Tremor**: pre-styled dashboard kit, fights our typography and
  spacing system.

Recharts hits the sweet spot for embedded, single-purpose charts in
workflow apps. Same discipline rule as dnd-kit / zustand /
react-hook-form: pick the dependency to the size of the problem.

**Bundle cost**: Recharts adds ~106 KB gzipped (504 KB → 856 KB raw,
164 KB → 270 KB gzipped) on top of the React + dnd-kit + Tailwind
baseline. Acceptable for one chart that's central to the workflow;
worth re-checking if the chart count grows beyond two or three. If
the bundle ever needs to shrink, dynamic-import the funnel — it's
not used on first paint until the data loads.

### Custom SVG (Phase 8) — when the library gets in the way

Phase 7 shows when a chart library helps. Phase 8 shows when it gets
in the way. The close-date heatmap is a 7×12 grid of `<rect>`
elements with six fill colours; about 30 lines of JSX over the
day-bucket helper. Comparing alternatives:

- **Recharts**: no native heatmap. You can fake one with a scatter
  plot, but the layout fights the cell-grid semantics and the
  tooltip API doesn't fit a per-day "click to filter" pattern.
- **Visx (`@visx/heatmap`)**: bundle weight for a chart that's
  structurally simpler than what the library is built to handle.
- **`react-calendar-heatmap`**: opinionated about a GitHub-style
  layout; resists the close-date-only, forward-looking semantics
  needed here.

Custom SVG is the right call when a chart is small, specific, and
can't be sourced cleanly. Twelve `<rect>` elements per row, six
classes for colour steps, an HTML tooltip on top, done. The
discipline rule: recognise when a library helps and when it gets in
the way. Phase 7 and Phase 8 demonstrate both halves.

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

| Exercise                                                                           | Touches                                                    | Skill                                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Move the Amount mutation pattern into one `useUpdateOpportunity({ partial })` hook | `src/hooks/`, both card + drag-end paths                   | Refactoring without changing behaviour     |
| Persist filter state to URL search params                                          | `filterStore.ts`, `react-router` `useSearchParams`         | State sync between store and URL           |
| Add a "Closed Won this quarter" KPI card to ForecastSidebar                        | `ForecastSidebar.tsx`                                      | Derived state via `useMemo`                |
| Replace hand-written types with codegen                                            | `codegen.yml`, `tsconfig.json`, all `src/types/` consumers | Build pipelines                            |
| Add server-side filtering (Owner, CloseDate) via GraphQL `where:`                  | `OPPORTUNITIES_QUERY`, `useOpportunities`, `FilterBar`     | Push filtering across the network boundary |
| Extend the detail-view activity query to include Events alongside Tasks            | `OPPORTUNITY_ACTIVITY_QUERY`, `useOpportunityDetail`       | Polymorphic GraphQL queries + client merge |

## What to read next

In rough order of "this repo → recipes → real app":

1. **[`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes)** — pattern-by-pattern recipes for each Multi-Framework primitive. Where this repo shows one full feature, recipes show many small ones in isolation.
2. **The Property Management Multi-Framework Sample App** — a full app, more code than this one, with multiple routes and several real features. Useful once recipes feel familiar.
3. **The Multi-Framework Beta documentation** — for definitive answers on the SDK API surface, the `_uibundle.uibundle-meta.xml` schema, and the `sf ui-bundle dev` command.

If you finish all three and want to dig into the React-on-Salesforce
runtime itself (LWR, the proxy plugin, manifest routing), the
`@salesforce/ui-bundle` source on npm is small and readable.
