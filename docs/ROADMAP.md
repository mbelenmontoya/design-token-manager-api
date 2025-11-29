# Design Token Manager API - Roadmap

> **Current State**: API running on Supabase/PostgreSQL via Prisma with Database Abstraction Layer (DAL). Stage 1 migration complete. All controllers migrated. Platform admin support, project assignments, and dashboard endpoints operational. Currently in Stage 1.1 (post-migration polish & production readiness).

> **Vision**: Enterprise-grade design token management with strong multi-tenant architecture, RBAC, versioned tokens with immutable CDN-ready artifacts, seamless GitHub integration, and comprehensive observability.

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

#### **Current Status**: ✅ Complete
- ✅ Supabase project setup
- ✅ Prisma schema and generated client
- ✅ DAL foundation (Supabase active)
- ✅ Controllers migrated (tokens/import/categories/api-keys/invitations/memberships/releases)
- ✅ Mongo wiring/models removed
- ✅ Status endpoints
- ✅ Local smoke + Supabase Jest tests
- ✅ Swagger/OpenAPI refresh (schemas normalized; endpoints documented)
- ✅ Platform admin support and project assignments (v0.3.2)
- ✅ Dashboard endpoints (tenant creation, admin invitations)

---

### **Stage 1.1 — Post-Migration Polish & Production Readiness**

#### **Objectives**: Address immediate TODOs, expand test coverage, add billing readiness, re-enable CI

#### **Deliverables**:
- **Code TODOs Resolution**:
  - Webhook signature validation (Mercado Pago X-Signature/HMAC for production)
  - Email service integration for tenant admin invitations
- **Test Coverage Expansion**:
  - Comprehensive Supabase tests for API keys edge cases
  - Category CRUD tests
  - Factory tests for tenant/project/user creation
  - Edge case scenarios (invalid data, boundary conditions)
- **Billing Stubs** (Optional):
  - `GET /api/v1/billing/summary` - billing status and usage summary
  - `GET /api/v1/billing/portal` - customer portal link generation
- **Performance Validation**:
  - Load tests for token list/create endpoints
  - Response time benchmarks
- **CI Re-enablement**:
  - Minimal GitHub Actions workflow
  - Automated Supabase tests on PR
  - Status endpoint checks
  - Prisma schema validation

#### **Acceptance Criteria**:
- All TODO comments in code resolved or have tracking issues
- Test coverage >85% for Supabase operations
- Billing endpoints available (even if stubbed)
- CI pipeline green and running on PRs
- Performance benchmarks documented

#### **Current Status**: 📋 Planned

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

### **Active Stage: 1.1 — Post-Migration Polish & Production Readiness**

See **Stage 1.1** above for detailed deliverables and acceptance criteria.

#### Recently completed (Stage 1)
1. ✅ Complete migration from MongoDB to Supabase/PostgreSQL
2. ✅ Swagger/OpenAPI refresh (schemas normalized to `id`, new endpoints documented)
3. ✅ Platform admin support and project assignments (v0.3.2)
4. ✅ Dashboard endpoints (tenant creation, admin invitations)
5. ✅ Local verification script (`npm run local:verify`)

#### Current focus (Stage 1.1)
1. Code TODOs: Webhook validation, email service
2. Test coverage expansion for Supabase operations
3. Optional billing endpoint stubs
4. Performance benchmarks for token operations
5. CI pipeline re-enablement

---

*Last Updated: November 2025*
*Next Review: After Stage 1.1 completion*
