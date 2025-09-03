# PR #3: Remove MongoDB/Mongoose Completely

Objective: Drop all remaining MongoDB/Mongoose code, tests, scripts, and dependencies. Run Supabase-only.

Scope
- Remove adapters: (DONE)
  - Delete `src/dal/adapters/MongoAdapter.js`
  - Delete `src/dal/adapters/DualWriteAdapter.js`
  - Simplify `src/dal/DatabaseFactory.js` to Supabase-only and synchronous creation
- Remove tests and helpers that depend on Mongoose: (IN PROGRESS)
  - Removed `tests/dal/*`, `tests/debug-mongo.test.js`
  - Keep and extend `tests/supabase/*` as the primary suite
- Remove scripts using Mongoose: (DONE)
  - Removed `src/scripts/seedUser.js`, `src/scripts/seedCategories.js`, `src/scripts/migrateTokens.js`
- Remove dependencies: (DONE)
  - From `package.json`: removed `mongoose` and `mongodb-memory-server`
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
