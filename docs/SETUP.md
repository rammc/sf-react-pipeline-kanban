# Setup

> Multi-Framework is in **open beta** as of Spring '26. Scratch orgs and sandboxes only — production deployment is not supported during the beta. Org default language must be English.

## Prerequisites

- Node.js v22 or newer
- Salesforce CLI (`sf`) v2.118+
- A scratch org or sandbox with Multi-Framework enabled
- The UI Bundle dev plugin: `sf plugins install @salesforce/plugin-ui-bundle-dev`

## First-time install

```bash
git clone <this-repo>
cd sf-react-pipeline-kanban
cd force-app/main/default/uiBundles/pipelineKanban
npm install
```

## Run the unit tests

```bash
# from the UI bundle directory
npx vitest run
```

Tests use Vitest with mocked `@/api/graphqlClient` — no org required.

## Run against an org (live preview)

The primary run path during the Multi-Framework beta is the local dev server with a GraphQL proxy to your org — **no full deploy needed**:

```bash
# 1. From the repo root, deploy the permission set + assign it.
sf project deploy start --source-dir force-app/main/default/permissionsets --target-org <alias>
sf org assign permset --name PipelineKanban_App --target-org <alias>

# 2. (Optional) seed demo data. See note about custom stages below.
sf apex run --file scripts/seed-opportunities.apex --target-org <alias>

# 3. From the UI bundle directory, start the dev server.
cd force-app/main/default/uiBundles/pipelineKanban
sf ui-bundle dev --target-org <alias> --name pipelineKanban --open
```

A browser tab opens against the proxy URL. GraphQL requests flow through the org's session; React renders locally with hot reload.

### Seed data

`scripts/seed-opportunities.apex` reads the active `Opportunity.StageName` picklist from the running org and distributes 30 demo records across whatever stages it finds. Works on a vanilla scratch org _and_ on customised sandboxes without modification.

`useStages()` reads the same picklist client-side, so the board always reflects what the org actually has. Forecast probabilities (Phase 5) are mapped to common stage names — custom stages without a known mapping default to 0.

To verify the seed loaded, run the SOQL in `scripts/soql/seed-verification.soql` (should return 30 rows ordered by stage and close date).

### App Launcher integration — deferred to Phase 6

The verified Multi-Framework metadata pattern for placing a UIBundle into a CustomTab + CustomApplication has not yet stabilised in the open beta. This repo therefore ships the dev-server flow above as the primary run path. App Launcher integration is tracked for Phase 6 (or later, depending on how the beta evolves) — once an authoritative pattern surfaces, we add a `tabs/` and `applications/` directory and document the deploy step.

## Known Beta Template Issues

These are quirks of the Multi-Framework Beta template and runtime that this repo has worked around. Documented so future readers can verify whether they still apply when running the bootstrap themselves.

### Versions this repo was built against

| Package                                         | Version | Role                                                        |
| ----------------------------------------------- | ------- | ----------------------------------------------------------- |
| Salesforce CLI (`sf`)                           | 2.118+  | Base CLI                                                    |
| `@salesforce/plugin-ui-bundle-dev`              | 1.2.2   | The `sf ui-bundle dev` command                              |
| `@salesforce/ui-bundle-template-base-react-app` | 1.132.0 | Scaffolding template                                        |
| `@salesforce/ui-bundle`                         | 1.132.0 | Runtime + dev-server proxy (the package the patches target) |
| Node.js                                         | 22.x    | UI bundle build/test                                        |

If you hit issues that look like the ones below, your first check is whether your versions match. If they don't, the patches and config tweaks may not apply cleanly.

### 1. Broken monorepo path mappings in `tsconfig.json`

The template ships with `paths` entries that point at internal Salesforce monorepo source files which don't exist in a standalone repo:

```diff
 "paths": {
   "@/*": ["./src/*"],
   ...
-  "@salesforce/sdk-core": [
-    "../../../../../../../../../../packages/sdk/sdk-core/src/index.ts"
-  ],
-  "@salesforce/sdk-data": [
-    "../../../../../../../../../../packages/sdk/sdk-data/src/index.ts"
-  ]
 }
```

Removing those entries lets TypeScript resolve `@salesforce/sdk-data` and `@salesforce/sdk-core` from `node_modules/` as expected. **Fixed in this repo.**

