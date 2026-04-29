import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Opportunity } from '@/types/opportunity';
import { formatCloseDate, formatCurrency, initials } from '@/utils/format';
import { InlineEditAmount } from './InlineEditAmount';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  /** Optional — when omitted, Amount renders read-only (DragOverlay copy). */
  onUpdateAmount?: (id: string, next: number) => Promise<void>;
}

// Salesforce profile-photo URLs need a session cookie that the dev
// proxy can't inject. Skip them in dev; production opt-in via PROD.
const ALLOW_PROFILE_PHOTOS = import.meta.env.PROD;

export function OpportunityCard({
  opportunity,
  onUpdateAmount,
}: OpportunityCardProps) {
  const { Id, Name, Amount, CloseDate, Owner } = opportunity;
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
      // KanbanBoard rolls state back and surfaces the toast; we keep
      // the editor open so the user can correct or cancel.
    }
  }

  return (
    <Card size="sm" className="hover:ring-foreground/30 transition">
      <CardHeader className="pb-1">
        <CardTitle className="line-clamp-2 text-sm font-medium">
          {Name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
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
              className="text-left font-mono text-foreground hover:underline disabled:cursor-default disabled:no-underline"
              title={onUpdateAmount ? 'Click to edit amount' : undefined}
            >
              {formatCurrency(Amount)}
            </button>
          )}
          <span>{formatCloseDate(CloseDate)}</span>
          <span className="truncate">{Owner.Name}</span>
        </div>
        <Avatar size="sm" title={Owner.Name}>
          {ALLOW_PROFILE_PHOTOS && Owner.SmallPhotoUrl && (
            <AvatarImage src={Owner.SmallPhotoUrl} alt={Owner.Name} />
          )}
          <AvatarFallback>{initials(Owner.Name) || '?'}</AvatarFallback>
        </Avatar>
      </CardContent>
    </Card>
  );
}
