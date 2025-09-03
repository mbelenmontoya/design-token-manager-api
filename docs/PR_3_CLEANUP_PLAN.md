# PR #3: Remove MongoDB/Mongoose Completely

Objective: Drop all remaining MongoDB/Mongoose code, tests, scripts, and dependencies. Run Supabase-only.

Scope
- Remove adapters:
  - Delete `src/dal/adapters/MongoAdapter.js`
  - Delete `src/dal/adapters/DualWriteAdapter.js`
  - Simplify `src/dal/DatabaseFactory.js` to Supabase-only and synchronous creation
- Remove tests and helpers that depend on Mongoose:
  - `tests/**/*.test.js` under `dal/*` that target Mongo
  - `tests/setup/*` that starts in-memory Mongo and /health polling
  - `tests/helpers/factories.js` using Mongoose models
  - `tests/invitations.test.js`, old `token*` tests referencing models or /health
  - Keep and extend `tests/supabase/*` as the primary suite
- Remove scripts using Mongoose:
  - `src/scripts/seedUser.js`, `src/scripts/seedCategories.js`
  - `src/scripts/migrateTokens.js`
- Remove dependencies:
  - From `package.json`: `mongoose`, `mongodb-memory-server`
- Docs/cleanup:
  - Update README to remove Mongo references entirely
  - Update MIGRATION_PLAN to mark cutover complete
  - Remove any CI steps related to Mongo

Acceptance Criteria
- `npm run test:supabase` passes
- `npm test` is updated to target Supabase tests by default or is clearly partitioned
- No `mongoose` or `mongodb` strings in the repo

Follow-ups
- Add broader Supabase tests for API keys, categories, and tenant/project factories
- Add load/perf smoke for tokens on Supabase

