import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toast } from '@/components/ui/sonner';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useStages } from '@/hooks/useStages';
import { useUpdateStage } from '@/hooks/useUpdateStage';
import type { Opportunity } from '@/types/opportunity';
import { BoardSkeleton } from './BoardSkeleton';
import { EmptyState } from './EmptyState';
import { KanbanColumn } from './KanbanColumn';
import { OpportunityCard } from './OpportunityCard';

function groupByStage(opps: Opportunity[]): Map<string, Opportunity[]> {
  const grouped = new Map<string, Opportunity[]>();
  for (const o of opps) {
    const list = grouped.get(o.StageName);
    if (list) list.push(o);
    else grouped.set(o.StageName, [o]);
  }
  return grouped;
}

export function KanbanBoard() {
  const { opportunities, loading: oppLoading, error: oppError } = useOpportunities();
  const { stages, loading: stageLoading, error: stageError } = useStages();
  const { mutate: updateStage } = useUpdateStage();

  // Local optimistic copy. Server data is source of truth on first load
  // and after refetches; in between, we apply edits here immediately and
  // roll back if the mutation rejects. This is the central "why React"
  // moment of the repo — instant UI, server reconciles afterwards.
  const [localOpps, setLocalOpps] = useState<Opportunity[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLocalOpps(opportunities);
  }, [opportunities]);

  const grouped = useMemo(() => groupByStage(localOpps), [localOpps]);
  const draggingCard = activeId
    ? localOpps.find(o => o.Id === activeId) ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const oppId = String(active.id);
    const targetStage = String(over.id);
    const sourceStage = active.data.current?.sourceStage as string | undefined;
    if (!sourceStage || sourceStage === targetStage) return;

    // Snapshot for rollback.
    const previous = localOpps;
    setLocalOpps(prev =>
      prev.map(o => (o.Id === oppId ? { ...o, StageName: targetStage } : o))
    );

    try {
      await updateStage(oppId, targetStage);
    } catch (err) {
      setLocalOpps(previous);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Couldn't move to "${targetStage}"`, {
        description: message,
      });
    }
  }

  if (oppLoading || stageLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] min-w-0 gap-4 p-4">
        <div className="flex min-w-0 flex-1">
          <BoardSkeleton />
        </div>
        <aside className="hidden w-72 shrink-0 lg:block" aria-label="Forecast sidebar (placeholder)" />
      </div>
    );
  }

  if (oppError || stageError) {
    const message = oppError?.message ?? stageError?.message ?? 'Unknown error';
    return (
      <div className="m-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <strong>Failed to load pipeline.</strong> {message}
      </div>
    );
  }

  if (localOpps.length === 0) {
    return <EmptyState />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
        <main
          className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-2"
          aria-label="Pipeline board"
        >
          {stages.map(stage => (
            <KanbanColumn
              key={stage.value}
              stage={stage}
              opportunities={grouped.get(stage.value) ?? []}
              draggingId={activeId}
            />
          ))}
        </main>
        <aside
          className="hidden w-72 shrink-0 lg:block"
          aria-label="Forecast sidebar (placeholder)"
        />
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingCard ? (
          <div className="w-72 rotate-1 cursor-grabbing opacity-95 shadow-lg">
            <OpportunityCard opportunity={draggingCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
