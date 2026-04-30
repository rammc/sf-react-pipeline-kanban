import { Link, useParams } from 'react-router';
import { stageMeta } from '@/lib/stageMeta';
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail';
import {
  formatCloseDate,
  formatCurrency,
  initials,
} from '@/utils/format';

export function OpportunityDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { opportunity, activity, loading, notFound, error, activityError } =
    useOpportunityDetail(id);

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-6">
      <header className="mb-6">
        <Link
          to="/"
          className="text-[12px] text-ink-muted hover:text-ink hover:underline"
        >
          ‹ Back to board
        </Link>
      </header>

      {loading && <DetailSkeleton />}
      {notFound && <NotFoundPanel />}
      {error && !notFound && <ErrorPanel error={error} />}

      {opportunity && (
        <>
          <OpportunitySection opportunity={opportunity} />
          <ActivitySection items={activity} error={activityError} />
        </>
      )}
    </div>
  );
}

function OpportunitySection({
  opportunity,
}: {
  opportunity: NonNullable<ReturnType<typeof useOpportunityDetail>['opportunity']>;
}) {
  const { Name, Amount, CloseDate, StageName, Description, Owner, Account } =
    opportunity;
  const meta = stageMeta(StageName);

  return (
    <section className="mb-8 rounded border border-card-edge bg-surface-card p-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[20px] font-medium text-ink">{Name}</h1>
        <span
          className="shrink-0 rounded px-2 py-1 font-mono text-[11px]"
          style={{
            border: `1px solid ${meta.accent}`,
            color: meta.accent,
          }}
        >
          {StageName} · {meta.probability}%
        </span>
      </div>

      <p className="mt-2 font-mono text-[14px] text-ink">
        {formatCurrency(Amount)}
        <span className="mx-2 text-ink-subtle">·</span>
        <span className="text-ink-muted">Closes {formatCloseDate(CloseDate)}</span>
      </p>

      <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
        <dt className="text-ink-muted">Owner</dt>
        <dd className="flex items-center gap-2 text-ink">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-avatar-edge font-mono text-[10px]"
            aria-hidden
          >
            {initials(Owner.Name) || '?'}
          </span>
          {Owner.Name}
        </dd>

        <dt className="text-ink-muted">Account</dt>
        <dd className="text-ink">{Account?.Name ?? '—'}</dd>

        {Description ? (
          <>
            <dt className="text-ink-muted">Description</dt>
            <dd className="whitespace-pre-line text-ink">{Description}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}

function ActivitySection({
  items,
  error,
}: {
  items: ReturnType<typeof useOpportunityDetail>['activity'];
  error: Error | null;
}) {
  return (
    <section>
      <h2 className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        Activity
      </h2>

      {error ? (
        <p className="text-[12px] text-ink-muted">
          Couldn't load activity. {error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-ink-muted">
          No activity yet. Activity is queried via GraphQL on the related Task
          object; the seeded demo data doesn't include any.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map(item => (
            <li
              key={item.Id}
              className="border-l-2 border-card-edge pl-3"
            >
              <p className="text-[11px] text-ink-muted">
                <span className="font-mono">
                  {item.ActivityDate
                    ? formatCloseDate(item.ActivityDate)
                    : 'Undated'}
                </span>
                <span className="mx-1.5">·</span>
                {item.OwnerName}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink">
                {item.Subject}
              </p>
              {item.Description ? (
                <p className="mt-1 whitespace-pre-line text-[12px] text-ink-muted">
                  {item.Description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-32 rounded border border-card-edge bg-card-edge/30" />
      <div className="h-4 w-32 rounded bg-card-edge/40" />
      <div className="h-4 w-3/4 rounded bg-card-edge/40" />
      <div className="h-4 w-1/2 rounded bg-card-edge/40" />
    </div>
  );
}

function NotFoundPanel() {
  return (
    <div className="rounded border border-card-edge bg-surface-card p-6 text-[13px]">
      <h1 className="mb-2 text-[18px] font-medium text-ink">
        Opportunity not found.
      </h1>
      <p className="text-ink-muted">
        The record may have been deleted, or the id in the URL doesn't match
        any record you can access.
      </p>
      <p className="mt-3">
        <Link to="/" className="text-ink hover:underline">
          ‹ Back to board
        </Link>
      </p>
    </div>
  );
}

function ErrorPanel({ error }: { error: Error }) {
  return (
    <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-[13px]">
      <strong className="font-medium">Failed to load opportunity.</strong>{' '}
      {error.message}
    </div>
  );
}
