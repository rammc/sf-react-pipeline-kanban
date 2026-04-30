import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateColor } from '../OpportunityCard';

// Phase 10: dateColor returns CSS-var strings so the past-due tone
// follows the warning token across themes (terracotta in light,
// amber in retro). The semantic name is what's asserted, not the hue.
const PAST_DUE = 'var(--accent-warning)';
const APPROACHING = 'var(--ink)';
const FUTURE = 'var(--ink-muted)';
const ARCHIVED = 'var(--ink-archived-muted)';

const FIXED_NOW = new Date('2026-04-29T10:00:00Z');

describe('dateColor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns past-due tone for an open card with a CloseDate before today', () => {
    expect(dateColor(new Date('2026-04-01'), 'open')).toBe(PAST_DUE);
  });

  it('returns approaching tone for an open card closing today', () => {
    expect(dateColor(new Date('2026-04-29'), 'open')).toBe(APPROACHING);
  });

  it('returns approaching tone for an open card closing within 14 days', () => {
    expect(dateColor(new Date('2026-05-10'), 'open')).toBe(APPROACHING);
  });

  it('returns future tone for an open card closing more than 14 days out', () => {
    expect(dateColor(new Date('2026-06-15'), 'open')).toBe(FUTURE);
  });

  it('returns the archived tone for any closed card, even when past-due', () => {
    expect(dateColor(new Date('2026-04-01'), 'closed')).toBe(ARCHIVED);
    expect(dateColor(new Date('2026-12-31'), 'closed')).toBe(ARCHIVED);
  });
});
