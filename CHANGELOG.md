# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Documentation restructure: moved roadmap to ROADMAP.md
- Planned migration from MongoDB to PostgreSQL + Prisma

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
