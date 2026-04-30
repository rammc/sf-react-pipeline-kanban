import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { OpportunityCard } from '../OpportunityCard';
import type { Opportunity } from '@/types/opportunity';

const opp: Opportunity = {
  Id: '006xx1',
  Name: 'Aurora Robotics',
  Amount: 450000,
  CloseDate: '2026-07-04',
  StageName: 'Qualification',
  Owner: { Id: '005xx1', Name: 'Christopher Ramm', SmallPhotoUrl: null },
};

// Phase 9: the card's name is now a <Link>, which needs a Router
// context. MemoryRouter is the lightweight wrapper Testing Library
// recommends for component-level tests.
function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('OpportunityCard typography', () => {
  it('renders the amount with the mono font class so currency values align column-down', () => {
    renderInRouter(<OpportunityCard opportunity={opp} onUpdateAmount={vi.fn()} />);
    const amountButton = screen.getByRole('button', { name: '$450,000' });
    expect(amountButton).toHaveClass('font-mono');
  });

  it('shows account name without the demo prefix', () => {
    renderInRouter(<OpportunityCard opportunity={opp} onUpdateAmount={vi.fn()} />);
    expect(screen.getByText('Aurora Robotics')).toBeInTheDocument();
    expect(
      screen.queryByText(/Pipeline Kanban Demo/)
    ).not.toBeInTheDocument();
  });

  it('renders owner name in the footer separated from the date by a middle dot', () => {
    renderInRouter(<OpportunityCard opportunity={opp} onUpdateAmount={vi.fn()} />);
    expect(screen.getByText('Christopher Ramm')).toBeInTheDocument();
    expect(screen.getByText('·')).toBeInTheDocument();
  });

  it('wraps the name in a link to /opportunity/:id', () => {
    renderInRouter(<OpportunityCard opportunity={opp} onUpdateAmount={vi.fn()} />);
    const nameLink = screen.getByRole('link', { name: 'Aurora Robotics' });
    expect(nameLink).toHaveAttribute('href', '/opportunity/006xx1');
  });
});
