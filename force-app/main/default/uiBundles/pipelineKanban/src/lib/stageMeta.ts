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

export const FALLBACK_META: StageMeta = {
  accent: '#8a8a85',
  category: 'open',
  probability: 50,
};

const STAGE_META: Record<string, StageMeta> = {
  // Standard Sales Cloud open stages
  Prospecting:           { accent: '#7a8a6f', category: 'open',   probability: 10 },
  Qualification:         { accent: '#7a8a6f', category: 'open',   probability: 10 },
  Discovery:             { accent: '#5b7a8a', category: 'open',   probability: 20 },
  'Needs Analysis':      { accent: '#5b7a8a', category: 'open',   probability: 20 },
  'Value Proposition':   { accent: '#5b7a8a', category: 'open',   probability: 50 },
  'Id. Decision Makers': { accent: '#5b7a8a', category: 'open',   probability: 60 },
  'Perception Analysis': { accent: '#b8854a', category: 'open',   probability: 70 },
  'Proposal/Quote':      { accent: '#b8854a', category: 'open',   probability: 75 },
  'Proposal/Price Quote':{ accent: '#b8854a', category: 'open',   probability: 75 },
  Quotation:             { accent: '#b8854a', category: 'open',   probability: 75 },
  Negotiation:           { accent: '#a85d3e', category: 'open',   probability: 90 },
  'Negotiation/Review':  { accent: '#a85d3e', category: 'open',   probability: 90 },

  // Closed (archived) stages
  'Closed Won':          { accent: '#3e5a3e', category: 'closed', probability: 100 },
  'Closed Lost':         { accent: '#8a8a85', category: 'closed', probability: 0 },
};

export function stageMeta(stageName: string): StageMeta {
  return STAGE_META[stageName] ?? FALLBACK_META;
}

/** Convenience accessor — kept because most consumers only need the colour. */
export function stageAccent(stageName: string): string {
  return stageMeta(stageName).accent;
}
