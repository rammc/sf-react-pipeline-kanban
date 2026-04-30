import { useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StageFunnel } from '@/components/forecast/StageFunnel';
import { stageMeta } from '@/lib/stageMeta';
import type { Opportunity, Stage } from '@/types/opportunity';
import { formatCurrency } from '@/utils/format';

export interface ForecastBarProps {
  opportunities: Opportunity[];
  stages: Stage[];
  /** Forwarded to StageFunnel — KanbanBoard scrolls the column into view. */
  onStageClick?: (stageName: string) => void;
}

/**
 * Top-of-board summary strip. Replaced the ~280px right-side
 * sidebar from Phase 5 — that layout cost permanent screen real
 * estate and clipped the rightmost column on viewports below
 * ~1500px.
 *
 * The by-stage breakdown moved into a Popover behind a small
 * "Show breakdown" trigger. Default view is three numbers; details
 * are an explicit click.
 */
export function ForecastBar({
  opportunities,
  stages,
  onStageClick,
}: ForecastBarProps) {
  const summary = useMemo(() => {
    let totalAmount = 0;
    let weightedTotal = 0;
    const perStage = new Map<
      string,
      { stage: Stage; probability: number; count: number; sum: number; weighted: number }
    >();

    for (const stage of stages) {
      perStage.set(stage.value, {
        stage,
        probability: stageMeta(stage.value).probability,
        count: 0,
        sum: 0,
        weighted: 0,
      });
    }

    for (const opp of opportunities) {
      const amount = opp.Amount ?? 0;
      const probability = stageMeta(opp.StageName).probability;
      const weighted = (amount * probability) / 100;
      totalAmount += amount;
      weightedTotal += weighted;
      const row = perStage.get(opp.StageName);
      if (row) {
        row.count += 1;
        row.sum += amount;
        row.weighted += weighted;
      }
    }

    return {
      totalAmount,
      weightedTotal,
      perStage: Array.from(perStage.values()),
    };
  }, [opportunities, stages]);

  return (
    <div
      className="flex h-12 flex-1 min-w-0 items-center justify-between px-6"
      aria-label="Forecast summary"
    >
      <dl className="flex items-center gap-x-4 text-[14px]">
        <Cell label="Total" value={formatCurrency(summary.totalAmount)} />
        <Sep />
        <Cell label="Weighted" value={formatCurrency(summary.weightedTotal)} />
        <Sep />
        <Cell label="Deals" value={String(opportunities.length)} />
      </dl>

      {/* Funnel slot — sits between the aggregates and the breakdown
          trigger at viewports ≥ 1280px (xl: in Tailwind). Hides on
          narrower screens so the text values + popover keep working. */}
      <div className="ml-4 mr-auto hidden xl:block">
        <StageFunnel
          opportunities={opportunities}
          stages={stages}
          onStageClick={onStageClick}
        />
      </div>

      <Popover>
        <PopoverTrigger className="text-[12px] text-ink-muted hover:text-ink hover:underline focus-visible:outline-none focus-visible:underline">
          Show breakdown
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 border-card-edge bg-surface-card p-3 text-[12px]"
        >
          <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            By stage
          </h3>
          <table className="w-full">
            <tbody>
              {summary.perStage.map(row => (
                <tr
                  key={row.stage.value}
                  className="border-b border-card-edge/60 last:border-0"
                >
                  <td className="py-1 pr-2">
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-[1px]"
                      style={{ background: stageMeta(row.stage.value).accent }}
                      aria-hidden
                    />
                    {row.stage.label}
                    <span className="ml-1 font-mono text-ink-muted">
                      {row.probability}%
                    </span>
                  </td>
                  <td className="py-1 text-right font-mono text-ink-muted">
                    {row.count}
                  </td>
                  <td className="py-1 pl-2 text-right font-mono text-ink">
                    {formatCurrency(row.weighted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </dt>
      <dd className="font-mono text-[14px] text-ink">{value}</dd>
    </div>
  );
}

function Sep() {
  return <span className="text-ink-subtle">·</span>;
}
