import { useCallback, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import { UPDATE_OPPORTUNITY_AMOUNT_MUTATION } from '@/api/mutations';

interface UpdateAmountVariables {
  input: {
    Id: string;
    Opportunity: {
      Amount: number;
    };
  };
}

interface UpdateAmountResponse {
  uiapi: {
    OpportunityUpdate: {
      Record: {
        Id: string;
        Amount: { value: number | null };
      };
    };
  };
}

export interface UseUpdateAmountResult {
  mutate: (opportunityId: string, newAmount: number) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Mirrors useUpdateStage exactly — a parallel pattern repeated by
 * design. Phase 6 may refactor both into a single useUpdateOpportunity
 * with partial updates once the duplication has paid for itself as a
 * teaching example.
 */
export function useUpdateAmount(): UseUpdateAmountResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (opportunityId: string, newAmount: number) => {
      setLoading(true);
      setError(null);
      try {
        await executeGraphQL<UpdateAmountResponse, UpdateAmountVariables>(
          UPDATE_OPPORTUNITY_AMOUNT_MUTATION,
          {
            input: {
              Id: opportunityId,
              Opportunity: { Amount: newAmount },
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
    },
    []
  );

  return { mutate, loading, error };
}
