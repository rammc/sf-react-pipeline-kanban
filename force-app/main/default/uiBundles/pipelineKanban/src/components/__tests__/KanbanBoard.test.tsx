import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { Opportunity, Stage } from '@/types/opportunity';

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: vi.fn(),
}));
vi.mock('@/hooks/useStages', () => ({
  useStages: vi.fn(),
}));
vi.mock('@/hooks/useUpdateStage', () => ({
  useUpdateStage: () => ({ mutate: vi.fn(), loading: false, error: null }),
}));
vi.mock('@/hooks/useUpdateAmount', () => ({
  useUpdateAmount: () => ({ mutate: vi.fn(), loading: false, error: null }),
}));

import { useOpportunities } from '@/hooks/useOpportunities';
import { useStages } from '@/hooks/useStages';
import { makeStage } from '@/test-utils/factories';

// Real stage names so the production stageMeta() lookup applies
// (Prospecting → 10%, Closed Won → 100%).
const stages: Stage[] = [makeStage('Prospecting'), makeStage('Closed Won')];

const opps: Opportunity[] = [
  {
    Id: '1',
    Name: 'Acme deal',
    Amount: 10000,
    CloseDate: '2026-06-30',
    StageName: 'Prospecting',
    Owner: { Id: '005x1', Name: 'Marc Benioff', SmallPhotoUrl: null },
  },
  {
    Id: '2',
    Name: 'Globex pilot',
    Amount: 25000,
    CloseDate: '2026-07-15',
    StageName: 'Prospecting',
    Owner: { Id: '005x1', Name: 'Marc Benioff', SmallPhotoUrl: null },
  },
  {
    Id: '3',
    Name: 'Initech rollout',
    Amount: 50000,
    CloseDate: '2026-05-01',
    StageName: 'Closed Won',
    Owner: { Id: '005x2', Name: 'Parker Harris', SmallPhotoUrl: null },
  },
];

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.mocked(useOpportunities).mockReturnValue({
      opportunities: opps,
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(useStages).mockReturnValue({
      stages,
      loading: false,
      error: null,
    });
  });

  it('renders one column per stage with correct counts and totals', () => {
    render(<KanbanBoard />);

    const prospecting = screen.getByRole('region', {
      name: /Stage column Prospecting/,
    });
    expect(within(prospecting).getByText(/Prospecting/)).toBeInTheDocument();
    // 2 opps · $35,000 total
    expect(within(prospecting).getByText(/2 · \$35,000/)).toBeInTheDocument();

    const won = screen.getByRole('region', { name: /Stage column Closed Won/ });
    expect(within(won).getByText(/1 · \$50,000/)).toBeInTheDocument();
  });

  it('places each opportunity card under its stage column', () => {
    render(<KanbanBoard />);

    const prospecting = screen.getByRole('region', {
      name: /Stage column Prospecting/,
    });
    expect(within(prospecting).getByText('Acme deal')).toBeInTheDocument();
    expect(within(prospecting).getByText('Globex pilot')).toBeInTheDocument();

    const won = screen.getByRole('region', { name: /Stage column Closed Won/ });
    expect(within(won).getByText('Initech rollout')).toBeInTheDocument();
  });

  it('renders the forecast sidebar with weighted total', () => {
    render(<KanbanBoard />);

    // Total pipeline = 10k + 25k + 50k = 85k
    expect(screen.getByText('$85,000')).toBeInTheDocument();
    // Weighted = 10k×0.1 + 25k×0.1 + 50k×1.0 = 53,500
    expect(screen.getByText('$53,500')).toBeInTheDocument();
  });
});
