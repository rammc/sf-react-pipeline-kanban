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
          values.map(v => ({ value: v.value, label: v.label }))
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
