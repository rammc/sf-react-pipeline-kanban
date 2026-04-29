import { useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useStages } from '@/hooks/useStages';
import type { Opportunity } from '@/types/opportunity';
import { BoardSkeleton } from './BoardSkeleton';
import { EmptyState } from './EmptyState';
import { KanbanColumn } from './KanbanColumn';

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

  const grouped = useMemo(() => groupByStage(opportunities), [opportunities]);

  // First-paint loading: both hooks resolving from scratch.
  if (oppLoading || stageLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] min-w-0 gap-4 p-4">
        <div className="flex min-w-0 flex-1">
          <BoardSkeleton />
        </div>
        {/* Sidebar slot — Phase 5 places the ForecastSidebar here. */}
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

  if (opportunities.length === 0) {
    return <EmptyState />;
  }

  return (
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
          />
        ))}
      </main>
      {/* Sidebar slot — Phase 5 places the ForecastSidebar here. */}
      <aside
        className="hidden w-72 shrink-0 lg:block"
        aria-label="Forecast sidebar (placeholder)"
      />
    </div>
  );
}
