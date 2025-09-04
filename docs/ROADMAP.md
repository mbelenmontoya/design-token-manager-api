# Design Token Manager API - Roadmap

> **Current State (Today)**: API is running on Supabase/PostgreSQL via Prisma behind a Database Abstraction Layer (DAL). Core controllers (tokens/import, categories, API keys, invitations, memberships, releases) use DAL. Mongo models and wiring were removed. CI is temporarily disabled (local-first workflow). New read endpoints added for dashboard integration.

> **Pain-Point Goals**: Strong multi-tenant model and RBAC for enterprise. Versioned tokens + immutable artifacts (fast CDN). Easy exports and eventually GitHub PR push. Clear observability (health, metrics, audit).

---

## 5-Stage Development Plan

### **Stage 1 — Foundations & Migration (Cutover in progress)**

#### **Objectives**: Move to PostgreSQL safely, keep behavior intact, don't break deploy

#### **Deliverables**:
- **Supabase Project Setup**: New Supabase project with PostgreSQL database
- **Prisma Schema**: Tenants, Projects, Users, Memberships, Tokens (+Version history), ApiKeys, Invitations, (Usage counters optional)
- **DAL Layer**: Interface + adapters (Supabase active; Mongo removed). Env now fixed to Supabase only.
- **Controllers**: Refactored to call DAL only; responses unchanged (prefer `id` over `_id`).
- **Backfill & Compare Scripts**: (deferred) Not required for greenfield Supabase.
- **Health/Status**: `/status/postgres` (Prisma connectivity) and `/status/database` (DAL config + health).
- **CI**: Temporarily disabled per project decision; local testing used.

#### **Acceptance Criteria**:
- API passes local smoke + Supabase Jest tests
- Status endpoints available (`/status/postgres`, `/status/database`)
- No breaking changes to API contracts (stable responses; `id` normalization)
- Deploy system healthy (Render deploy uses `@prisma/client` + postinstall generate)

#### **Current Status**: ✅ Core migration landed; cleanup in progress
- ✅ Supabase project setup
- ✅ Prisma schema and generated client
- ✅ DAL foundation (Supabase active)
- ✅ Controllers migrated (tokens/import/categories/api-keys/invitations/memberships/releases)
- ✅ Mongo wiring/models removed
- ✅ Status endpoints
- ✅ Local smoke + Supabase Jest tests
- 🔄 Swagger/OpenAPI refresh (next)

---

### **Stage 2 — Tokens, Theming & Export (API scope)**

#### **Objectives**: Enhanced token management with versioning and export capabilities

#### **Deliverables**:
- **Token CRUD endpoints** with UIDs (safe rename)
- **Theme inheritance rules** (resolve tree on read)
- **Versioning**: Write-once SemVer versions; rollback API
- **Export endpoints**: By theme/version/format (JSON, CSS vars, Tailwind, Style Dictionary)
- **Search/filter** server-side
- **Import endpoint** for onboarding JSON/CSV with validation report
- **Immutable artifacts**: `/v/{semver}/tokens?...` + manifest.json, ETag, Cache-Control: immutable

#### **Acceptance Criteria**:
- Endpoints return correct payloads/headers
- Artifacts are stable and cacheable
- Version math is consistent

---

### **Stage 3 — GitHub Integration (API scope)**

#### **Objectives**: GitHub workflow integration for design system teams

#### **Deliverables**:
- **Publish → PR endpoint** (generates branch + commit + PR with token files)
- **Conventions**: Branch/commit naming & generated messages
- **Webhook receiver** (future) for push events; store remote state and surface conflicts to Dashboard
- **Conflict detection API** for token files
- **Auth**: PAT or GitHub App (rotate safely; store encrypted)

#### **Acceptance Criteria**:
- Publishing a version creates a PR reliably
- Conflicts detectable
- Credentials safe

---

### **Stage 4 — Observability & Reliability (API scope)**

#### **Objectives**: Production monitoring and enterprise reliability

#### **Deliverables**:
- **Sentry** with tenant/project context
- **Metrics** per API version & format; request duration & error rates
- **Rate-limiting** by API key/tenant/IP (Redis or PostgreSQL counters)
- **Healthchecks & uptime monitoring** friendly to cloud probes
- **Audit logs**: Login, token CRUD, billing, key events

#### **Acceptance Criteria**:
- Dashboards show real usage
- Limits enforced
- Audits exportable

---

### **Stage 5 — Advanced Enterprise (API scope)**

#### **Objectives**: Enterprise-grade features and multi-region support

#### **Deliverables**:
- **Custom roles per tenant** (policy table)
- **SSO/SAML provider support** (WorkOS/Auth0)
- **Feature flags per tenant** (config table)
- **Audit export endpoints** (CSV/JSON)
- **Multi-region read replicas** or region-scoped artifacts

#### **Acceptance Criteria**:
- Enterprise controls available via API with proper authz

---

## Process & Controls

### **Phased Database Cutover**
1. **Dual-write** → backfill → flip reads → flip writes
2. **Production after staging** burn-in
3. **Deploy system must not be broken** during migration

### **API Contracts**
- **Contracts first**: OpenAPI keeps routes stable
- **Add deprecation headers** when evolving
- **No breaking changes** without proper versioning

### **CI/CD Process**
- **CI runs API Stage-1 tests + audit**
- **PRs only spin up DB/tests** when touching relevant paths
- **Schema validate/generate** in CI pipeline

---

## Current Technical Priorities

### **Near-term Tasks (Next Sprint)**

> **📋 Detailed Migration Plan**: See [docs/MIGRATION_PLAN.md](MIGRATION_PLAN.md) for the PR-based strategy

#### Done today
1. Controllers migrated to DAL (tokens/import/categories/api-keys/invitations/memberships/releases)
2. Removed Mongo wiring and models; Supabase-only factory
3. New endpoints: `GET /api/v1/users/me/memberships`, `GET /api/v1/api-keys`
4. Render deploy fix (`@prisma/client` + postinstall generate)
5. Local smoke and Supabase Jest tests green

#### Next (tomorrow)
1. Swagger/OpenAPI refresh
   - Normalize to `id` (drop `_id` in docs)
   - Document new endpoints (my memberships, API keys list)
2. Optional billing stubs
   - `GET /api/v1/billing/summary`
   - `GET /api/v1/billing/portal`
3. Local verification
   - Run `npm run smoke:all` and `npm run test:supabase`
4. CI re-introduction (optional, later)
   - Minimal: start server, run `smoke:supabase` and Supabase Jest using exact `.env` names

### **Migration Strategy**
- **Dual-write phase**: Write to both MongoDB and Supabase
- **Validation phase**: Compare data consistency between databases
- **Read cutover**: Switch reads to Supabase
- **Write cutover**: Switch writes to Supabase only
- **Cleanup phase**: Remove MongoDB adapter and dependencies

---

*Last Updated: September 2025*  
*Next Review: After Swagger/OpenAPI refresh*
