# Local Testing (Supabase)

This project runs locally against Supabase/Postgres via Prisma. CI is temporarily disabled; use these steps to validate changes locally.

## Prerequisites
- Node.js 18+ (recommended 20+)
- Supabase project with database password
- Environment file `.env` with EXACT names:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres
DB_READS=supabase
DB_WRITES=supabase
API_KEY=<optional; set if you don’t want bootstrap to create one>
TENANT_ID=<optional>
PROJECT_ID=<optional>
ADMIN_USER=admin@example.com
JWT_SECRET=change_me_dev_secret
JWT_EXPIRES_IN=1h
CLIENT_URL=http://localhost:5173
```

Notes:
- Use the pooler URL from Supabase Project Settings → Database.
- Keep these names; code and scripts expect them verbatim.

## First-time setup
```
npm ci
npx prisma generate
```

## Bootstrap demo data (optional)
If you don’t have `API_KEY`/`TENANT_ID`/`PROJECT_ID` set in `.env`, run:
```
node scripts/bootstrapSupabase.js
```
The script prints the IDs and API key. Copy them into `.env` so tests remain deterministic.

## Run the server
```
npm run dev
# or
npm start
```
Server: http://localhost:4000

## Smoke test (tokens via API key)
```
# Requires API_KEY, TENANT_ID, PROJECT_ID in env
npm run smoke:supabase
```
Expected output ends with: `All smoke tests passed ✅`

### Quick endpoint checks
```
# Status endpoints
npm run smoke:status

# Current user's memberships (JWT)
ADMIN_USERNAME=admin@example.com ADMIN_PASSWORD=Admin#123 npm run smoke:memberships

# List API keys for project (JWT admin)
TENANT_ID=... PROJECT_ID=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run smoke:api-keys

# End-to-end bundle (status + memberships + api-keys + tokens)
API_KEY=... TENANT_ID=... PROJECT_ID=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run smoke:all
```

## Run Supabase test suite locally
These are integration tests that start from your running server or can start it automatically.

```
# Start the server in another terminal first
npm run test:supabase
```
Covers:
- Tokens (API key read/write)
- Invitations/memberships (admin invite → accept → update role → revoke)
- Token releases (seed via Prisma, read manifests/tokens)

## Manual API checks
- Auth: `POST /api/v1/auth/login` with the admin credentials you created (bootstrap prints them)
- Invitations: `POST /api/v1/tenants/:tenantId/invitations` (admin JWT)
- Accept: `POST /api/v1/invitations/:token/accept` (invited user JWT)
- Memberships: `PATCH/DELETE /api/v1/memberships/:id` (admin JWT)
- Tokens: CRUD at `/api/v1/tokens` (JWT or API key)
- Status: `/status/postgres`, `/status/database`

## Troubleshooting
- DATABASE_URL empty: ensure `.env` contains `DATABASE_URL` and the server process inherited it.
- Prisma client mismatch: run `npx prisma generate` after updating schema.
- 401/403 with API key: confirm Authorization header is `Bearer <API_KEY>` and `x-tenant-id` / `x-project-id` match.
- Invitation acceptance fails: ensure the invited email equals the invited user’s `username`.

## Next steps
- Once local testing stabilizes, we’ll reintroduce CI with the same variable names and minimal steps.
