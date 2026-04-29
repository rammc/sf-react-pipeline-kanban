/**
 * Pipeline Kanban — seed data for end-to-end verification.
 *
 * Run as anonymous Apex against a scratch org or sandbox:
 *   sf apex run --file scripts/seed-opportunities.apex
 *
 * Idempotent. Identifies its own data by the demo Account (Name =
 * 'Pipeline Kanban Demo Co.') and by the Description marker on each
 * Opportunity, so re-running cleans up the previous run without
 * touching unrelated records.
 *
 * Creates 30 Opportunities across whatever StageName picklist values
 * the org actually has, Amount between 10k and 500k, CloseDate spread
 * over the next 90 days. Every record is owned by the running user
 * so Owner.SmallPhotoUrl resolves (User-owned, not Queue-owned).
 */

// 1. Cleanup — scoped to the demo Account so we never touch
//    unrelated data, even if a real Opportunity happens to share a
//    company name with our seed list.
List<Account> demoAccounts = [
  SELECT Id FROM Account WHERE Name = 'Pipeline Kanban Demo Co.'
];
if (!demoAccounts.isEmpty()) {
  delete [SELECT Id FROM Opportunity WHERE AccountId IN :demoAccounts];
  delete demoAccounts;
}

// 2. Anchor Account so Opportunities have a relationship even when
//    a validation rule requires AccountId.
Account demoAccount = new Account(Name = 'Pipeline Kanban Demo Co.');
insert demoAccount;

// 3. Read the active StageName picklist values from the running org
//    so the seed adapts to whatever customisations are in place.
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
//    Names carry no demo prefix — the Description field marks them
//    as seeded for cleanup queries that don't have the Account context.
List<Opportunity> opps = new List<Opportunity>();
for (Integer i = 0; i < companies.size(); i++) {
  String stage   = stages[Math.mod(i, stages.size())];
  Decimal amount = (Math.mod(i * 37, 50) + 1) * 10000; // 10k .. 500k
  Date closeOn   = Date.today().addDays(Math.mod(i * 13, 90));

  opps.add(new Opportunity(
    Name        = companies[i],
    Description = 'Seeded by Pipeline Kanban demo',
    AccountId   = demoAccount.Id,
    StageName   = stage,
    Amount      = amount,
    CloseDate   = closeOn,
    OwnerId     = UserInfo.getUserId()
  ));
}
insert opps;

System.debug(
  'Inserted ' + opps.size() + ' demo Opportunities owned by ' + UserInfo.getName()
);
