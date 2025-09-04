# Next Steps — Post‑merge (Supabase‑only)

## Current Status
- ✅ Supabase runtime active via Prisma + DAL
- ✅ Swagger/OpenAPI refreshed; docs cleaned
- ✅ Legacy Mongo tests removed; Supabase tests + smoke green

## Validate Locally
```bash
# Ensure env is set (see TESTING_LOCAL_SUPABASE.md)
npx prisma generate
npm run local:verify   # status + Supabase tests + smokes
```

## Short‑term Tasks
- Expand Supabase tests: broader coverage for API keys, categories, factories, and edge cases
- Optional billing stubs: `GET /api/v1/billing/summary`, `GET /api/v1/billing/portal`
- Performance smoke: simple load checks for token list/create
- CI (later): minimal workflow to start server and run status + Supabase tests using project `.env`

## Notes
- OpenAPI v1 normalized to `id`/`tenantId`/`projectId` and documented headers `x-tenant-id`, `x-project-id`.
- Use `npm run local:verify` before pushing to keep `main` green.
