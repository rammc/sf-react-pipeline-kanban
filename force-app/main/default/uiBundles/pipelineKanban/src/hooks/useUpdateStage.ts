import { useCallback, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import { UPDATE_OPPORTUNITY_STAGE_MUTATION } from '@/api/mutations';

interface UpdateStageVariables {
  input: {
    Id: string;
    Opportunity: {
      StageName: string;
    };
  };
}

interface UpdateStageResponse {
  uiapi: {
    OpportunityUpdate: {
      Record: {
        Id: string;
        StageName: { value: string };
      };
    };
  };
}

export interface UseUpdateStageResult {
  mutate: (opportunityId: string, newStage: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Mutation hook for moving an Opportunity to a new stage.
 * Phase 4 wraps callers in optimistic-update logic — this hook
 * only owns the network call + its own loading/error state.
 */
export function useUpdateStage(): UseUpdateStageResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (opportunityId: string, newStage: string) => {
    setLoading(true);
    setError(null);
    try {
      await executeGraphQL<UpdateStageResponse, UpdateStageVariables>(
        UPDATE_OPPORTUNITY_STAGE_MUTATION,
        {
          input: {
            Id: opportunityId,
            Opportunity: { StageName: newStage },
          },
        }
      );
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      setError(wrapped);
      throw wrapped;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
