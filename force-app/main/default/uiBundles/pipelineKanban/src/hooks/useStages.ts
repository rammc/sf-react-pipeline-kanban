import { useEffect, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import { STAGES_QUERY } from '@/api/queries';
import type { Stage } from '@/types/opportunity';

interface RawPicklistValue {
  value: string;
  label: string;
  active: boolean;
}

interface StagesResponse {
  uiapi: {
    objectInfos: {
      Opportunity: {
        fields: {
          StageName: {
            picklistValues?: RawPicklistValue[];
          };
        };
      };
    };
  };
}

/**
 * Default forecast probabilities for the standard Sales Cloud stages.
 * Salesforce's GraphQL API does not expose forecast probability per
 * picklist value, so we hard-code the standard mapping. Real orgs
 * with custom stages will need to swap this for an Apex callout — see
 * docs/ARCHITECTURE.md for the rationale.
 */
const DEFAULT_PROBABILITIES: Record<string, number> = {
  Prospecting: 0.1,
  Qualification: 0.1,
  'Needs Analysis': 0.2,
  'Value Proposition': 0.5,
  'Id. Decision Makers': 0.6,
  'Perception Analysis': 0.7,
  'Proposal/Price Quote': 0.75,
  'Negotiation/Review': 0.9,
  'Closed Won': 1.0,
  'Closed Lost': 0.0,
};

export interface UseStagesResult {
  stages: Stage[];
  loading: boolean;
  error: Error | null;
}

export function useStages(): UseStagesResult {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await executeGraphQL<
          StagesResponse,
          Record<string, never>
        >(STAGES_QUERY);
        if (cancelled) return;
        const values = response.uiapi.objectInfos.Opportunity.fields.StageName.picklistValues ?? [];
        setStages(
          values
            .filter(v => v.active)
            .map(v => ({
              value: v.value,
              label: v.label,
              probability: DEFAULT_PROBABILITIES[v.value] ?? 0,
            }))
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stages, loading, error };
}
