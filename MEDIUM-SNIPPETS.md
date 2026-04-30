# Code Snippets for Medium Article

Extracted from the Pipeline Kanban repo at commit `470d65e`.
Each snippet is the canonical version for the article. Editorial
notes below each snippet describe any changes made for presentation.

---

## Snippet 1: Optimistic UI with rollback

**File:** `src/components/kanban/KanbanBoard.tsx` (lines 135–156)

```tsx
async function handleDragEnd(event: DragEndEvent) {
  setActiveId(null);
  const { active, over } = event;
  if (!over) return;

  const oppId = String(active.id);
  const targetStage = String(over.id);
  const sourceStage = active.data.current?.sourceStage as string | undefined;
  if (!sourceStage || sourceStage === targetStage) return;

  const previous = localOpps;
  setLocalOpps((prev) =>
    prev.map((o) => (o.Id === oppId ? { ...o, StageName: targetStage } : o))
  );
  try {
    await updateStage(oppId, targetStage);
  } catch (err) {
    setLocalOpps(previous);
    const message = err instanceof Error ? err.message : "Unknown error";
    toast.error(`Couldn't move to "${targetStage}"`, { description: message });
  }
}
```

**Editorial notes:**

- Verbatim from the file. 22 lines.
- The snapshot mechanism is the simplest possible: `const previous = localOpps` — a closure capture of the current array reference. No `useRef`, no separate snapshot state. `localOpps` itself is a regular `useState<Opportunity[]>` declared at the top of `KanbanBoard`.
- `updateStage` comes from a sibling hook in `src/hooks/useUpdateStage.ts` — it wraps the GraphQL mutation and returns a `Promise<void>`. Same shape as Snippet 2, just a mutation instead of a query.
- `toast` is from `sonner`, mounted once at the app shell (`appLayout.tsx`).
- The two early returns at lines 138 and 143 are kept because they're the contract guards (no drop target, no-op self-drop). They're not edge cases bolted on later — they're part of the pattern's correctness.

---

## Snippet 2: Native data access through the SDK

**File 1:** `src/api/queries.ts` — the GraphQL string (lines 23–58)
**File 2:** `src/hooks/useOpportunities.ts` — the React hook around it (lines 34–87)

```ts
// src/api/queries.ts
export const OPPORTUNITIES_QUERY = /* GraphQL */ `
  query Opportunities {
    uiapi {
      query {
        Opportunity(first: 200) {
          edges {
            node {
              Id
              Name {
                value
              }
              Amount {
                value
              }
              CloseDate {
                value
              }
              StageName {
                value
              }
              Owner {
                Id
                Name {
                  value
                }
                SmallPhotoUrl {
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/hooks/useOpportunities.ts
function flatten(node: RawOpportunityNode): Opportunity {
  return {
    Id: node.Id,
    Name: node.Name.value,
    Amount: node.Amount.value,
    CloseDate: node.CloseDate.value,
    StageName: node.StageName.value,
    Owner: {
      Id: node.Owner.Id,
      Name: node.Owner.Name.value,
      SmallPhotoUrl: node.Owner.SmallPhotoUrl.value
    }
  };
}

export function useOpportunities(): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await executeGraphQL<OpportunitiesResponse>(OPPORTUNITIES_QUERY);
      setOpportunities(
        response.uiapi.query.Opportunity.edges.map((e) => flatten(e.node))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOpportunities();
  }, [fetchOpportunities]);

  return { opportunities, loading, error, refetch: fetchOpportunities };
}
```

**Editorial notes:**

