import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateColor } from '../OpportunityCard';

const PAST_DUE = '#a85d3e';
const APPROACHING = '#1a1a1a';
const FUTURE = '#7a7770';
const ARCHIVED = '#8a8780';

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
