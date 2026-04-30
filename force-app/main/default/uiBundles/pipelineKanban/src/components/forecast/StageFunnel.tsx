import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { stageMeta } from '@/lib/stageMeta';
import type { Opportunity, Stage } from '@/types/opportunity';
import { formatCurrency } from '@/utils/format';

export interface StageFunnelProps {
  opportunities: Opportunity[];
  stages: Stage[];
  /** Click on a segment — used by KanbanBoard to scroll the column into view. */
  onStageClick?: (stageName: string) => void;
}

export interface Segment {
  stage: Stage;
  count: number;
  sum: number;
  accent: string;
  archived: boolean;
}

/**
 * Pure data transform — exported separately so tests can assert
 * aggregations without standing up Recharts.
 */
export function computeSegments(
  opportunities: Opportunity[],
  stages: Stage[]
): Segment[] {
  const counts = new Map<string, { count: number; sum: number }>();
  for (const stage of stages) counts.set(stage.value, { count: 0, sum: 0 });
  for (const o of opportunities) {
    const row = counts.get(o.StageName);
    if (row) {
      row.count += 1;
      row.sum += o.Amount ?? 0;
    }
  }
  return stages.map(stage => {
    const meta = stageMeta(stage.value);
    const c = counts.get(stage.value) ?? { count: 0, sum: 0 };
    return {
      stage,
      count: c.count,
      sum: c.sum,
      accent: meta.accent,
      archived: meta.category === 'closed',
    };
  });
}

/**
 * One-row horizontal stacked bar; segment width = deal count per stage.
 * Stage accent colours come from STAGE_META, archived stages render
 * at reduced opacity to mirror the active/archived tonal split on
 * the cards. Click forwards the stage name so the parent can focus
 * the matching column — this is what makes the chart navigational
 * rather than decorative.
 */
export function StageFunnel({
  opportunities,
  stages,
  onStageClick,
}: StageFunnelProps) {
  const segments: Segment[] = useMemo(
    () => computeSegments(opportunities, stages),
    [opportunities, stages]
  );

  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) return null;

  // One row of stacked Bars: each Bar carries its own dataKey =
  // stage value, so Recharts paints them side-by-side via stackId.
  const row = Object.fromEntries(segments.map(s => [s.stage.value, s.count]));

  return (
    <div
      className="h-8 w-[140px]"
      role="img"
      aria-label={`Pipeline funnel — ${total} deals across ${stages.length} stages`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={[row]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <YAxis type="category" hide dataKey="_" />
          <Tooltip
            cursor={false}
            wrapperStyle={{ outline: 'none' }}
            content={<FunnelTooltip segments={segments} />}
          />
          {segments.map(seg => (
            <Bar
              key={seg.stage.value}
              dataKey={seg.stage.value}
              stackId="funnel"
              isAnimationActive={false}
              onClick={onStageClick ? () => onStageClick(seg.stage.value) : undefined}
              cursor={onStageClick ? 'pointer' : 'default'}
              activeBar={{ stroke: '#1a1a1a', strokeWidth: 1.5 }}
            >
              <Cell
                fill={seg.accent}
                fillOpacity={seg.archived ? 0.4 : 1}
                data-archived={seg.archived || undefined}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
}

function FunnelTooltip({
  segments,
  payload,
}: {
  segments: Segment[];
  payload?: TooltipPayloadEntry[];
}) {
  const hovered = payload?.[0];
  if (!hovered) return null;
  const stageName = String(hovered.dataKey ?? '');
  const seg = segments.find(s => s.stage.value === stageName);
  if (!seg) return null;
  return (
    <div className="rounded border border-card-edge bg-surface-card px-2 py-1 text-[11px] shadow-md">
      <div className="font-medium text-ink">{seg.stage.label}</div>
      <div className="font-mono text-ink-muted">
        {seg.count} · {formatCurrency(seg.sum)}
      </div>
    </div>
  );
}
