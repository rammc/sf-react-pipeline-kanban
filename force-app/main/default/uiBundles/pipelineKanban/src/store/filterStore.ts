import { create } from 'zustand';

/**
 * Filter state for the Kanban view.
 *
 * Why zustand: a single shared piece of UI state (which owners /
 * date-range the user has selected) needs to be readable from the
 * FilterBar (writes), KanbanBoard (filters opportunities), and
 * ForecastSidebar (operates on the filtered set). Lifting it into
 * KanbanBoard would force prop-drilling through three layers; the
 * Context API would work too but adds boilerplate per consumer.
 * Zustand gives us a hook with selector support and zero boilerplate.
 *
 * The store holds raw filter inputs only — no derived state.
 * Filtering is computed where it's used (KanbanBoard.useMemo).
 */
export interface FilterState {
  /** Selected Owner Ids — empty Set means "all owners". */
  ownerIds: Set<string>;
  /** ISO date string (YYYY-MM-DD) or null. */
  closeDateFrom: string | null;
  closeDateTo: string | null;
  toggleOwner: (id: string) => void;
  setCloseDateFrom: (date: string | null) => void;
  setCloseDateTo: (date: string | null) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>(set => ({
  ownerIds: new Set<string>(),
  closeDateFrom: null,
  closeDateTo: null,
  toggleOwner: id =>
    set(state => {
      const next = new Set(state.ownerIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ownerIds: next };
    }),
  setCloseDateFrom: date => set({ closeDateFrom: date }),
  setCloseDateTo: date => set({ closeDateTo: date }),
  clear: () =>
    set({
      ownerIds: new Set<string>(),
      closeDateFrom: null,
      closeDateTo: null,
    }),
}));
