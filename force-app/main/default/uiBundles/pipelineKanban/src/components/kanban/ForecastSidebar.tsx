import { useMemo } from 'react';
import type { Opportunity, Stage } from '@/types/opportunity';
import { formatCurrency } from '@/utils/format';

export interface ForecastSidebarProps {
  opportunities: Opportunity[];
  stages: Stage[];
}

/**
 * Pure client-side forecast — derived from the same `opportunities`
 * the board renders. No extra API calls, no zustand subscription:
 * everything in this component is a useMemo over props.
 *
 *   weightedTotal = Σ Amount × stage.probability
 *
 * This is the second teaching beat of the repo (after optimistic DnD):
 * once data is in React state, projections like forecasts are cheap.
 * The same view in LWC would either need an Apex aggregator or a
 * heavy reactive-tracking dance.
 */
export function ForecastSidebar({
  opportunities,
  stages,
}: ForecastSidebarProps) {
  const stageIndex = useMemo(
    () => new Map(stages.map(s => [s.value, s])),
    [stages]
  );

  const summary = useMemo(() => {
    let totalAmount = 0;
    let weightedTotal = 0;
    const perStage = new Map<
      string,
      { stage: Stage; count: number; sum: number; weighted: number }
    >();

    for (const stage of stages) {
      perStage.set(stage.value, {
        stage,
        count: 0,
        sum: 0,
        weighted: 0,
      });
    }

    for (const opp of opportunities) {
      const stage = stageIndex.get(opp.StageName);
      const amount = opp.Amount ?? 0;
      totalAmount += amount;
      const weighted = amount * (stage?.probability ?? 0);
      weightedTotal += weighted;
      const row = perStage.get(opp.StageName);
      if (row) {
        row.count += 1;
        row.sum += amount;
        row.weighted += weighted;
      }
    }

    return { totalAmount, weightedTotal, perStage: Array.from(perStage.values()) };
  }, [opportunities, stages, stageIndex]);

  return (
    <aside
      className="flex w-72 shrink-0 flex-col gap-4 rounded-lg border bg-card p-4 text-sm"
      aria-label="Forecast"
    >
      <header className="border-b pb-2">
        <h2 className="text-base font-semibold">Forecast</h2>
        <p className="text-xs text-muted-foreground">
          {opportunities.length} opportunities in view
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-y-2">
        <dt className="text-xs text-muted-foreground">Total pipeline</dt>
        <dd className="text-right font-mono">
          {formatCurrency(summary.totalAmount)}
        </dd>
        <dt className="text-xs text-muted-foreground">Weighted forecast</dt>
        <dd className="text-right font-mono font-semibold">
          {formatCurrency(summary.weightedTotal)}
        </dd>
      </dl>

      <div className="border-t pt-2">
        <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
          By stage
        </h3>
        <table className="w-full text-xs">
          <tbody>
            {summary.perStage.map(row => (
              <tr
                key={row.stage.value}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-1 pr-1">
                  {row.stage.label}{' '}
                  <span className="text-muted-foreground">
                    ({Math.round(row.stage.probability * 100)}%)
                  </span>
                </td>
                <td className="py-1 text-right text-muted-foreground">
                  {row.count}
                </td>
                <td className="py-1 pl-2 text-right font-mono">
                  {formatCurrency(row.weighted)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
