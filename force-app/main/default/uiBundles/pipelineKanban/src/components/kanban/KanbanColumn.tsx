import type { Opportunity, Stage } from '@/types/opportunity';
import { formatCurrency } from '@/utils/format';
import { OpportunityCard } from './OpportunityCard';

export interface KanbanColumnProps {
  stage: Stage;
  opportunities: Opportunity[];
}

export function KanbanColumn({ stage, opportunities }: KanbanColumnProps) {
  const totalAmount = opportunities.reduce(
    (sum, o) => sum + (o.Amount ?? 0),
    0
  );

  return (
    <section
      className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40"
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
            <OpportunityCard key={opp.Id} opportunity={opp} />
          ))
        )}
      </div>
    </section>
  );
}
