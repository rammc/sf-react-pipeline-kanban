import { useEffect, useState } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import {
  OPPORTUNITY_ACTIVITY_QUERY,
  OPPORTUNITY_DETAIL_QUERY,
} from '@/api/queries';

export interface OpportunityDetail {
  Id: string;
  Name: string;
  Amount: number | null;
  CloseDate: string;
  StageName: string;
  Description: string | null;
  CreatedDate: string;
  LastModifiedDate: string;
  Owner: { Id: string; Name: string; SmallPhotoUrl: string | null };
  Account: { Id: string; Name: string } | null;
}

export interface ActivityItem {
  Id: string;
  Subject: string;
  ActivityDate: string | null;
  Description: string | null;
  OwnerName: string;
}

interface DetailResponse {
  uiapi: {
    query: {
      Opportunity: {
        edges: { node: RawDetailNode }[];
      };
    };
  };
}

interface RawDetailNode {
  Id: string;
  Name: { value: string };
  Amount: { value: number | null };
  CloseDate: { value: string };
  StageName: { value: string };
  Description: { value: string | null };
  CreatedDate: { value: string };
  LastModifiedDate: { value: string };
  Owner: {
    Id: string;
    Name: { value: string };
    SmallPhotoUrl: { value: string | null };
  };
  Account: {
    Id: string;
    Name: { value: string };
  } | null;
}

interface ActivityResponse {
  uiapi: {
    query: {
      Task: {
        edges: { node: RawTaskNode }[];
      };
    };
  };
}

interface RawTaskNode {
  Id: string;
  Subject: { value: string | null };
  ActivityDate: { value: string | null };
  Description: { value: string | null };
  Owner: { Name: { value: string } };
}

function flattenDetail(n: RawDetailNode): OpportunityDetail {
  return {
    Id: n.Id,
    Name: n.Name.value,
    Amount: n.Amount.value,
    CloseDate: n.CloseDate.value,
    StageName: n.StageName.value,
    Description: n.Description.value,
    CreatedDate: n.CreatedDate.value,
    LastModifiedDate: n.LastModifiedDate.value,
    Owner: {
      Id: n.Owner.Id,
      Name: n.Owner.Name.value,
      SmallPhotoUrl: n.Owner.SmallPhotoUrl.value,
    },
    Account: n.Account ? { Id: n.Account.Id, Name: n.Account.Name.value } : null,
  };
}

function flattenActivity(n: RawTaskNode): ActivityItem {
  return {
    Id: n.Id,
    Subject: n.Subject.value ?? '(no subject)',
    ActivityDate: n.ActivityDate.value,
    Description: n.Description.value,
    OwnerName: n.Owner.Name.value,
  };
}

export interface UseOpportunityDetailResult {
  opportunity: OpportunityDetail | null;
  activity: ActivityItem[];
  loading: boolean;
  notFound: boolean;
  error: Error | null;
  /** Set when the activity query specifically fails — opportunity may still be loaded. */
  activityError: Error | null;
}

/**
 * Per-route hook. Mounts on /opportunity/:id, fires both queries in
 * parallel, surfaces a clean not-found state when the Opportunity
 * id doesn't resolve. Activity errors are isolated so one query
 * failing doesn't blank the whole page.
 */
export function useOpportunityDetail(id: string): UseOpportunityDetailResult {
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activityError, setActivityError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setActivityError(null);

    (async () => {
      try {
        const [detailRes, activityRes] = await Promise.allSettled([
          executeGraphQL<DetailResponse, { id: string }>(
            OPPORTUNITY_DETAIL_QUERY,
            { id }
          ),
          executeGraphQL<ActivityResponse, { oppId: string }>(
            OPPORTUNITY_ACTIVITY_QUERY,
            { oppId: id }
          ),
        ]);

        if (cancelled) return;

        if (detailRes.status === 'rejected') {
          setError(
            detailRes.reason instanceof Error
              ? detailRes.reason
              : new Error(String(detailRes.reason))
          );
        } else {
          const edges = detailRes.value.uiapi.query.Opportunity.edges;
          if (edges.length === 0) {
            setNotFound(true);
          } else {
            setOpportunity(flattenDetail(edges[0].node));
          }
        }

        if (activityRes.status === 'rejected') {
          setActivityError(
            activityRes.reason instanceof Error
              ? activityRes.reason
              : new Error(String(activityRes.reason))
          );
        } else {
          setActivity(
            activityRes.value.uiapi.query.Task.edges.map(e => flattenActivity(e.node))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { opportunity, activity, loading, notFound, error, activityError };
}
