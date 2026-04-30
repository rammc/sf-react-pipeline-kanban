import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bucketByDay,
  getWeekGrid,
  isoDay,
  startOfWeekMonday,
} from '../dateBuckets';
import { makeOpportunity } from '@/test-utils/factories';

// Pin the clock so weekday-derived assertions don't depend on when
// the test happens to run.
const FIXED_NOW = new Date('2026-04-29T10:00:00'); // Wednesday

describe('startOfWeekMonday', () => {
  it('returns the Monday of the same week for a mid-week date', () => {
    expect(isoDay(startOfWeekMonday(new Date('2026-04-29')))).toBe('2026-04-27');
  });
  it('returns Monday itself when given a Monday', () => {
    expect(isoDay(startOfWeekMonday(new Date('2026-04-27')))).toBe('2026-04-27');
  });
  it('rolls Sunday back to the previous Monday (six days)', () => {
    expect(isoDay(startOfWeekMonday(new Date('2026-05-03')))).toBe('2026-04-27');
  });
});

describe('getWeekGrid', () => {
  it('returns weekCount rows of seven days each, week-aligned to Monday', () => {
    const grid = getWeekGrid(new Date('2026-04-29'), 12);
    expect(grid).toHaveLength(12);
    grid.forEach(row => expect(row).toHaveLength(7));
    expect(isoDay(grid[0][0])).toBe('2026-04-27'); // Mon
    expect(isoDay(grid[0][6])).toBe('2026-05-03'); // Sun
    expect(isoDay(grid[1][0])).toBe('2026-05-04');
    expect(isoDay(grid[11][6])).toBe('2026-07-19');
  });
});

describe('bucketByDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts opportunities into the right calendar day', () => {
    const opps = [
      makeOpportunity({ Id: '1', CloseDate: '2026-04-29' }),
      makeOpportunity({ Id: '2', CloseDate: '2026-04-29' }),
      makeOpportunity({ Id: '3', CloseDate: '2026-05-04' }),
    ];
    const map = bucketByDay(opps, FIXED_NOW, 12);
    expect(map.get('2026-04-29')).toBe(2);
    expect(map.get('2026-05-04')).toBe(1);
    expect(map.get('2026-04-30')).toBe(0); // present but empty
  });

  it('seeds every day in the window with 0 even with empty input', () => {
    const map = bucketByDay([], FIXED_NOW, 12);
    expect(map.size).toBe(84); // 12 × 7
    expect(map.get('2026-04-27')).toBe(0);
    expect(map.get('2026-07-19')).toBe(0);
  });

  it('ignores opportunities whose CloseDate falls outside the window', () => {
    const opps = [
      makeOpportunity({ Id: 'past', CloseDate: '2026-04-01' }),
      makeOpportunity({ Id: 'future', CloseDate: '2026-12-31' }),
      makeOpportunity({ Id: 'in', CloseDate: '2026-05-15' }),
    ];
    const map = bucketByDay(opps, FIXED_NOW, 12);
    expect(map.get('2026-05-15')).toBe(1);
    const total = Array.from(map.values()).reduce((s, n) => s + n, 0);
    expect(total).toBe(1);
  });

  it('skips opportunities with a falsy CloseDate without crashing', () => {
    const opps = [
      makeOpportunity({ Id: 'noDate', CloseDate: '' }),
      makeOpportunity({ Id: 'real', CloseDate: '2026-05-04' }),
    ];
    const map = bucketByDay(opps, FIXED_NOW, 12);
    expect(map.get('2026-05-04')).toBe(1);
  });
});
