/**
 * GraphQL query strings for the Pipeline Kanban.
 *
 * Verified against the Salesforce UI API GraphQL endpoint
 * (`/services/data/v66.0/graphql`) on a live sandbox. Both the
 * envelope shapes and the picklist traversal match the schema as
 * introspected.
 *
 * Schema notes worth knowing:
 *   - `uiapi.query.Opportunity` is a Connection (edges/node) — not a flat list.
 *   - All scalar fields are wrapped in `{ value }`. Some also expose
 *     `displayValue` (server-formatted, locale-aware) — we deliberately
 *     read `value` and format with Intl.NumberFormat in the React layer.
 *   - `uiapi.objectInfos` is a list. Picklist values live under
 *     `picklistValuesByRecordTypeIDs`, not `picklistValues`.
 *   - Picklist queries require an `objectInfoInputs` argument with
 *     a `recordTypeIDs` list. The master record type ID
 *     '012000000000000AAA' returns the union across record types.
 */

export const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

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
 * Picklist values for Opportunity.StageName, scoped to the master
 * record type. Orgs with multiple record types each have their own
 * picklist subset; the master record type returns the union.
 */
export const STAGES_QUERY = /* GraphQL */ `
  query OpportunityStages($recordTypeIDs: [ID!]!) {
    uiapi {
      objectInfos(
        objectInfoInputs: [
          { apiName: "Opportunity", recordTypeIDs: $recordTypeIDs }
        ]
      ) {
        ApiName
        fields {
          ApiName
          ... on PicklistField {
            picklistValuesByRecordTypeIDs {
              recordTypeID
              picklistValues {
                value
                label
              }
            }
          }
        }
      }
    }
  }
`;
