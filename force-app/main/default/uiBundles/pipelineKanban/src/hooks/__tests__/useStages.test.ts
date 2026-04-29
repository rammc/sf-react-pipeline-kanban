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

  it('flattens objectInfos → fields → picklistValuesByRecordTypeIDs and applies default probabilities', async () => {
    vi.mocked(client.executeGraphQL).mockResolvedValueOnce({
      uiapi: {
        objectInfos: [
          {
            ApiName: 'Opportunity',
            fields: [
              { ApiName: 'Name' },
              {
                ApiName: 'StageName',
                picklistValuesByRecordTypeIDs: [
                  {
                    recordTypeID: '012000000000000AAA',
                    picklistValues: [
                      { value: 'Prospecting', label: 'Prospecting' },
                      { value: 'Closed Won', label: 'Closed Won' },
                      { value: 'Custom Stage', label: 'Custom Stage' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const { result } = renderHook(() => useStages());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.executeGraphQL).toHaveBeenCalledWith(
      expect.stringContaining('objectInfos'),
      { recordTypeIDs: ['012000000000000AAA'] }
    );
    expect(result.current.error).toBeNull();
    expect(result.current.stages).toEqual([
      { value: 'Prospecting', label: 'Prospecting', probability: 0.1 },
      { value: 'Closed Won', label: 'Closed Won', probability: 1.0 },
      { value: 'Custom Stage', label: 'Custom Stage', probability: 0 },
    ]);
  });

  it('returns an empty list when StageName has no picklist entry', async () => {
    vi.mocked(client.executeGraphQL).mockResolvedValueOnce({
      uiapi: {
        objectInfos: [{ ApiName: 'Opportunity', fields: [] }],
      },
    });

    const { result } = renderHook(() => useStages());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stages).toEqual([]);
  });
});
