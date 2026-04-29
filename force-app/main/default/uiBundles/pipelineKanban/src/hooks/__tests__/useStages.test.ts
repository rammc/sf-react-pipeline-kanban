import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useStages } from '../useStages';
import * as client from '@/api/graphqlClient';

vi.mock('@/api/graphqlClient', () => ({
  executeGraphQL: vi.fn(),
}));

describe('useStages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns active stages with default forecast probabilities', async () => {
    vi.mocked(client.executeGraphQL).mockResolvedValueOnce({
      uiapi: {
        objectInfos: {
          Opportunity: {
            fields: {
              StageName: {
                picklistValues: [
                  { value: 'Prospecting', label: 'Prospecting', active: true },
                  { value: 'Closed Won', label: 'Closed Won', active: true },
                  { value: 'Legacy Stage', label: 'Old', active: false },
                ],
              },
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useStages());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.stages).toEqual([
      { value: 'Prospecting', label: 'Prospecting', probability: 0.1 },
      { value: 'Closed Won', label: 'Closed Won', probability: 1.0 },
    ]);
  });
});
