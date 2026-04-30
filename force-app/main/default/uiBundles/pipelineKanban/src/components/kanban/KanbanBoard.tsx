import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useUpdateAmount } from '@/hooks/useUpdateAmount';
import { useFilterStore } from '@/store/filterStore';
import { stageMeta } from '@/lib/stageMeta';
import type { Opportunity, Stage } from '@/types/opportunity';
import { CloseDateHeatmap } from '@/components/heatmap/CloseDateHeatmap';
import { BoardSkeleton } from './BoardSkeleton';
import { EmptyState } from './EmptyState';
import { FilterBar } from './FilterBar';
import { ForecastBar } from './ForecastBar';
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

/**
 * Index of the first stage where category transitions from 'open' to
 * 'closed' in the rendered order. -1 when no transition exists
 * (all-open orgs, all-closed orgs, or orgs whose closed stages happen
 * to come before any open stage).
 */
function findOpenClosedBoundary(stages: Stage[]): number {
  for (let i = 1; i < stages.length; i++) {
    if (
      stageMeta(stages[i].value).category === 'closed' &&
      stageMeta(stages[i - 1].value).category === 'open'
    ) {
      return i;
    }
  }
  return -1;
}

export function KanbanBoard() {
  const { opportunities, loading: oppLoading, error: oppError } = useOpportunities();
  const { stages, loading: stageLoading, error: stageError } = useStages();
  const { mutate: updateStage } = useUpdateStage();
  const { mutate: updateAmount } = useUpdateAmount();

  const ownerIds = useFilterStore(s => s.ownerIds);
  const closeDateFrom = useFilterStore(s => s.closeDateFrom);
  const closeDateTo = useFilterStore(s => s.closeDateTo);

  const [localOpps, setLocalOpps] = useState<Opportunity[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedStage, setFocusedStage] = useState<string | null>(null);
  const columnRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalOpps(opportunities);
  }, [opportunities]);

  useEffect(() => {
    return () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    };
  }, []);

  /**
   * Click target from the funnel chart — scroll the matching column
   * into the centre of the board's horizontal scroll area, then
   * flash its header background for 1.5s. Pure UX glue, no business
   * logic.
   */
  const focusColumn = useCallback((stageName: string) => {
    const node = columnRefs.current.get(stageName);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    setFocusedStage(stageName);
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => {
      setFocusedStage(prev => (prev === stageName ? null : prev));
    }, 1500);
  }, []);

  // Two-stage filter so the heatmap (which itself drives the
  // close-date filter) reads only the owner-filtered set. Without
  // this split, clicking a heatmap cell would shrink its own input
  // to a single day and the heatmap would visually collapse — a
  // navigation surface that destroys its own context after one click.
  const ownerFilteredOpps = useMemo(() => {
    if (ownerIds.size === 0) return localOpps;
    return localOpps.filter(o => ownerIds.has(o.Owner.Id));
  }, [localOpps, ownerIds]);

  const visibleOpps = useMemo(() => {
    if (!closeDateFrom && !closeDateTo) return ownerFilteredOpps;
    return ownerFilteredOpps.filter(o => {
      if (closeDateFrom && o.CloseDate < closeDateFrom) return false;
      if (closeDateTo && o.CloseDate > closeDateTo) return false;
      return true;
    });
  }, [ownerFilteredOpps, closeDateFrom, closeDateTo]);

  const grouped = useMemo(() => groupByStage(visibleOpps), [visibleOpps]);
  const boundaryIndex = useMemo(() => findOpenClosedBoundary(stages), [stages]);
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

    const previous = localOpps;
    setLocalOpps(prev =>
      prev.map(o => (o.Id === oppId ? { ...o, StageName: targetStage } : o))
    );
    try {
      await updateStage(oppId, targetStage);
    } catch (err) {
      setLocalOpps(previous);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Couldn't move to "${targetStage}"`, { description: message });
    }
  }

  async function handleUpdateAmount(oppId: string, next: number) {
    const previous = localOpps;
    setLocalOpps(prev =>
      prev.map(o => (o.Id === oppId ? { ...o, Amount: next } : o))
    );
    try {
      await updateAmount(oppId, next);
    } catch (err) {
      setLocalOpps(previous);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error("Couldn't update amount", { description: message });
      throw err;
    }
  }

  if (oppLoading || stageLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex flex-1 min-h-0 gap-4 px-6 py-4">
          <BoardSkeleton />
        </div>
      </div>
    );
  }

  if (oppError || stageError) {
    const message = oppError?.message ?? stageError?.message ?? 'Unknown error';
    return (
      <div className="m-6 rounded border border-destructive/40 bg-destructive/5 p-4 text-[13px]">
        <strong className="font-medium">Failed to load pipeline.</strong>{' '}
        {message}
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
      {/* h-16 is AppLayout's nav. Everything below it lives in this
          flex column, so the board scrolls horizontally without
          consuming the vertical viewport. */}
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <FilterBar opportunities={localOpps} />
        {/* ForecastBar (flex-grow) + Heatmap (fixed width) on one
            row. The wrapper carries the surface + bottom border so
            the two children read as a single companion strip rather
            than as two stacked panels with mismatched heights. */}
        <div className="flex flex-wrap items-start border-b border-card-edge bg-surface-card">
          <ForecastBar
            opportunities={visibleOpps}
            stages={stages}
            onStageClick={focusColumn}
          />
          <div
            aria-hidden
            className="my-3 hidden w-px self-stretch bg-card-edge md:block"
          />
          <CloseDateHeatmap opportunities={ownerFilteredOpps} />
        </div>
        <main
          className="flex min-h-0 flex-1 gap-4 overflow-x-auto px-6 py-4"
          aria-label="Pipeline board"
        >
          {stages.map((stage, i) => (
            <Fragment key={stage.value}>
              {i === boundaryIndex && (
                <div
                  aria-hidden
                  className="w-px self-stretch bg-card-edge"
                />
              )}
              <KanbanColumn
                stage={stage}
                opportunities={grouped.get(stage.value) ?? []}
                draggingId={activeId}
                onUpdateAmount={handleUpdateAmount}
                focused={focusedStage === stage.value}
                registerRef={node => columnRefs.current.set(stage.value, node)}
              />
            </Fragment>
          ))}
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingCard ? (
          <div className="w-72 cursor-grabbing">
            <OpportunityCard opportunity={draggingCard} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
