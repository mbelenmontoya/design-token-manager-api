# Design Token Manager API

A RESTful API for managing design tokens with multi-tenant architecture, JWT authentication, and enterprise-grade features.

## Table of Contents

* [Features](#features)
* [Quick Start](#quick-start)
* [API Documentation](#api-documentation)
* [Development](#development)
* [Project History](#project-history)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Multi-tenant architecture** with tenant/project isolation
* **JWT & API key authentication** for secure access
* **Role-based access control** (admin, editor, viewer)
* **Design token CRUD** with categories and validation
* **Team management** with invitations and memberships
* **Bulk import/export** functionality
* **Token releases and versioning**
* **Interactive Swagger documentation**

## Quick Start

### Prerequisites
* Node.js v18+ and npm
* Supabase project (PostgreSQL)

### Setup
```bash
# Clone and install
git clone <repository-url>
cd design-token-manager-api
npm install

# Environment setup (Supabase)
cp .env.example .env
# Required env vars:
# - SUPABASE_URL=https://<project-ref>.supabase.co
# - SUPABASE_ANON_KEY=<anon>
# - DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
# - DB_READS=supabase
# - DB_WRITES=supabase

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Bootstrap a demo tenant/project/user + API key
npm run bootstrap:supabase

# Start development server
npm run dev
```

The API will be available at `http://localhost:4000`

### Quick Smoke Test (Supabase)
```bash
# From bootstrap output copy API_KEY, TENANT_ID, PROJECT_ID
export API_KEY=dtm_ak_...
export TENANT_ID=...
export PROJECT_ID=...

# Run smoke test for tokens endpoints (GET+POST)
npm run smoke:supabase
```

## API Documentation

Interactive Swagger documentation available at: `http://localhost:4000/api-docs/v1`

### Key Endpoints
- **Authentication**: `POST /api/v1/auth/login`
- **Tokens**: Full CRUD at `/api/v1/tokens`
- **API Keys**: Management at `/api/v1/api-keys`
- **Team Management**: `/api/v1/invitations`, `/api/v1/memberships`
- **Health**: `/health`, `/status`

## Development

### Available Scripts
```bash
npm run dev              # Start development server
npm start                # Production server
npm run lint             # Code quality checks
npm test                 # Run all tests
npm run test:endpoints   # Integration tests
```

### Tech Stack
- **Node.js 18+** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication + **API key** auth
- **Swagger** for API documentation
- **Jest** for testing

## Project History

For detailed project history and what changes were made when, see [CHANGELOG.md](CHANGELOG.md).  
For future plans and development roadmap, see [ROADMAP.md](ROADMAP.md).

Key highlights:
- **Multi-tenant API** with MongoDB backend
- **Comprehensive authentication** (JWT + API keys)
- **Planned migration** to PostgreSQL + Prisma
- **5-stage development roadmap** for enterprise features

## Contributing

1. Fork this repo
2. Create a branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
