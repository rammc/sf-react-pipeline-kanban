/**
 * GraphQL query strings for the Pipeline Kanban.
 *
 * These follow the Salesforce UI API GraphQL convention (uiapi.query.*,
 * fields wrapped in `{ value }`). Multi-Framework Beta may diverge —
 * verify against the Beta SDK reference before relying on this in
 * production.
 *
 * TODO: verify against Beta SDK reference
 *   https://developer.salesforce.com/docs/platform/multi-framework/
 */

export const OPPORTUNITIES_QUERY = /* GraphQL */ `
  query Opportunities {
    uiapi {
      query {
        Opportunity(first: 200) {
          edges {
            node {
              Id
              Name {
                value
              }
              Amount {
                value
              }
              CloseDate {
                value
              }
              StageName {
                value
              }
              Owner {
                Name {
                  value
                }
                SmallPhotoUrl {
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Picklist values for Opportunity.StageName.
 *
 * The exact path through the schema (objectInfos vs picklistValues entry
 * point) varies across Salesforce GraphQL versions.
 *
 * TODO: verify against Beta SDK reference
 *   https://developer.salesforce.com/docs/platform/multi-framework/
 */
export const STAGES_QUERY = /* GraphQL */ `
  query OpportunityStages {
    uiapi {
      objectInfos(apiNames: ["Opportunity"]) {
        Opportunity {
          fields {
            StageName {
              ... on PicklistField {
                picklistValues {
                  value
                  label
                  active
                }
              }
            }
          }
        }
      }
    }
  }
`;
