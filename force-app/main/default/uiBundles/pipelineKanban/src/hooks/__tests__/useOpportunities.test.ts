import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useOpportunities } from '../useOpportunities';
import * as client from '@/api/graphqlClient';

vi.mock('@/api/graphqlClient', () => ({
  executeGraphQL: vi.fn(),
}));

describe('useOpportunities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('flattens uiapi edges into a flat list', async () => {
    vi.mocked(client.executeGraphQL).mockResolvedValueOnce({
      uiapi: {
        query: {
          Opportunity: {
            edges: [
              {
                node: {
                  Id: '006xx000001',
                  Name: { value: 'Acme - $1M deal' },
                  Amount: { value: 1_000_000 },
                  CloseDate: { value: '2026-06-30' },
                  StageName: { value: 'Negotiation/Review' },
                  Owner: {
                    Id: '005xx000001',
                    Name: { value: 'Marc Benioff' },
                    SmallPhotoUrl: { value: 'https://example.com/avatar.png' },
                  },
                },
              },
            ],
          },
        },
      },
    });

    const { result } = renderHook(() => useOpportunities());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.opportunities).toHaveLength(1);
    expect(result.current.opportunities[0]).toEqual({
      Id: '006xx000001',
      Name: 'Acme - $1M deal',
      Amount: 1_000_000,
      CloseDate: '2026-06-30',
      StageName: 'Negotiation/Review',
      Owner: {
        Id: '005xx000001',
        Name: 'Marc Benioff',
        SmallPhotoUrl: 'https://example.com/avatar.png',
      },
    });
  });

  it('exposes errors from the SDK', async () => {
    vi.mocked(client.executeGraphQL).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useOpportunities());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('boom');
    expect(result.current.opportunities).toEqual([]);
  });
});
