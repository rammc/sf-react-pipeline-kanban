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
 *
 * Also creates 2-4 completed Tasks per Opportunity so the detail-view
 * activity section renders with real data instead of the empty state.
 */

// 1. Cleanup — scoped to the demo Account so we never touch
//    unrelated data, even if a real Opportunity happens to share a
//    company name with our seed list. Tasks must go before their
//    parent Opportunity so we don't leave orphans behind.
List<Account> demoAccounts = [
  SELECT Id FROM Account WHERE Name = 'Pipeline Kanban Demo Co.'
];
if (!demoAccounts.isEmpty()) {
  List<Opportunity> oldOpps = [
    SELECT Id FROM Opportunity WHERE AccountId IN :demoAccounts
  ];
  if (!oldOpps.isEmpty()) {
    delete [SELECT Id FROM Task WHERE WhatId IN :oldOpps];
    delete oldOpps;
  }
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

// 5. Seed Tasks (activity history) — 2-4 per Opportunity, each
//    linked via WhatId. Subjects rotate through a list of common
//    sales activities; ActivityDate spreads back over the past 60
//    days so the activity feed reads as recent history. All
//    completed so the detail view shows them as past activity.
List<String> taskSubjects = new List<String>{
  'Discovery call held',
  'Sent proposal v1',
  'Sent proposal v2',
  'Stakeholder meeting',
  'Pricing discussion',
  'Demo scheduled',
  'Contract review with legal',
  'Follow-up on objections',
  'Procurement intro call',
  'Reference customer call',
  'Technical deep-dive',
  'Quote revision sent'
};

List<Task> tasks = new List<Task>();
for (Integer i = 0; i < opps.size(); i++) {
  Opportunity opp = opps[i];
  Integer taskCount = Math.mod(i, 3) + 2; // 2..4
  for (Integer j = 0; j < taskCount; j++) {
    String subject = taskSubjects[
      Math.mod(i * 7 + j * 3, taskSubjects.size())
    ];
    Date activityDate = Date.today().addDays(-Math.mod(i + j * 5, 60));
    tasks.add(new Task(
      Subject      = subject,
      WhatId       = opp.Id,
      ActivityDate = activityDate,
      Description  = 'Seeded by Pipeline Kanban demo',
      OwnerId      = UserInfo.getUserId(),
      Status       = 'Completed',
      Priority     = 'Normal'
    ));
  }
}
insert tasks;

System.debug(
  'Inserted ' + opps.size() + ' demo Opportunities and ' +
  tasks.size() + ' related Tasks owned by ' + UserInfo.getName()
);
