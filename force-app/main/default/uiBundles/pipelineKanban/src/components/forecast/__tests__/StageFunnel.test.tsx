import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock Recharts before the component imports it. The real package is
// SVG-heavy and needs a layout engine that jsdom doesn't provide; the
// stubs below preserve only the API surface StageFunnel relies on:
// per-Bar onClick, per-Cell fillOpacity, the dataKey passed to Bar.
vi.mock('recharts', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Bar = ({ dataKey, onClick, children }: any) => (
    <button
      type="button"
      data-stage={dataKey}
      onClick={() => onClick?.()}
    >
      {children}
    </button>
  );
  return {
    Bar,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BarChart: ({ children }: any) => <div data-slot="barchart">{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cell: ({ fillOpacity }: any) => (
      <span data-slot="cell" data-archived={fillOpacity === 0.4 ? 'true' : 'false'} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    Tooltip: () => null,
    YAxis: () => null,
  };
});

import { StageFunnel, computeSegments } from '../StageFunnel';
import { makeOpportunity, makeStage } from '@/test-utils/factories';
import type { Stage } from '@/types/opportunity';

const stages: Stage[] = [
  makeStage('Qualification'),
  makeStage('Discovery'),
  makeStage('Proposal/Quote'),
  makeStage('Negotiation'),
  makeStage('Closed Won'),
  makeStage('Closed Lost'),
];

const opportunities = [
  makeOpportunity({ Id: '1', StageName: 'Qualification', Amount: 10_000 }),
  makeOpportunity({ Id: '2', StageName: 'Qualification', Amount: 20_000 }),
  makeOpportunity({ Id: '3', StageName: 'Discovery', Amount: 50_000 }),
  makeOpportunity({ Id: '4', StageName: 'Negotiation', Amount: 100_000 }),
  makeOpportunity({ Id: '5', StageName: 'Closed Won', Amount: 250_000 }),
  makeOpportunity({ Id: '6', StageName: 'Closed Won', Amount: 75_000 }),
];

describe('computeSegments (pure data transform)', () => {
  it('aggregates count and sum per stage', () => {
    const segments = computeSegments(opportunities, stages);
    const byStage = Object.fromEntries(
      segments.map(s => [s.stage.value, { count: s.count, sum: s.sum }])
    );
    expect(byStage['Qualification']).toEqual({ count: 2, sum: 30_000 });
    expect(byStage['Discovery']).toEqual({ count: 1, sum: 50_000 });
    expect(byStage['Proposal/Quote']).toEqual({ count: 0, sum: 0 });
    expect(byStage['Negotiation']).toEqual({ count: 1, sum: 100_000 });
    expect(byStage['Closed Won']).toEqual({ count: 2, sum: 325_000 });
    expect(byStage['Closed Lost']).toEqual({ count: 0, sum: 0 });
  });

  it('flags archived stages (closed category)', () => {
    const segments = computeSegments(opportunities, stages);
    expect(segments.find(s => s.stage.value === 'Closed Won')?.archived).toBe(true);
    expect(segments.find(s => s.stage.value === 'Closed Lost')?.archived).toBe(true);
    expect(segments.find(s => s.stage.value === 'Qualification')?.archived).toBe(false);
  });
});

describe('StageFunnel (component)', () => {
  it('returns null when there are no opportunities', () => {
    const { container } = render(
      <StageFunnel opportunities={[]} stages={stages} onStageClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one Bar per stage and forwards stage name on click', () => {
    const onStageClick = vi.fn();
    const { container } = render(
      <StageFunnel
        opportunities={opportunities}
        stages={stages}
        onStageClick={onStageClick}
      />
    );
    const bars = container.querySelectorAll('button[data-stage]');
    expect(bars).toHaveLength(stages.length);

    fireEvent.click(bars[0]); // Qualification
    expect(onStageClick).toHaveBeenCalledWith('Qualification');

    fireEvent.click(bars[4]); // Closed Won
    expect(onStageClick).toHaveBeenCalledWith('Closed Won');
  });

  it('marks closed-category cells with the archived flag', () => {
    const { container } = render(
      <StageFunnel opportunities={opportunities} stages={stages} onStageClick={vi.fn()} />
    );
    const archivedCells = container.querySelectorAll(
      '[data-slot="cell"][data-archived="true"]'
    );
    expect(archivedCells).toHaveLength(2); // Closed Won + Closed Lost
  });
});
