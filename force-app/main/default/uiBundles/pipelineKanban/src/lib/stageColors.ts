/**
 * Stage-to-accent-colour map for the Kanban view.
 *
 * Used in exactly two places per stage: the 2px left border on each
 * OpportunityCard and the 2px underline on each KanbanColumn header.
 * Never as a background, badge, or pill.
 *
 * Custom stages without an entry fall back to the neutral grey —
 * we never crash on unknown StageName values.
 */

const FALLBACK = '#8a8a85';

const STAGE_ACCENT: Record<string, string> = {
  Qualification: '#7a8a6f', // sage
  Discovery: '#5b7a8a', // slate-blue
  'Proposal/Quote': '#b8854a', // warm amber
  'Proposal/Price Quote': '#b8854a',
  Quotation: '#b8854a',
  Negotiation: '#a85d3e', // terracotta
  'Negotiation/Review': '#a85d3e',
  'Closed Won': '#3e5a3e', // dark moss
  'Closed Lost': '#8a8a85', // neutral grey
  Prospecting: '#7a8a6f',
  'Needs Analysis': '#5b7a8a',
  'Value Proposition': '#5b7a8a',
  'Id. Decision Makers': '#5b7a8a',
  'Perception Analysis': '#b8854a',
};

export function stageAccent(stageName: string): string {
  return STAGE_ACCENT[stageName] ?? FALLBACK;
}
