/**
 * Pipeline Kanban — seed data for end-to-end verification.
 *
 * Run as anonymous Apex against a scratch org or sandbox:
 *   sf apex run --file scripts/seed-opportunities.apex
 *
 * Idempotent. Deletes any prior demo data with the prefix
 * 'Pipeline Kanban Demo' before inserting, so the script can be
 * re-run to reset. Empty-state testing: comment out the insert
 * block and re-run, or run scripts/clear-opportunities.apex (TODO).
 *
 * Creates 30 Opportunities across the standard Opportunity StageName
 * picklist values, Amount between 10k and 500k, CloseDate spread over
 * the next 90 days. Every Opportunity is owned by the running user so
 * that Owner.SmallPhotoUrl resolves to a User profile photo —
 * Queue-owned records have a null SmallPhotoUrl, which the
 * OpportunityCard component handles with an initials fallback.
 */

// 1. Cleanup — preserve any non-demo data already in the org.
delete [SELECT Id FROM Opportunity WHERE Name LIKE 'Pipeline Kanban Demo%'];
delete [SELECT Id FROM Account WHERE Name = 'Pipeline Kanban Demo Co.'];

// 2. Anchor Account so Opportunities have a relationship even when
//    a validation rule requires AccountId.
Account demoAccount = new Account(Name = 'Pipeline Kanban Demo Co.');
insert demoAccount;

// 3. Read the active StageName picklist values from the running org
//    so the seed adapts to whatever customisations are in place.
//    Avoids hard-coding standard stages that may have been renamed
//    or replaced (e.g. 'Prospecting' → 'Discovery' is common).
List<String> stages = new List<String>();
for (Schema.PicklistEntry e : Opportunity.StageName.getDescribe().getPicklistValues()) {
  if (e.isActive()) stages.add(e.getValue());
}
if (stages.isEmpty()) {
  throw new System.IllegalArgumentException(
    'Opportunity.StageName has no active picklist values — cannot seed.'
  );
}

List<String> companies = new List<String>{
  'Aurora Robotics', 'Brightline Logistics', 'Coastal Health', 'Delta Foundry',
  'Evergreen Energy', 'Falcon Aerospace', 'Granite Insurance', 'Helix Bio',
  'Indigo Retail', 'Junction Telecom', 'Kestrel Manufacturing', 'Lumen Software',
  'Meridian Bank', 'Northwind Outdoor', 'Ovation Media', 'Pinnacle Construction',
  'Quartz Mining', 'Riverstone Pharma', 'Summit Solar', 'Tessera Materials',
  'Umbra Cybersecurity', 'Vertex Auto', 'Whitewater Travel', 'Xenon Devices',
  'Yarrow Foods', 'Zephyr Shipping', 'Acme Industries', 'Beacon Capital',
  'Cinnabar Tech', 'Dynamo Sports'
};

// 4. Build 30 records with a deterministic but varied distribution
//    so the Kanban view is visually balanced on first load.
List<Opportunity> opps = new List<Opportunity>();
for (Integer i = 0; i < companies.size(); i++) {
  String stage   = stages[Math.mod(i, stages.size())];
  Decimal amount = (Math.mod(i * 37, 50) + 1) * 10000; // 10k .. 500k
  Date closeOn   = Date.today().addDays(Math.mod(i * 13, 90));

  opps.add(new Opportunity(
    Name      = 'Pipeline Kanban Demo: ' + companies[i],
    AccountId = demoAccount.Id,
    StageName = stage,
    Amount    = amount,
    CloseDate = closeOn,
    OwnerId   = UserInfo.getUserId()
  ));
}
insert opps;

System.debug(
  'Inserted ' + opps.size() + ' demo Opportunities owned by ' + UserInfo.getName()
);
