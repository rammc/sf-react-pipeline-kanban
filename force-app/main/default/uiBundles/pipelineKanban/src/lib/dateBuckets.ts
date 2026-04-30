/**
 * Date bucketing for the close-date heatmap.
 *
 * Pure functions — no React, no date-fns. The heatmap needs week
 * grids and per-day counts; both are simple enough that a five-line
 * helper beats pulling in a heavier dependency. Days are keyed as
 * ISO 'YYYY-MM-DD' strings so the bucket map collapses timezone
 * shifts within the same calendar day (Salesforce returns CloseDate
 * as a date-only string, so we never have to subtract hours).
 */

import { startOfDay } from 'date-fns';
import type { Opportunity } from '@/types/opportunity';

const MS_PER_DAY = 86_400_000;

/** Format a Date as 'YYYY-MM-DD' in local time — same key Salesforce CloseDate uses. */
export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Monday-aligned start of the calendar week containing `date`.
 * Sunday → previous Monday (so the week containing today always
 * begins six days ago at most).
 */
export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday … 6 = Saturday
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

/**
 * Build a `weekCount × 7` array of Date objects starting on the
 * Monday of the week containing `startDate`. Used to seed the
 * heatmap grid so every cell has a date even if no opportunity
 * lives there.
 */
export function getWeekGrid(startDate: Date, weekCount: number): Date[][] {
  const firstMonday = startOfWeekMonday(startDate);
  const weeks: Date[][] = [];
  for (let w = 0; w < weekCount; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(firstMonday);
      day.setDate(firstMonday.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }
  return weeks;
}

/**
 * Map each calendar day in the `weekCount`-week window to the count
 * of opportunities closing on that day. Days with zero deals are
 * still present in the map — the heatmap renders them as "empty"
 * cells, not missing cells.
 */
export function bucketByDay(
  opportunities: Opportunity[],
  startDate: Date,
  weekCount: number
): Map<string, number> {
  const counts = new Map<string, number>();
  const firstMonday = startOfWeekMonday(startDate);
  const totalDays = weekCount * 7;
  const lastMs = firstMonday.getTime() + (totalDays - 1) * MS_PER_DAY;

  // Pre-seed every day so callers can iterate the grid and read 0
  // for any cell without a separate "exists?" check.
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(firstMonday);
    day.setDate(firstMonday.getDate() + i);
    counts.set(isoDay(day), 0);
  }

  for (const opp of opportunities) {
    if (!opp.CloseDate) continue;
    const day = startOfDay(new Date(opp.CloseDate));
    const t = day.getTime();
    if (t < firstMonday.getTime() || t > lastMs) continue;
    const key = isoDay(day);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
