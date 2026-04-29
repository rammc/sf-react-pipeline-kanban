import { useState } from 'react';
import { stageAccent } from '@/lib/stageColors';
import type { Opportunity } from '@/types/opportunity';
import { formatCloseDate, formatCurrency, initials } from '@/utils/format';
import { InlineEditAmount } from './InlineEditAmount';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  /** Omitted on the DragOverlay clone — Amount becomes read-only. */
  onUpdateAmount?: (id: string, next: number) => Promise<void>;
  /** Render the dark-bordered, shadowed variant used inside DragOverlay. */
  overlay?: boolean;
}

export function OpportunityCard({
  opportunity,
  onUpdateAmount,
  overlay,
}: OpportunityCardProps) {
  const { Id, Name, Amount, CloseDate, StageName, Owner } = opportunity;
  const [editing, setEditing] = useState(false);

  async function handleSave(next: number) {
    if (!onUpdateAmount) {
      setEditing(false);
      return;
    }
    try {
      await onUpdateAmount(Id, next);
      setEditing(false);
    } catch {
      // KanbanBoard rolls state back and surfaces the toast; the
      // editor stays open so the user can correct or cancel.
    }
  }

  const accent = stageAccent(StageName);
  const borderClasses = overlay
    ? 'border-ink shadow-md'
    : 'border-card-edge hover:border-card-edge-hover';

  return (
    <article
      className={`relative rounded-[4px] border bg-surface-card transition-colors ${borderClasses}`}
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      {/* Avatar — absolute top-right, neutral outline, no fill */}
      <span
        title={Owner.Name}
        aria-label={`Owner ${Owner.Name}`}
        className="pointer-events-none absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#d8d4c8] bg-transparent font-mono text-[10px] text-ink"
      >
        {initials(Owner.Name) || '?'}
      </span>

      <div className="px-[14px] py-[12px]">
        {/* Amount — top-left, dominant. Click to edit. */}
        {editing && onUpdateAmount ? (
          <InlineEditAmount
            initialAmount={Amount}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onUpdateAmount && setEditing(true)}
            disabled={!onUpdateAmount}
            className="block text-left font-mono text-[16px] font-medium text-ink hover:underline disabled:cursor-default disabled:no-underline"
            title={onUpdateAmount ? 'Click to edit amount' : undefined}
          >
            {formatCurrency(Amount)}
          </button>
        )}

        {/* Account name */}
        <p className="mt-[2px] text-[14px] font-medium text-ink leading-tight pr-8">
          {Name}
        </p>

        {/* Footer — date · owner */}
        <p className="mt-[6px] text-[11px] text-ink-muted">
          <span className="font-mono">{formatCloseDate(CloseDate)}</span>
          <span className="mx-1.5">·</span>
          <span>{Owner.Name}</span>
        </p>
      </div>
    </article>
  );
}
