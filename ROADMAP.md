# Design Token Manager API - Roadmap

> **Current State**: API runs with Express; initial MongoDB testing exists. **Decision**: Migrate DB to PostgreSQL + Prisma with DAL and dual-write cutover. Health endpoint exists; auditing harness & Stage-1 tests are running in CI.

> **Pain-Point Goals**: Strong multi-tenant model and RBAC for enterprise. Versioned tokens + immutable artifacts (fast CDN). Easy exports and eventually GitHub PR push. Clear observability (health, metrics, audit).

---

## 5-Stage Development Plan

### **Stage 1 — Foundations & Migration (IN PROGRESS)**

#### **Objectives**: Move to PostgreSQL safely, keep behavior intact, don't break deploy

#### **Deliverables**:
- **Prisma Schema**: Tenants, Projects, Users, Memberships, Tokens (+Version history), ApiKeys, Invitations, (Usage counters optional)
- **DAL Layer**: Interfaces + two adapters (mongo, pg), selected via env: `DB_READS=mongo|postgres`, `DB_WRITES=mongo|dual|postgres`
- **Controllers**: Refactor to call DAL only; responses unchanged
- **Backfill & Compare Scripts**: Migrate historical data, diff reports, retry tool
- **Health/Status**: `/health` includes `postgres.connected`; `/status` returns storage modes (reads/writes)
- **CI**: Schema validate/generate; optional dry compare on seed

#### **Acceptance Criteria**:
- API passes Stage-1 tests with dual-write
- `/health` shows PostgreSQL OK when reachable
- No route/contract changes
- Deploy system not broken

#### **Current Status**: 🔄 **IN PROGRESS**
- ❌ PostgreSQL + Prisma setup
- ❌ DAL layer implementation
- ❌ Dual-write system
- ✅ Health endpoints exist
- ✅ CI with Stage-1 tests

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

### **Stage 1 Immediate Actions**
1. **Set up PostgreSQL + Prisma** schema and connection
2. **Implement DAL layer** with MongoDB and PostgreSQL adapters
3. **Create dual-write system** with environment toggles
4. **Build backfill and compare scripts** for data migration
5. **Update health endpoints** to include PostgreSQL status
6. **Ensure CI pipeline** validates schema changes

### **Migration Strategy**
- **Dual-write phase**: Write to both MongoDB and PostgreSQL
- **Validation phase**: Compare data consistency between databases
- **Read cutover**: Switch reads to PostgreSQL
- **Write cutover**: Switch writes to PostgreSQL only
- **Cleanup phase**: Remove MongoDB adapter and dependencies

---

*Last Updated: December 2024*  
*Next Review: After Stage 1 completion*
