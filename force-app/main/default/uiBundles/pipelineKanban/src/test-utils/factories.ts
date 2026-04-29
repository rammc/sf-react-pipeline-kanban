/**
 * Test fixture helpers — keep this file dependency-free so it can be
 * imported from any *.test.tsx without dragging vitest globals in.
 */
import type { Opportunity, Stage } from '@/types/opportunity';

/**
 * Stage fixture. The Stage type is intentionally minimal
 * ({ value, label } only) — probability and category live in
 * `@/lib/stageMeta`. Tests that care about probability should use
 * a real stage name like "Prospecting" or "Closed Won" so the
 * production lookup applies.
 */
export function makeStage(value: string, label: string = value): Stage {
  return { value, label };
}

export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    Id: '006xx000001',
    Name: 'Acme deal',
    Amount: 10000,
    CloseDate: '2026-06-30',
    StageName: 'Prospecting',
    Owner: { Id: '005xx000001', Name: 'Marc Benioff', SmallPhotoUrl: null },
    ...overrides,
  };
}
