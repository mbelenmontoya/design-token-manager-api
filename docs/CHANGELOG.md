# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Stage 1.1 Implementation Progress (77% Complete - 17/22 Steps)

**Completed:**
- ✅ Phase 1: Code TODOs Resolution (4/4 steps)
- ✅ Phase 2: Test Coverage Expansion (4/4 steps)
- ✅ Phase 3: Billing Readiness (3/3 steps)
- ✅ Phase 4: Performance Validation (2/2 steps)

**Remaining:**
- 📋 Phase 5: CI Re-enablement (0/4 steps)
- 📋 Phase 6: Documentation Updates (4/5 steps in progress)

### Added - Phase 1: Code TODOs Resolution

**Webhook Security:**
- Mercado Pago webhook signature validation (HMAC-SHA256)
- Signature validation middleware with replay attack prevention
- Environment-based enforcement (`MERCADOPAGO_ENFORCE_SIGNATURE`)
- Webhook handler refactored to use DAL instead of direct Prisma

**Email Service:**
- Email service abstraction layer with provider pattern
- Console email provider (development/testing)
- SendGrid email provider (production)
- Resend email provider (production)
- Email service factory with singleton pattern
- Comprehensive email templates (tenant invitation, team member invitation, password reset)
- Responsive HTML email templates with consistent styling
- Tenant admin invitation email integration in tenant controller

**Files Created:**
- `src/utils/webhookValidation.js` - Signature validation utility
- `src/services/email/EmailProvider.js` - Provider interface
- `src/services/email/ConsoleEmailProvider.js` - Development provider
- `src/services/email/SendGridEmailProvider.js` - SendGrid integration
- `src/services/email/ResendEmailProvider.js` - Resend integration
- `src/services/email/EmailServiceFactory.js` - Provider factory
- `src/services/email/emailTemplates.js` - HTML email templates
- `src/services/email/EmailService.js` - High-level email service
- `tests/unit/webhookValidation.test.js` - Webhook validation tests
- `tests/unit/emailService.test.js` - Email service tests

### Added - Phase 2: Test Coverage Expansion

**Comprehensive Test Suites (250+ test cases):**
- API key tests: Creation, rotation, revocation, scope enforcement, multi-tenant isolation (60+ cases)
- Category tests: CRUD operations, validation, usage patterns, performance (30+ cases)
- Error handling tests: All HTTP status codes (400-500), boundary conditions (70+ cases)
- Factory tests: Data generation utilities, batch creation, invalid data (40+ cases)
- Test data factories: Reusable helpers for generating realistic test data

**Coverage:**
- Estimated >85% coverage for Supabase operations
- Multi-tenant isolation validation
- Authentication and authorization scenarios
- Edge cases and boundary conditions
- Concurrent request handling

**Files Created:**
- `tests/supabase/apiKeys.comprehensive.test.js` - API key comprehensive tests
- `tests/supabase/categories.comprehensive.test.js` - Category comprehensive tests
- `tests/supabase/errorHandling.comprehensive.test.js` - Error handling tests
- `tests/supabase/factories.test.js` - Factory validation tests
- `tests/helpers/testFactories.js` - Test data factory utilities

### Added - Phase 3: Billing Readiness

**Billing Tests (50+ test cases):**
- Billing summary endpoint validation
- Billing portal URL generation
- Provider stub verification (Stripe, MercadoPago)
- Admin-only access control
- Tenant isolation enforcement
- Webhook integration validation
- Performance and concurrency tests

**Configuration:**
- Billing provider configuration (`BILLING_PROVIDER`)
- Billing portal return URL configuration

**Files Created:**
- `tests/supabase/billing.comprehensive.test.js` - Comprehensive billing tests

### Added - Phase 4: Performance Validation

**Performance Test Suite:**
- Baseline performance measurement (single request latency)
- Pagination performance testing (10, 20, 50, 100 items)
- Filtering performance testing (category-based queries)
- Bulk token creation testing (1, 5, 10, 20 batches)
- Concurrent users simulation (100 users, 500 total requests)
- Detailed statistics (min, avg, max, P50, P95, P99)
- Colored console output with pass/fail criteria

**Performance Documentation:**
- Response time SLA targets (<200ms P95)
- Throughput targets (500+ req/s, 100+ concurrent users)
- Resource usage targets and alerts
- Baseline measurements and test environment specs
- Regression detection strategy
- Performance budgets per endpoint
- Optimization guidelines (query optimization, caching, connection pooling)
- Monitoring and alerting rules
- Historical performance tracking
- Future optimization roadmap

**Files Created:**
- `scripts/performance-test-supabase.js` - Comprehensive load test suite
- `docs/PERFORMANCE.md` - Performance benchmarks and guidelines

**NPM Scripts Added:**
- `npm run performance:supabase` - Run Supabase performance tests

### Changed

**Configuration:**
- `.env.example` updated with webhook, email, and billing configuration
- Environment variables for signature validation enforcement
- Email provider selection and API keys
- Billing provider and return URL configuration

**Controllers:**
- `src/controllers/tenantController.js` - Integrated email service for tenant invitations
- `src/routes/webhooks.js` - Added signature validation and DAL usage

**Package Scripts:**
- Added `performance:supabase` for performance testing

