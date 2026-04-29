/**
 * Opportunity types for the Pipeline Kanban.
 *
 * Manual hand-typed shapes rather than GraphQL codegen output.
 * Reason: codegen requires a fetched schema (npm run graphql:schema)
 * which needs a logged-in org. Keeping types manual keeps the
 * teaching repo runnable without an org.
 *
 * If you wire up codegen later, replace these with the generated
 * operation types from src/api/graphql-operations-types.ts.
 */

export interface Opportunity {
  Id: string;
  Name: string;
  Amount: number | null;
  CloseDate: string;
  StageName: string;
  Owner: {
    Id: string;
    Name: string;
    SmallPhotoUrl: string | null;
  };
}

export interface Stage {
  value: string;
  label: string;
}
