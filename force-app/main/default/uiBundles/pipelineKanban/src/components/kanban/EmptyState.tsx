import { Inbox } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-3 size-10 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-semibold">No opportunities yet</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Run{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          sf apex run --file scripts/seed-opportunities.apex
        </code>{' '}
        to populate the board with demo data.
      </p>
    </div>
  );
}
