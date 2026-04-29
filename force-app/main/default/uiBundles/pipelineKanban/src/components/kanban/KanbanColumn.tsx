import { useDroppable } from '@dnd-kit/core';
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
  // dropping back where you came from is a no-op, no need to invite it.
  const draggingFromHere = opportunities.some(o => o.Id === draggingId);
  const showDropHighlight = isOver && !draggingFromHere;

  const totalAmount = opportunities.reduce(
    (sum, o) => sum + (o.Amount ?? 0),
    0
  );

  return (
    <section
      ref={setNodeRef}
      data-drop-active={showDropHighlight ? 'true' : undefined}
      className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 transition-colors data-[drop-active=true]:bg-primary/10 data-[drop-active=true]:ring-2 data-[drop-active=true]:ring-primary/40"
      aria-label={`Stage column ${stage.label}`}
    >
      <header className="flex items-baseline justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">{stage.label}</h2>
        <span className="text-xs text-muted-foreground">
          {opportunities.length} · {formatCurrency(totalAmount)}
        </span>
      </header>
      <div className="flex flex-col gap-2 overflow-y-auto p-2">
        {opportunities.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
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
