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
                Id
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
 * Single Opportunity by Id, with the extra fields the detail view
 * shows (Description, Account.Name, timestamps) on top of what the
 * card already has. Uses the connection's `where` filter; if your
 * org's GraphQL flavour differs, the request will surface a
 * ValidationError and the detail view falls into its error state.
 */
export const OPPORTUNITY_DETAIL_QUERY = /* GraphQL */ `
  query OpportunityDetail($id: ID!) {
    uiapi {
      query {
        Opportunity(where: { Id: { eq: $id } }, first: 1) {
          edges {
            node {
              Id
              Name { value }
              Amount { value }
              CloseDate { value }
              StageName { value }
              Description { value }
              CreatedDate { value }
              LastModifiedDate { value }
              Owner {
                Id
                Name { value }
                SmallPhotoUrl { value }
              }
              Account {
                Id
                Name { value }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Recent Tasks related to one Opportunity. Activity in Salesforce
 * spans Tasks + Events; for the demo we only query Tasks because
 * a fresh scratch org has neither, and showing an "empty activity"
 * state from one query is the same teaching beat as showing it
 * from two. Extending to Events is a stretch exercise documented
 * in TEACHING-NOTES.
 */
export const OPPORTUNITY_ACTIVITY_QUERY = /* GraphQL */ `
  query OpportunityActivity($oppId: ID!) {
    uiapi {
      query {
        Task(where: { WhatId: { eq: $oppId } }, first: 20) {
          edges {
            node {
              Id
              Subject { value }
              ActivityDate { value }
              Description { value }
              Owner {
                ... on User { Name { value } }
                ... on Group { Name { value } }
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
