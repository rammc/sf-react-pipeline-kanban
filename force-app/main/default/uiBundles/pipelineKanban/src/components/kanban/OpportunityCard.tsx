import { useState } from 'react';
import { Link } from 'react-router';
import { startOfDay } from 'date-fns';
import { stageMeta, type StageCategory } from '@/lib/stageMeta';
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

const APPROACHING_WINDOW_DAYS = 14;

// Phase 10: date colours reference theme tokens, not raw hex.
// `--accent-warning` is deliberately a separate token from
// `--accent-stage-negotiation`: in Light Mode they share #a85d3e, but
// in Retro the stage accent shifts to red phosphor while the warning
// stays amber. Past-due dates should track the warning semantic, not
// the Negotiation stage identity.
const ARCHIVED_DATE = 'var(--ink-archived-muted)';
const PAST_DUE = 'var(--accent-warning)';
const APPROACHING = 'var(--ink)';
const FUTURE = 'var(--ink-muted)';

/**
 * Three-tier date colour for open-stage cards; closed-stage cards
 * always render in the muted archived tone (a Closed-Lost deal can
 * have a past CloseDate but should not alarm anyone).
 */
export function dateColor(closeDate: Date, category: StageCategory): string {
  if (category === 'closed') return ARCHIVED_DATE;

  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(closeDate).getTime();
  const daysUntil = Math.ceil((target - today) / 86_400_000);

  if (daysUntil < 0) return PAST_DUE;
  if (daysUntil <= APPROACHING_WINDOW_DAYS) return APPROACHING;
  return FUTURE;
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

  const meta = stageMeta(StageName);
  const isArchived = meta.category === 'closed';

  // Tonal split — closed stages render with reduced weight so the
  // active workspace dominates. Single conditional avoids scatter.
  // Phase 10: hex literals replaced with theme tokens so the split
  // survives Dark and Retro modes intact.
  const surfaceClass = isArchived ? 'bg-surface-archived' : 'bg-surface-card';
  const textClass = isArchived ? 'text-ink-archived' : 'text-ink';
  const ownerToneClass = isArchived ? 'text-ink-archived-muted' : 'text-ink-muted';

  const borderClasses = overlay
    ? 'border-ink shadow-md'
    : 'border-card-edge hover:border-card-edge-hover';

  const dateTone = dateColor(new Date(CloseDate), meta.category);

  return (
    <article
      className={`relative rounded-[4px] border transition-colors ${surfaceClass} ${borderClasses}`}
      style={{ borderLeft: `2px solid ${meta.accent}` }}
    >
      {/* Avatar — absolute top-right, neutral outline, no fill */}
      <span
        title={Owner.Name}
        aria-label={`Owner ${Owner.Name}`}
        className={`pointer-events-none absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-avatar-edge bg-transparent font-mono text-[10px] ${textClass}`}
      >
        {initials(Owner.Name) || '?'}
      </span>

      <div className="px-[14px] py-[12px]">
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
            className={`block text-left font-mono text-[16px] font-medium hover:underline disabled:cursor-default disabled:no-underline ${textClass}`}
            title={onUpdateAmount ? 'Click to edit amount' : undefined}
          >
            {formatCurrency(Amount)}
          </button>
        )}

        {/* Name links to the detail route. `stopPropagation` on
            pointer-down prevents dnd-kit from picking up the click as
            the start of a drag. Same pattern as the Amount-edit
            button above. The Link wraps the text only, not the
            card's padding, so most of the card's surface stays
            draggable. */}
        <Link
          to={`/opportunity/${Id}`}
          onPointerDown={e => e.stopPropagation()}
          className={`mt-[2px] block text-[14px] font-medium leading-tight pr-8 hover:underline ${textClass}`}
        >
          {Name}
        </Link>

        <p className="mt-[6px] text-[11px]">
          <span className="font-mono" style={{ color: dateTone }}>
            {formatCloseDate(CloseDate)}
          </span>
          <span className={`mx-1.5 ${ownerToneClass}`}>·</span>
          <span className={ownerToneClass}>{Owner.Name}</span>
        </p>
      </div>
    </article>
  );
}
