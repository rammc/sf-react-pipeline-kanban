import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useUpdateStage } from '../useUpdateStage';
import * as client from '@/api/graphqlClient';

vi.mock('@/api/graphqlClient', () => ({
  executeGraphQL: vi.fn(),
}));

describe('useUpdateStage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sends the mutation with input variables and resolves on success', async () => {
    vi.mocked(client.executeGraphQL).mockResolvedValueOnce({
      uiapi: {
        OpportunityUpdate: {
          Record: { Id: '006xx000001', StageName: { value: 'Closed Won' } },
        },
      },
    });

    const { result } = renderHook(() => useUpdateStage());

    await act(async () => {
      await result.current.mutate('006xx000001', 'Closed Won');
    });

    expect(client.executeGraphQL).toHaveBeenCalledWith(
      expect.stringContaining('OpportunityUpdate'),
      {
        input: {
          Id: '006xx000001',
          Opportunity: { StageName: 'Closed Won' },
        },
      }
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('captures and rethrows errors', async () => {
    vi.mocked(client.executeGraphQL).mockRejectedValueOnce(new Error('FLS denied'));

    const { result } = renderHook(() => useUpdateStage());

    await act(async () => {
      await expect(result.current.mutate('006xx000001', 'Closed Won')).rejects.toThrow(
        'FLS denied'
      );
    });

    expect(result.current.error?.message).toBe('FLS denied');
  });
});
