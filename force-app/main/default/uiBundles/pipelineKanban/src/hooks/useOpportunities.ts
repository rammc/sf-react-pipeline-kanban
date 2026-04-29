import { useCallback, useEffect, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import { OPPORTUNITIES_QUERY } from '@/api/queries';
import type { Opportunity } from '@/types/opportunity';

/**
 * Raw GraphQL response shape from the Salesforce UI API.
 * Field values are wrapped in `{ value }` envelopes; we flatten
 * them before handing data to the React layer.
 */
interface RawOpportunityNode {
  Id: string;
  Name: { value: string };
  Amount: { value: number | null };
  CloseDate: { value: string };
  StageName: { value: string };
  Owner: {
    Name: { value: string };
    SmallPhotoUrl: { value: string | null };
  };
}

interface OpportunitiesResponse {
  uiapi: {
    query: {
      Opportunity: {
        edges: { node: RawOpportunityNode }[];
      };
    };
  };
}

function flatten(node: RawOpportunityNode): Opportunity {
  return {
    Id: node.Id,
    Name: node.Name.value,
    Amount: node.Amount.value,
    CloseDate: node.CloseDate.value,
    StageName: node.StageName.value,
    Owner: {
      Name: node.Owner.Name.value,
      SmallPhotoUrl: node.Owner.SmallPhotoUrl.value,
    },
  };
}

export interface UseOpportunitiesResult {
  opportunities: Opportunity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches all open opportunities for the Kanban board (limit 200).
 * Plain useState/useEffect — no caching layer (TanStack Query etc.)
 * to keep the teaching surface minimal.
 */
export function useOpportunities(): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await executeGraphQL<
        OpportunitiesResponse,
        Record<string, never>
      >(OPPORTUNITIES_QUERY);
      setOpportunities(response.uiapi.query.Opportunity.edges.map(e => flatten(e.node)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOpportunities();
  }, [fetchOpportunities]);

  return { opportunities, loading, error, refetch: fetchOpportunities };
}
