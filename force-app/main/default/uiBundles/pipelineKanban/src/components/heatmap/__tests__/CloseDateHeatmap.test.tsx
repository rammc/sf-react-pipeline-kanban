import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { act } from 'react';
import { CloseDateHeatmap } from '../CloseDateHeatmap';
import { useFilterStore } from '@/store/filterStore';
import { makeOpportunity } from '@/test-utils/factories';

const FIXED_NOW = new Date('2026-04-29T10:00:00'); // Wednesday

describe('CloseDateHeatmap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    // Reset zustand store between tests so date-filter assertions
    // start from a clean slate.
    act(() => {
      useFilterStore.getState().clear();
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 84 cells (12 weeks × 7 days) regardless of input size', () => {
    const { container } = render(<CloseDateHeatmap opportunities={[]} />);
    const rects = container.querySelectorAll('svg rect');
    expect(rects).toHaveLength(84);
  });

  it('clicking a cell sets the close-date filter to that single day', () => {
    const opps = [
      makeOpportunity({ Id: '1', CloseDate: '2026-04-29' }),
      makeOpportunity({ Id: '2', CloseDate: '2026-04-29' }),
    ];
    const { container } = render(<CloseDateHeatmap opportunities={opps} />);
    const rects = container.querySelectorAll('svg rect');
    // 29 Apr 2026 is a Wednesday in the first week (Mon 27 → Sun 03);
    // Mon=0 … Wed=2 in the grid order.
    const wedFirstWeek = rects[2];
    expect(wedFirstWeek).toBeTruthy();

    fireEvent.click(wedFirstWeek);

    const state = useFilterStore.getState();
    expect(state.closeDateFrom).toBe('2026-04-29');
    expect(state.closeDateTo).toBe('2026-04-29');
  });

  it('clicking the same cell twice toggles the filter off', () => {
    const { container } = render(<CloseDateHeatmap opportunities={[]} />);
    const rects = container.querySelectorAll('svg rect');
    const cell = rects[2];

    fireEvent.click(cell);
    expect(useFilterStore.getState().closeDateFrom).toBe('2026-04-29');

    fireEvent.click(cell);
    expect(useFilterStore.getState().closeDateFrom).toBeNull();
    expect(useFilterStore.getState().closeDateTo).toBeNull();
  });

  it('paints the selected cell with a dark stroke when the filter is set', () => {
    act(() => {
      useFilterStore.setState({
        closeDateFrom: '2026-04-29',
        closeDateTo: '2026-04-29',
      });
    });
    const { container } = render(<CloseDateHeatmap opportunities={[]} />);
    const rects = container.querySelectorAll('svg rect');
    expect(rects[2]).toHaveAttribute('stroke', 'var(--ink)');
    expect(rects[0]).toHaveAttribute('stroke', 'transparent');
  });

  it('escalates fill color through six absolute steps (no normalisation)', () => {
    const repeatOnDate = (n: number, isoDate: string) =>
      Array.from({ length: n }, (_, i) =>
        makeOpportunity({ Id: `${isoDate}-${i}`, CloseDate: isoDate })
      );
    const { container } = render(
      <CloseDateHeatmap
        opportunities={[
          ...repeatOnDate(1, '2026-04-27'), // Mon, week 0 → 1 deal
          ...repeatOnDate(5, '2026-04-28'), // Tue, week 0 → 5+ deals (terracotta)
        ]}
      />
    );
    const rects = container.querySelectorAll('svg rect');
    // Phase 10: cells now carry CSS-var references that resolve
    // per theme. The semantic step is what matters, not the hue.
    expect(rects[0]).toHaveAttribute('fill', 'var(--heatmap-step-1)');
    expect(rects[1]).toHaveAttribute('fill', 'var(--heatmap-step-5)');
    expect(rects[3]).toHaveAttribute('fill', 'var(--heatmap-step-0)');
  });
});
