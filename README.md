# Design Token Manager API

A RESTful API for managing design tokens (colors, spacing, fonts, shadows, etc.) with JWT authentication and auto-generated Swagger documentation.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Setup](#setup)

  * [Clone & Install](#clone--install)
  * [Environment Variables](#environment-variables)
  * [Seed Admin User](#seed-admin-user)
  * [Run the API](#run-the-api)
* [API Documentation (Swagger)](#api-documentation-swagger)
* [API Endpoints](#api-endpoints)
* [Scripts](#scripts)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **CRUD** for design tokens
* **JWT** authentication (login endpoint)
* **Input validation** and centralized error handling
* **Pagination & filtering** on token listing
* **Interactive Swagger** UI at `/api-docs`

---

## Tech Stack

* **Node.js** & **Express**
* **MongoDB Atlas** via **Mongoose**
* **jsonwebtoken** for JWT
* **bcryptjs** for password hashing
* **swagger-jsdoc** & **swagger-ui-express** for docs
* **cors**, **morgan** for middleware

---

## Prerequisites

* Node.js v18+ and npm
* MongoDB Atlas account (free tier is sufficient)
* Git

---

## Setup

### Clone & Install

```bash
git clone https://github.com/mbelenmontoya/design-token-manager-api.git
cd design-token-manager-api
npm install
```

### Environment Variables

Create a `.env` file in the project root using the `.env.example` as a template:

```dotenv
PORT=4000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
CLIENT_URL=http://localhost:5173
```

### Seed Admin User

Run the seed script to create the initial `admin` user:

```bash
node scripts/seedUser.js
# → Creates admin / Admin#123 (if not existing)
```

### Run the API

```bash
npm run dev
```

* The server listens on `http://localhost:4000`
* Health check at `http://localhost:4000/`

---

## API Documentation (Swagger)

Once running, open:

```
http://localhost:4000/api-docs
```

Browse and test all endpoints interactively.

---

## API Endpoints

### Auth

* `POST /api/auth/login`

  * **Body**: `{ "username": string, "password": string }`
  * **Response**: `{ "token": string }`

### Tokens

* `GET /api/tokens`

  * Query params: `page`, `limit`, `category`
  * Returns: `{ total, page, limit, pages, tokens: [] }`

* `POST /api/tokens` (JWT required)

  * **Body**: `{ "name": string, "value": string, "category": string, "description"?: string }`
  * **Response**: Created token object

* `PUT /api/tokens/:id` (JWT required)

  * **Body**: Partial token fields
  * **Response**: Updated token object

* `DELETE /api/tokens/:id` (JWT required)

  * **Response**: `{ "message": "Token removed" }`

---

## Scripts

| Command                    | Description                     |
| -------------------------- | ------------------------------- |
| `npm run dev`              | Start server with nodemon (dev) |
| `npm start`                | Start server (production)       |
| `node scripts/seedUser.js` | Seed admin user                 |

---

## Contributing

1. Fork this repo
2. Create a branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)
