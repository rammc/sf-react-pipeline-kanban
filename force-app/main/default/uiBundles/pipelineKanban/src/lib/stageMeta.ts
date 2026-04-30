/**
 * Stage metadata — single source of accent colour, category, and
 * forecast probability for each Opportunity StageName.
 *
 * Consumers (every place stage-derived values are sourced — kept as
 * a checklist so future edits don't drift):
 *   - src/components/kanban/OpportunityCard.tsx — accent, category
 *     (tonal split for archived stages, date risk colour)
 *   - src/components/kanban/KanbanColumn.tsx — accent, probability
 *     (header underline + "10%" suffix)
 *   - src/components/kanban/ForecastBar.tsx — probability
 *     (weighted forecast, per-stage breakdown)
 *   - src/components/kanban/KanbanBoard.tsx — category
 *     (renders the open→closed visual break)
 *   - src/hooks/useStages.ts — formerly held DEFAULT_PROBABILITIES;
 *     now reads from here at the boundary so the Stage type returned
 *     to React still carries probability for back-compat callers.
 *
 * Custom stages without an entry get FALLBACK_META: neutral grey
 * accent, "open" category, 50% probability — never crash on unknown
 * StageName values.
 */

export type StageCategory = 'open' | 'closed';

export interface StageMeta {
  accent: string;
  category: StageCategory;
  /** Forecast probability, 0–100 (integer percent). */
  probability: number;
}

// Phase 10: accent values reference CSS variables instead of literal
// hex strings. The browser resolves `var(--accent-stage-X)` when the
// string is fed into an inline `style` or an SVG `fill` attribute,
// so call sites need no change. Theme switches (light → dark → retro)
// now propagate to every accent without touching this file.
const QUALIFICATION = 'var(--accent-stage-qualification)';
const DISCOVERY = 'var(--accent-stage-discovery)';
const PROPOSAL = 'var(--accent-stage-proposal)';
const NEGOTIATION = 'var(--accent-stage-negotiation)';
const CLOSED_WON = 'var(--accent-stage-closed-won)';
const CLOSED_LOST = 'var(--accent-stage-closed-lost)';

export const FALLBACK_META: StageMeta = {
  accent: CLOSED_LOST, // neutral grey across themes
  category: 'open',
  probability: 50,
};

const STAGE_META: Record<string, StageMeta> = {
  // Standard Sales Cloud open stages
  Prospecting:           { accent: QUALIFICATION, category: 'open',   probability: 10 },
  Qualification:         { accent: QUALIFICATION, category: 'open',   probability: 10 },
  Discovery:             { accent: DISCOVERY,     category: 'open',   probability: 20 },
  'Needs Analysis':      { accent: DISCOVERY,     category: 'open',   probability: 20 },
  'Value Proposition':   { accent: DISCOVERY,     category: 'open',   probability: 50 },
  'Id. Decision Makers': { accent: DISCOVERY,     category: 'open',   probability: 60 },
  'Perception Analysis': { accent: PROPOSAL,      category: 'open',   probability: 70 },
  'Proposal/Quote':      { accent: PROPOSAL,      category: 'open',   probability: 75 },
  'Proposal/Price Quote':{ accent: PROPOSAL,      category: 'open',   probability: 75 },
  Quotation:             { accent: PROPOSAL,      category: 'open',   probability: 75 },
  Negotiation:           { accent: NEGOTIATION,   category: 'open',   probability: 90 },
  'Negotiation/Review':  { accent: NEGOTIATION,   category: 'open',   probability: 90 },

  // Closed (archived) stages
  'Closed Won':          { accent: CLOSED_WON,    category: 'closed', probability: 100 },
  'Closed Lost':         { accent: CLOSED_LOST,   category: 'closed', probability: 0 },
};

export function stageMeta(stageName: string): StageMeta {
  return STAGE_META[stageName] ?? FALLBACK_META;
}

/** Convenience accessor — kept because most consumers only need the colour. */
export function stageAccent(stageName: string): string {
  return stageMeta(stageName).accent;
}
