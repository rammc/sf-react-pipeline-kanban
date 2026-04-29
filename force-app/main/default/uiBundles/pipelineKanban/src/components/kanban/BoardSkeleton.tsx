import { Skeleton } from '@/components/ui/skeleton';

const COLUMN_COUNT = 4;
const CARDS_PER_COLUMN = 3;

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-2" aria-busy="true">
      {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
        <section
          key={c}
          className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40"
        >
          <header className="flex items-center justify-between border-b px-3 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </header>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: CARDS_PER_COLUMN }).map((_, r) => (
              <Skeleton key={r} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
