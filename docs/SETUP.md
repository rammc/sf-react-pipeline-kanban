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

## Deploy and run against an org

> The full deploy + scratch-org workflow is documented at the end of Phase 6. Until then, only the unit tests run without an org.

## Known Beta Template Issues

These are quirks of `@salesforce/ui-bundle-template-base-react-app@1.132.0` that this repo has worked around. Documented so future readers can verify whether they still apply when running the bootstrap themselves.

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
