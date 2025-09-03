# PR #2: DAL Cutover (Supabase)

## Summary
- Migrated invitations, memberships, and token releases controllers to DAL
- Removed all Mongoose model usage from controllers and auth
- Simplified server startup; removed Mongo wiring and `/health` Mongo status
- Dropped `src/config/db.js` and `src/models/*`
- Ensured DatabaseFactory lazily loads Mongo adapters only if configured
- Updated README to reflect Supabase-first setup and status endpoints

## Environment
Ensure `.env` contains:
```
DB_READS=supabase
DB_WRITES=supabase
```

## Smoke Results (Supabase)
Run:
```
API_KEY=... TENANT_ID=... PROJECT_ID=... npm run smoke:supabase
```

Output from local run:
```
GET /api/v1/tokens
✅ GET tokens OK: 1
POST /api/v1/tokens
✅ POST token OK: cmf4fnxwe0001sb3gv8ra5gqr
GET /api/v1/tokens (after create)
✅ GET tokens OK: 2
All smoke tests passed ✅
```

Optional: run automated Supabase tests:
```
npm run test:supabase
```

Supabase Jest results (local):
```
PASS  tests/supabase/invitations.memberships.supabase.test.js
PASS  tests/supabase/releases.supabase.test.js
PASS  tests/supabase/tokens.apiKey.supabase.test.js

Test Suites: 3 passed, 3 total
Tests:       3 passed, 3 total
```

## Manual Checks
- Invitations: `POST /api/v1/tenants/:tenantId/invitations` (as admin JWT)
- Accept invitation: `POST /api/v1/invitations/:token/accept` (JWT of invited user)
- Memberships: `PATCH /api/v1/memberships/:id`, `DELETE /api/v1/memberships/:id` (admin JWT)

## Notes
- Mongo adapter files remain for reference but are not loaded when `DB_*` set to `supabase`.
- Auth login now validates via Prisma user table using bcrypt compare.
 - Documentation consolidated under `docs/`; added `docs/TESTING_LOCAL_SUPABASE.md`.
 - CI temporarily disabled (manual-only) per project decision; local testing is the source of truth.
