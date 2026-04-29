import { useDroppable } from '@dnd-kit/core';
import { stageAccent } from '@/lib/stageColors';
import type { Opportunity, Stage } from '@/types/opportunity';
import { formatCurrency } from '@/utils/format';
import { DraggableOpportunityCard } from './DraggableOpportunityCard';

export interface KanbanColumnProps {
  stage: Stage;
  opportunities: Opportunity[];
  /** ID of the card currently being dragged, if any. */
  draggingId: string | null;
  onUpdateAmount: (id: string, next: number) => Promise<void>;
}

export function KanbanColumn({
  stage,
  opportunities,
  draggingId,
  onUpdateAmount,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  // Suppress the highlight when the drag started inside this column —
  // dropping back where you came from is a no-op.
  const draggingFromHere = opportunities.some(o => o.Id === draggingId);
  const showDropHighlight = isOver && !draggingFromHere;

  const totalAmount = opportunities.reduce(
    (sum, o) => sum + (o.Amount ?? 0),
    0
  );

  const accent = stageAccent(stage.value);
  const probabilityPct = Math.round(stage.probability * 100);

  return (
    <section
      ref={setNodeRef}
      data-drop-active={showDropHighlight ? 'true' : undefined}
      className="flex w-72 shrink-0 flex-col transition-colors data-[drop-active=true]:bg-card-edge/40"
      aria-label={`Stage column ${stage.label}`}
    >
      <header
        className="flex items-baseline justify-between pb-1.5"
        style={{ borderBottom: `2px solid ${accent}` }}
      >
        <div className="flex items-baseline gap-2">
          <h2 className="text-[13px] font-medium text-ink">{stage.label}</h2>
          <span className="font-mono text-[11px] text-ink-muted">
            {probabilityPct}%
          </span>
        </div>
        <span className="font-mono text-[12px] text-ink">
          {opportunities.length} · {formatCurrency(totalAmount)}
        </span>
      </header>

      <div className="flex flex-col gap-2 overflow-y-auto pt-2">
        {opportunities.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-ink-subtle">
            No opportunities
          </p>
        ) : (
          opportunities.map(opp => (
            <DraggableOpportunityCard
              key={opp.Id}
              opportunity={opp}
              onUpdateAmount={onUpdateAmount}
            />
          ))
        )}
      </div>
    </section>
  );
}
