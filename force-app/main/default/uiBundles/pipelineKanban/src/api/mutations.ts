/**
 * GraphQL mutation strings for the Pipeline Kanban.
 *
 * Verified against the schema's UIAPIMutations.OpportunityUpdate
 * field signature. Input shape:
 *   { input: { Id: string, Opportunity: { ...partial Opportunity } } }
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

export const UPDATE_OPPORTUNITY_AMOUNT_MUTATION = /* GraphQL */ `
  mutation UpdateOpportunityAmount($input: OpportunityUpdateInput!) {
    uiapi {
      OpportunityUpdate(input: $input) {
        Record {
          Id
          Amount {
            value
          }
        }
      }
    }
  }
`;
