# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
