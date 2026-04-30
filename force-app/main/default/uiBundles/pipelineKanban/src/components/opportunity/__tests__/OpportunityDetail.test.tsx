import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { OpportunityDetail } from '../OpportunityDetail';
import type {
  ActivityItem,
  OpportunityDetail as OpportunityDetailModel,
  UseOpportunityDetailResult,
} from '@/hooks/useOpportunityDetail';

vi.mock('@/hooks/useOpportunityDetail', () => ({
  useOpportunityDetail: vi.fn(),
}));

import { useOpportunityDetail } from '@/hooks/useOpportunityDetail';

const opp: OpportunityDetailModel = {
  Id: '006xx000001',
  Name: 'Aurora Robotics',
  Amount: 10_000,
  CloseDate: '2026-04-29',
  StageName: 'Negotiation',
  Description: 'A short paragraph about the deal.',
  CreatedDate: '2026-04-01T10:00:00Z',
  LastModifiedDate: '2026-04-20T14:00:00Z',
  Owner: { Id: '005x1', Name: 'Christopher Ramm', SmallPhotoUrl: null },
  Account: { Id: '001x1', Name: 'Aurora Robotics, Inc.' },
};

const activity: ActivityItem[] = [
  {
    Id: '00Tx1',
    Subject: 'Sent proposal v3',
    ActivityDate: '2026-04-15',
    Description: null,
    OwnerName: 'Christopher Ramm',
  },
];

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/opportunity/${id}`]}>
      <Routes>
        <Route path="/opportunity/:id" element={<OpportunityDetail />} />
        <Route path="/" element={<div>Board</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function mockHook(partial: Partial<UseOpportunityDetailResult>) {
  vi.mocked(useOpportunityDetail).mockReturnValue({
    opportunity: null,
    activity: [],
    loading: false,
    notFound: false,
    error: null,
    activityError: null,
    ...partial,
  });
}

describe('OpportunityDetail', () => {
  it('renders name, amount, stage chip, and account when the opportunity loads', () => {
    mockHook({ opportunity: opp, activity });
    renderAt('006xx000001');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Aurora Robotics' })
    ).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
    expect(screen.getByText(/Negotiation · 90%/)).toBeInTheDocument();
    expect(screen.getByText('Aurora Robotics, Inc.')).toBeInTheDocument();
    expect(
      screen.getByText('A short paragraph about the deal.')
    ).toBeInTheDocument();
  });

  it('renders activity items under the Activity heading', () => {
    mockHook({ opportunity: opp, activity });
    renderAt('006xx000001');

    expect(screen.getByText('Sent proposal v3')).toBeInTheDocument();
    expect(screen.getAllByText('Christopher Ramm').length).toBeGreaterThan(0);
  });

  it('shows the empty-state copy when there are no activity items', () => {
    mockHook({ opportunity: opp, activity: [] });
    renderAt('006xx000001');

    expect(
      screen.getByText(/No activity yet/i)
    ).toBeInTheDocument();
  });

  it('shows the not-found panel when the hook reports notFound', () => {
    mockHook({ notFound: true });
    renderAt('006xx000001');

    expect(
      screen.getByRole('heading', { level: 1, name: /Opportunity not found/ })
    ).toBeInTheDocument();
  });

  it('points the back link at /', () => {
    mockHook({ opportunity: opp });
    renderAt('006xx000001');

    const backLink = screen.getByRole('link', { name: /back to board/i });
    expect(backLink).toHaveAttribute('href', '/');
  });
});
