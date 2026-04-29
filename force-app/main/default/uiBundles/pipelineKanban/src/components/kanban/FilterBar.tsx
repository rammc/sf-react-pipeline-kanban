import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Opportunity } from '@/types/opportunity';
import { useFilterStore } from '@/store/filterStore';
import { initials } from '@/utils/format';

export interface FilterBarProps {
  opportunities: Opportunity[];
}

/**
 * Owner multi-select + CloseDate range. Filters are applied client-side
 * — the dataset is bounded at 200 rows by OPPORTUNITIES_QUERY, so a
 * round-trip per filter change would just add latency for no benefit.
 * See docs/ARCHITECTURE.md for the trade-off (Phase 6).
 */
export function FilterBar({ opportunities }: FilterBarProps) {
  const ownerIds = useFilterStore(s => s.ownerIds);
  const closeDateFrom = useFilterStore(s => s.closeDateFrom);
  const closeDateTo = useFilterStore(s => s.closeDateTo);
  const toggleOwner = useFilterStore(s => s.toggleOwner);
  const setCloseDateFrom = useFilterStore(s => s.setCloseDateFrom);
  const setCloseDateTo = useFilterStore(s => s.setCloseDateTo);
  const clear = useFilterStore(s => s.clear);

  // Owners surfaced from the loaded opportunities — no separate query.
  const owners = useMemo(() => {
    const seen = new Map<string, { Id: string; Name: string }>();
    for (const o of opportunities) {
      if (!seen.has(o.Owner.Id)) {
        seen.set(o.Owner.Id, { Id: o.Owner.Id, Name: o.Owner.Name });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );
  }, [opportunities]);

  const isFiltered =
    ownerIds.size > 0 || closeDateFrom !== null || closeDateTo !== null;

  return (
    <section
      className="flex flex-wrap items-end gap-4 px-6 py-3"
      aria-label="Pipeline filters"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">Owner</span>
        <div className="flex flex-wrap gap-1">
          {owners.length === 0 ? (
            <span className="text-[12px] text-ink-subtle">—</span>
          ) : (
            owners.map(o => {
              const active = ownerIds.has(o.Id);
              return (
                <Button
                  key={o.Id}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => toggleOwner(o.Id)}
                  aria-pressed={active}
                  title={o.Name}
                >
                  <span className="font-mono">{initials(o.Name) || '?'}</span>
                  <span className="ml-1 hidden md:inline">{o.Name}</span>
                </Button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="closeDateFrom"
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted"
        >
          Close from
        </label>
        <Input
          id="closeDateFrom"
          type="date"
          value={closeDateFrom ?? ''}
          onChange={e => setCloseDateFrom(e.target.value || null)}
          className="w-40 font-mono"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="closeDateTo"
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted"
        >
          Close to
        </label>
        <Input
          id="closeDateTo"
          type="date"
          value={closeDateTo ?? ''}
          onChange={e => setCloseDateTo(e.target.value || null)}
          className="w-40 font-mono"
        />
      </div>

      <div className="ml-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={!isFiltered}
        >
          Clear filters
        </Button>
      </div>
    </section>
  );
}
