import { useEffect, useMemo, useState } from 'react';
import { bucketByDay, getWeekGrid, isoDay } from '@/lib/dateBuckets';
import { useFilterStore } from '@/store/filterStore';
import type { Opportunity } from '@/types/opportunity';

const STORAGE_KEY = 'pipeline-kanban:heatmap-expanded';

export interface CloseDateHeatmapProps {
  /** Owner-filtered opportunities. The heatmap drives the close-date
   *  filter itself, so it must NOT receive a date-filtered subset. */
  opportunities: Opportunity[];
}

const WEEKS = 12;
const CELL_W = 18;
const CELL_H = 14;
const GAP = 2;
const RADIUS = 2;
const WEEKDAY_LABEL_H = 14;
const WEEK_LABEL_W = 24;

const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// Six absolute color steps — never normalised against the maximum.
// Same day stays the same colour whether you're looking at an
// owner-filtered set or the full pipeline.
function colorForCount(n: number): string {
  if (n <= 0) return '#f5f3ec';
  if (n === 1) return '#e8e2d2';
  if (n === 2) return '#d8c8a8';
  if (n === 3) return '#c4a878';
  if (n === 4) return '#b8854a';
  return '#a85d3e';
}

interface HoverState {
  date: Date;
  count: number;
  x: number;
  y: number;
}

export function CloseDateHeatmap({ opportunities }: CloseDateHeatmapProps) {
  const closeDateFrom = useFilterStore(s => s.closeDateFrom);
  const closeDateTo = useFilterStore(s => s.closeDateTo);
  const setCloseDateFrom = useFilterStore(s => s.setCloseDateFrom);
  const setCloseDateTo = useFilterStore(s => s.setCloseDateTo);

  const today = useMemo(() => new Date(), []);
  const grid = useMemo(() => getWeekGrid(today, WEEKS), [today]);
  const counts = useMemo(
    () => bucketByDay(opportunities, today, WEEKS),
    [opportunities, today]
  );

  const [hover, setHover] = useState<HoverState | null>(null);

  // Expanded by default. Persisted to localStorage so the choice
  // survives reloads — the heatmap is informational, not central,
  // and a sales manager who's hidden it once shouldn't have to
  // hide it on every page load. Wrapped in try/catch because some
  // sandboxed contexts (and jsdom under fake timers) leave the API
  // shaped wrong.
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const stored = window.localStorage?.getItem?.(STORAGE_KEY);
      return stored === null || stored === undefined ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      window.localStorage?.setItem?.(STORAGE_KEY, String(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  // Currently-selected single day, if the filter is set to one day.
  const selectedDay =
    closeDateFrom && closeDateFrom === closeDateTo ? closeDateFrom : null;

  const totalWidth = WEEK_LABEL_W + 7 * CELL_W + 6 * GAP;
  const totalHeight = WEEKDAY_LABEL_H + WEEKS * CELL_H + (WEEKS - 1) * GAP;

  function onCellClick(day: Date) {
    const key = isoDay(day);
    if (selectedDay === key) {
      setCloseDateFrom(null);
      setCloseDateTo(null);
    } else {
      setCloseDateFrom(key);
      setCloseDateTo(key);
    }
  }

  return (
    <section
      className="relative shrink-0 px-3 py-2"
      onMouseLeave={() => setHover(null)}
      aria-label="Close-date heatmap, next 12 weeks"
    >
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-controls="heatmap-grid"
        className="flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:underline"
      >
        <span
          aria-hidden
          className="inline-block transition-transform duration-150"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ›
        </span>
        Closes · 12 weeks
      </button>

      {!expanded ? null : (
      <div id="heatmap-grid" className="mt-1.5">
      <svg
        width={totalWidth}
        height={totalHeight}
        className="block"
        role="img"
        aria-label={`Heatmap of opportunities by close date over the next ${WEEKS} weeks`}
      >
        {/* Weekday labels along the top */}
        {DAY_LABELS.map((label, i) => (
          <text
            key={label}
            x={WEEK_LABEL_W + i * (CELL_W + GAP) + CELL_W / 2}
            y={10}
            textAnchor="middle"
            fontSize={9}
            fontFamily="Geist Mono, ui-monospace, monospace"
            letterSpacing="1"
            fill="#7a7770"
          >
            {label}
          </text>
        ))}

        {grid.map((week, weekIdx) => {
          const firstOfMonthInWeek = week.find(d => d.getDate() === 1);
          return (
            <g key={weekIdx}>
              {firstOfMonthInWeek && (
                <text
                  x={0}
                  y={WEEKDAY_LABEL_H + weekIdx * (CELL_H + GAP) + CELL_H - 4}
                  fontSize={9}
                  fontFamily="Geist Mono, ui-monospace, monospace"
                  fill="#7a7770"
                >
                  {MONTH_LABELS[firstOfMonthInWeek.getMonth()]}
                </text>
              )}
              {week.map((day, dayIdx) => {
                const key = isoDay(day);
                const count = counts.get(key) ?? 0;
                const x = WEEK_LABEL_W + dayIdx * (CELL_W + GAP);
                const y = WEEKDAY_LABEL_H + weekIdx * (CELL_H + GAP);
                const isSelected = selectedDay === key;
                const isHovered = hover?.date && isoDay(hover.date) === key;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={y}
                    width={CELL_W}
                    height={CELL_H}
                    rx={RADIUS}
                    ry={RADIUS}
                    fill={colorForCount(count)}
                    stroke={isSelected || isHovered ? '#1a1a1a' : 'transparent'}
                    strokeWidth={1.5}
                    style={{ cursor: 'pointer', transition: 'stroke 120ms ease-out' }}
                    onClick={() => onCellClick(day)}
                    onMouseEnter={() =>
                      setHover({ date: day, count, x: x + CELL_W / 2, y: y + CELL_H })
                    }
                  >
                    <title>
                      {formatTooltip(day, count)}
                    </title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-card-edge bg-surface-card px-2 py-1 font-mono text-[11px] text-ink shadow-md"
          style={{
            left: hover.x + 24, // align with svg's WEEK_LABEL_W offset
            top: hover.y + 8 + 24, // svg padding offsets
            transform: 'translateX(-50%)',
          }}
        >
          {formatTooltip(hover.date, hover.count)}
        </div>
      )}
      </div>
      )}
    </section>
  );
}

function formatTooltip(date: Date, count: number): string {
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const dealLabel = count === 1 ? 'deal' : 'deals';
  return `${formatted} · ${count} ${dealLabel}`;
}
