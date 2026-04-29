import { useEffect, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import { MASTER_RECORD_TYPE_ID, STAGES_QUERY } from '@/api/queries';
import type { Stage } from '@/types/opportunity';

interface RawPicklistValue {
  value: string;
  label: string;
}

interface RawField {
  ApiName: string;
  picklistValuesByRecordTypeIDs?: {
    recordTypeID: string;
    picklistValues: RawPicklistValue[];
  }[];
}

interface RawObjectInfo {
  ApiName: string;
  fields: RawField[];
}

interface StagesResponse {
  uiapi: {
    objectInfos: RawObjectInfo[];
  };
}

interface StagesVariables {
  recordTypeIDs: string[];
}

/**
 * Forecast probabilities for the standard Sales Cloud stages.
 * Salesforce's GraphQL API does not expose forecast probability per
 * picklist value, so the mapping is hard-coded. Orgs with custom
 * stages have entries default to 0 — add them here, or replace with
 * an Apex callout that reads OpportunityStage metadata.
 */
const DEFAULT_PROBABILITIES: Record<string, number> = {
  Prospecting: 0.1,
  Qualification: 0.1,
  Discovery: 0.2,
  'Needs Analysis': 0.2,
  'Value Proposition': 0.5,
  'Id. Decision Makers': 0.6,
  'Perception Analysis': 0.7,
  'Proposal/Price Quote': 0.75,
  'Proposal/Quote': 0.75,
  Quotation: 0.75,
  'Negotiation/Review': 0.9,
  Negotiation: 0.9,
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
        const response = await executeGraphQL<StagesResponse, StagesVariables>(
          STAGES_QUERY,
          { recordTypeIDs: [MASTER_RECORD_TYPE_ID] }
        );
        if (cancelled) return;

        const oppInfo = response.uiapi.objectInfos.find(
          o => o.ApiName === 'Opportunity'
        );
        const stageField = oppInfo?.fields.find(f => f.ApiName === 'StageName');
        const masterEntry = stageField?.picklistValuesByRecordTypeIDs?.find(
          e => e.recordTypeID === MASTER_RECORD_TYPE_ID
        );
        const values = masterEntry?.picklistValues ?? [];

        setStages(
          values.map(v => ({
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
