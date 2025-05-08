# Design Token Manager API

A simple RESTful API for managing design tokens (colors, spacing, fonts, shadows, etc.), built with Node.js, Express, MongoDB Atlas, JWT authentication, and self-documented via Swagger. Includes a React-based admin dashboard for browsing and editing tokens.

## Table of Contents

- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Prerequisites](#prerequisites)  
- [Getting Started](#getting-started)  
  - [Clone & Install](#clone--install)  
  - [Environment Variables](#environment-variables)  
  - [Seed Admin User](#seed-admin-user)  
  - [Run the API](#run-the-api)  
  - [Swagger UI](#swagger-ui)  
- [Admin Dashboard](#admin-dashboard)  
  - [Clone & Install](#clone--install-1)  
  - [Environment Variables](#environment-variables-1)  
  - [Run the Dashboard](#run-the-dashboard)  
- [Testing with Postman](#testing-with-postman)  
- [Deploying](#deploying)  
- [Contributing](#contributing)  
- [License](#license)

## Features

- CRUD endpoints for design tokens  
- JWT-based authentication (login → Bearer token)  
- Input validation & centralized error handling  
- Pagination & filtering on GET  
- Interactive Swagger UI at `/api-docs`  
- React admin dashboard for token management  

## Tech Stack

- **API:** Node.js, Express, Mongoose, MongoDB Atlas  
- **Auth:** JSON Web Tokens (`jsonwebtoken`), password hashing (`bcryptjs`)  
- **Docs:** Swagger (OpenAPI) via `swagger-jsdoc` + `swagger-ui-express`  
- **UI:** Vite + React  

## Prerequisites

- Node.js ≥ 18  
- NPM or Yarn  
- A MongoDB Atlas cluster (you’ll need your connection URI)  
- (Optional) GitHub CLI (`gh`) for repo creation  

## Getting Started

### Clone & Install

```bash
# API
git clone https://github.com/<your-org>/design-token-manager-api.git
cd design-token-manager-api
npm install