### 2. Conflicting Vitest configurations

The template has both a top-level `vitest.config.ts` and a duplicate `test:` block inside `vite.config.ts`. The two reference different setup files (`./vitest.setup.ts` vs. `./src/test/setup.ts`) and Vitest's own config wins, dropping the `resolve.alias` defined in `vite.config.ts` — which makes `@/api/...` imports unresolvable in tests.

Resolution: delete `vitest.config.ts`, point `vite.config.ts`'s `test.setupFiles` at the existing `./vitest.setup.ts`. **Fixed in this repo.**

### 3. `graphqlClient.ts` line 13

> Earlier reports of a manual fix needed at `src/api/graphqlClient.ts:13` (the optional-call-with-generics line `data.graphql?.<T, V>({ ... })`) **could not be reproduced** in template `v1.132.0`. `tsc --noEmit` and Vitest both compile the file as-is. If you hit a build error here, check your TypeScript version (template requires `~5.9.3`) and report back.

### 4. Codegen requires a connected org

`npm run graphql:schema` runs `scripts/get-graphql-schema.mjs`, which calls `getOrgInfo()` from `@salesforce/ui-bundle/app`. Without an authenticated org, codegen will fail. This repo ships **manually-written types** in `src/types/opportunity.ts` so the unit tests run without org access.

If you want codegen-generated operation types:

```bash
sf org login web --alias mf-beta
sf config set target-org=mf-beta
npm run graphql:schema   # writes ../../../../../schema.graphql
npm run graphql:codegen  # writes src/api/graphql-operations-types.ts
```

Note: the schema path in `codegen.yml` (`../../../../../schema.graphql`) is itself a monorepo leftover. Override it (e.g. `npm run graphql:schema -- ./schema.graphql`) and update `codegen.yml` if you want the schema checked into the repo root.

### 5. `npx vitest` warns about a missing default org

The `@salesforce/vite-plugin-ui-bundle` Vite plugin loads even during test runs and logs:

```
No default org found. Run "sf org login" to authenticate an org...
```

This is harmless for unit tests — they don't hit the org. Suppress by setting a default org or filter the line in CI logs.

### 6. `@salesforce/ui-bundle` runtime patches (applied via `patch-package`)

The `force-app/main/default/uiBundles/pipelineKanban/patches/` directory holds a single patch file, applied automatically on every `npm install` via the `postinstall` hook:

#### `@salesforce+ui-bundle+1.132.0.patch`

Three independent fixes against `dist/proxy/handler.js` and `dist/proxy/routing.js` in `@salesforce/ui-bundle@1.132.0`. Each one was diagnosed during Phase 3's verify pass against a live sandbox; each one blocks the local dev server from reaching the org until applied.

- **`routing.js` — basePath normalisation.** The Vite plugin sets `basePath = "/"` in dev mode, and the proxy's regex builds `^//services/data/v\d{2}\.\d/(...)` from that — a literal double-slash that never matches the single-slash paths the SDK actually requests. The patch normalises `"/"` → `""` at the top of `matchRoute()`, so the regex becomes `^/services/data/v\d{2}\.\d/(...)` and the API match works.
- **`handler.js` — drop `Cookie: sid=<oauth-token>`.** `handleSalesforceApi` was setting both a session cookie _and_ a Bearer header with the same OAuth access token. `sfdcedge` on sandboxes rejected the request with HTTP 400 `INVALID_ACCESS_TOKEN` — OAuth tokens aren't valid as `sid` cookies. The patch removes the cookie line; Bearer alone authenticates correctly.
- **`handler.js` — use `rawInstanceUrl`, not `instanceUrl`.** `getOrgInfo()` rewrites `instanceUrl` from `*.my.salesforce.com` to `*.lightning.force.com` (correct for Lightning Frontdoor URLs, wrong for `/services/data/*`). API calls to the Lightning domain return empty bodies on sandboxes. The patch falls back to `rawInstanceUrl` first, which is the original `*.my.salesforce.com` host where the API actually lives.

If `npm install` reports `patch-package` failing to apply this patch, your installed `@salesforce/ui-bundle` is no longer at `1.132.0`. Verify with `npm ls @salesforce/ui-bundle` from inside the UI bundle directory and refresh the patch (`npx patch-package @salesforce/ui-bundle`) once you've confirmed the upstream still has the same bugs.
