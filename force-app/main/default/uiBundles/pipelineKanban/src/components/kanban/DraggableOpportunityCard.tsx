import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Opportunity } from '@/types/opportunity';
import { OpportunityCard } from './OpportunityCard';

export interface DraggableOpportunityCardProps {
  opportunity: Opportunity;
  onUpdateAmount: (id: string, next: number) => Promise<void>;
}

/**
 * Behavior wrapper around OpportunityCard. Keeps the visual component
 * (OpportunityCard) free of dnd-kit knowledge so it stays trivially
 * reusable in tests, Storybook, or static rendering.
 *
 * The drag payload carries the source stage so handleDragEnd can short-
 * circuit on no-op drops without re-querying the parent grouping.
 */
export function DraggableOpportunityCard({
  opportunity,
  onUpdateAmount,
}: DraggableOpportunityCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: opportunity.Id,
      data: { sourceStage: opportunity.StageName },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    // Source card stays partially visible while DragOverlay floats
    // the clone — gives the user a clear "this is where it came from"
    // signal without the rotate/shadow flourishes.
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <OpportunityCard opportunity={opportunity} onUpdateAmount={onUpdateAmount} />
    </div>
  );
}