- The query's GraphQL fields are wrapped in `{ value }` envelopes. That's the Salesforce UI API convention, not a repo choice — some scalars (`Id`, `Owner.Id`) are flat strings, everything else carries an envelope so the API can also expose `displayValue`, formatting metadata, etc. The hook reads `value` and the React layer formats with `Intl.NumberFormat`. Worth flagging in the article so the reader doesn't think the envelope is wrapper boilerplate the repo introduced.
- The `Owner` field is collapsed to one line in the snippet. The repo formats it across multiple lines for grep-ability — five lines vs one. Pure presentation.
- `flatten()` is named exactly that in the file. It lives inside `useOpportunities.ts`, scoped to the hook (not exported).
- Response path: `response.uiapi.query.Opportunity.edges.map(...)` — note **no** `response.data.` prefix. The `executeGraphQL` wrapper in `src/api/graphqlClient.ts` unwraps the outer `data` envelope and surfaces `errors` as thrown exceptions, so consumers see the inner shape directly. If the article's draft used `res.data.uiapi...`, drop the `data`.
- The interfaces `RawOpportunityNode`, `OpportunitiesResponse`, `UseOpportunitiesResult` are TypeScript declarations in the same file (lines 11–32 and 49–54). Elided from the snippet — the article's reader can infer the shapes from the query string and the `flatten` body. If the article wants to make the envelope shape explicit, paste the 12-line `RawOpportunityNode` interface separately.
- Types are **hand-written** in `src/types/opportunity.ts`, not generated. The repo wires `graphql-codegen` (see `codegen.yml`), but it requires an authenticated org at build time and is disabled by default for tutorial reasons. Documented in `docs/SETUP.md`. Recommend mentioning this in the article as a "you can wire codegen if you want" aside, not as the default.
- Two small lines from the original `fetchOpportunities` were dropped for the snippet:
  - `setError(null)` at the top of the function (clears stale errors on refetch).
  - The explicit `Record<string, never>` second type parameter on `executeGraphQL<T, V>` (the variables type — `OPPORTUNITIES_QUERY` takes none).

  Both are correctness details, not pattern details. Either restore for full fidelity or leave dropped for the 25-line target.

---

## Snippet 3: Lean state management

**File:** `src/store/filterStore.ts` (full file, 48 lines)

```ts
import { create } from "zustand";

/**
 * Filter state for the Kanban view.
 *
 * Why zustand: a single shared piece of UI state (which owners /
 * date-range the user has selected) needs to be readable from the
 * FilterBar (writes), KanbanBoard (filters opportunities), and
 * ForecastSidebar (operates on the filtered set). Lifting it into
 * KanbanBoard would force prop-drilling through three layers; the
 * Context API would work too but adds boilerplate per consumer.
 * Zustand gives us a hook with selector support and zero boilerplate.
 *
 * The store holds raw filter inputs only — no derived state.
 * Filtering is computed where it's used (KanbanBoard.useMemo).
 */
export interface FilterState {
  /** Selected Owner Ids — empty Set means "all owners". */
  ownerIds: Set<string>;
  /** ISO date string (YYYY-MM-DD) or null. */
  closeDateFrom: string | null;
  closeDateTo: string | null;
  toggleOwner: (id: string) => void;
  setCloseDateFrom: (date: string | null) => void;
  setCloseDateTo: (date: string | null) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  ownerIds: new Set<string>(),
  closeDateFrom: null,
  closeDateTo: null,
  toggleOwner: (id) =>
    set((state) => {
      const next = new Set(state.ownerIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ownerIds: next };
    }),
  setCloseDateFrom: (date) => set({ closeDateFrom: date }),
  setCloseDateTo: (date) => set({ closeDateTo: date }),
  clear: () =>
    set({
      ownerIds: new Set<string>(),
      closeDateFrom: null,
      closeDateTo: null
    })
}));
```

**Editorial notes:**

- Verbatim, full file.
- **Actual line count: 48 lines, including a 14-line docstring.** Without the docstring it's 32 lines. The `FilterState` interface alone is 11 lines. The `create()` call is ~20 lines.
- The article's current claim of "twelve lines" is too aggressive — even the leanest possible version of this store, with no comments and inline updaters, lands around 20 lines once the interface is included. **Recommend rewording the article's surrounding prose** to "fewer than thirty lines including the interface", or drop the line-count claim entirely and rely on the snippet to speak for itself.
- The store has four mutators (`toggleOwner`, `setCloseDateFrom`, `setCloseDateTo`, `clear`) and three pieces of state. Only `toggleOwner` does a non-trivial transform — the immutable Set update on lines 33–39. The rest are direct setters. The store size is honest about the boilerplate cost; trimming it for the article would misrepresent the pattern.
- Selector usage at the consumer side is one line per read, e.g. `const ownerIds = useFilterStore(s => s.ownerIds)`. That's where the "no boilerplate per consumer" claim earns its keep — not in this file. **Consider showing one consumer line alongside the store** in the article so the reader sees both halves of the API.
- The docstring explains the reasoning (which other files read the state, why Context wasn't enough). For the article, that prose is probably better integrated into the article body than left in the code block. Strip the docstring to its first sentence in the snippet, and use the rest as the article's narration.