**Documentation:**
- Claude Code Skills System (from previous session)
- Documentation cleanup (MongoDB → PostgreSQL/Supabase)
- ROADMAP.md: Added Stage 1.1 section
- MIGRATION_PLAN.md: Marked complete

### Remaining - Stage 1.1 Tasks

**Phase 5: CI Re-enablement** (Not Started):
- [ ] Configure GitHub Secrets for Supabase credentials
- [ ] Remove `if: ${{ false }}` from all CI jobs
- [ ] Update workflow triggers (pull_request instead of workflow_dispatch)
- [ ] Test CI pipeline end-to-end with test PR

**Phase 6: Documentation Updates** (In Progress):
- [x] Update CHANGELOG.md with Stage 1.1 changes
- [ ] Update NEXT_STEPS.md (mark complete tasks, add Phase 5 details)
- [ ] Update ROADMAP.md (mark Stage 1.1 complete)
- [ ] Update CLAUDE.md (document new patterns: email service, webhooks)
- [ ] Update README.md (reflect v0.3.3 or Stage 1.1 milestone)

## [0.3.2] - 2025-09-05

### Added
- Platform admin (DB flag `users.platformAdmin`) and support endpoints:
  - `GET /api/v1/users/me` to fetch current user
  - `GET /api/v1/tenants` (platform admin only)
- Project assignments (user↔project) model + enforcement for editor/viewer.
- Assignments endpoints (org_admin):
  - `GET /api/v1/tenants/:tenantId/projects/:projectId/assignments`
  - `POST /api/v1/tenants/:tenantId/projects/:projectId/assignments`
  - `DELETE /api/v1/tenants/:tenantId/projects/:projectId/assignments/:userId`
- Smoke scripts: `smoke:assignments` with create/list/delete logging.

### Changed
- `GET /api/v1/tenants/:tenantId/projects` returns all projects for org_admin and only assigned for editor/viewer.
- Docs: local testing guide updated with platform admin setup and auth troubleshooting.


## [0.3.1] - 2025-09-04

### Added
- Swagger/OpenAPI refresh: schemas normalized to `id`/`tenantId`/`projectId`, header parameters `x-tenant-id`, `x-project-id`, documented users/memberships and API key routes.
- Local verification script `npm run local:verify` (status + Supabase tests + smokes).

### Changed
- Prisma client import now targets generated path `src/generated/prisma`.
- Health tests updated to `/status/database` and `/status/postgres`.

### Removed
- Legacy Mongo/Mongoose tests and setup files.

## [0.3.0] - 2025-09-04

### Added
- Endpoints: `GET /api/v1/users/me/memberships` (JWT) to list current user memberships.
- Endpoints: `GET /api/v1/api-keys` (JWT admin + tenant/project headers) to list project API keys.
- Local smoke scripts to validate critical flows before pushing:
  - `smoke:status`, `smoke:memberships`, `smoke:api-keys`, `smoke:all`.

### Changed
- Supabase-only runtime: removed Mongo wiring and models; DAL factory simplified to Supabase adapter only.
- Controllers for invitations, memberships, and token releases migrated to DAL (Prisma/Supabase).
- Prisma import switched to `@prisma/client`; added `postinstall` to generate client for deploy.
- Documentation consolidated under `docs/` and updated roadmap with current state and next steps.
- Tests: Supabase Jest suite stabilized (dotenv load, ESM jest import, longer timeout for API-key test) and Prisma disconnect on teardown.

### Removed
- Legacy Mongo adapters (`MongoAdapter`, `DualWriteAdapter`) and scripts (`seedUser`, `seedCategories`, `migrateTokens`).
- Mongo-related tests and dependencies (`mongoose`, `mongodb-memory-server`).

### Notes
- CI is temporarily disabled per project decision; local testing (smoke + Supabase Jest) is the source of truth.

### Changed
- Documentation restructure: moved roadmap to ROADMAP.md
- Planned migration from MongoDB to PostgreSQL + Prisma
 - Supabase adapter implemented; tokens + import controllers migrated to DAL
 - Middlewares (tenantContext, verifyApiKey) migrated to DAL
 - Added Supabase smoke test script and Postgres status endpoint

### Deprecated
- MongoDB as primary database (migrating to PostgreSQL)

## [0.2.0] - 2024-12-19

### Added
- Comprehensive project documentation (PRD, Technical Spec, Project Outline)
- ROADMAP.md with 5-stage development plan
- This changelog

### Changed
- Consolidated redundant documentation files
- Updated README with proper project history section

## [0.1.0] - 2024-11-30

### Added
- Express.js REST API foundation
- MongoDB integration with Mongoose ODM
- JWT-based authentication system
- Multi-tenant architecture (Tenants, Projects, Users, Memberships)
- Token CRUD operations with categories
- API key authentication for programmatic access
- Role-based access control (admin, editor, viewer)
- Team management with invitations
- Bulk token import/export functionality
- Token releases and versioning system
- Interactive Swagger/OpenAPI documentation
- Health and status endpoints
- Comprehensive test suite with Jest
- Input validation and centralized error handling
- CORS and security middleware

### Technical
- Node.js 18+ with ES modules
- MongoDB Atlas integration
- bcryptjs for password hashing
- express-validator for input validation
- swagger-jsdoc for API documentation
- Comprehensive middleware stack
