/**
 * GraphQL mutation strings for the Pipeline Kanban.
 *
 * TODO: verify against Beta SDK reference
 *   https://developer.salesforce.com/docs/platform/multi-framework/
 */

export const UPDATE_OPPORTUNITY_STAGE_MUTATION = /* GraphQL */ `
  mutation UpdateOpportunityStage($input: OpportunityUpdateInput!) {
    uiapi {
      OpportunityUpdate(input: $input) {
        Record {
          Id
          StageName {
            value
          }
        }
      }
    }
  }
`;
