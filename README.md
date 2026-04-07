# SocSys - Smart Society Management Platform

A full-stack society management platform for residents, owners, admins, and buyers/renters.

SocSys combines role-based dashboards, property workflows, complaint tracking, and authentication into one system. It is built with a React/Next-style frontend and an Express + PostgreSQL backend powered by Supabase.

---

## Overview

SocSys is designed to solve day-to-day apartment/society operations through one connected product.

Instead of running separate tools for complaints, listings, tenant records, admin operations, and user access, SocSys brings everything into one platform with role-aware experiences:

- Admin: society-wide control and monitoring
- Owner: property and tenant management
- Tenant: payments and complaints
- Buyer/Renter: listing discovery and offers

The project supports both local development and cloud deployment, with PostgreSQL connectivity through Supabase (including pooler support for serverless hosting).

---

## Core Highlights

### Role-Based Dashboard System

- Dedicated dashboards for:
  - Admin
  - House Owner
  - Tenant
  - Buyer/Renter
- Route-level access control using role checks
- Session-aware navigation and protected routes

### Authentication and Authorization

- Google OAuth via Supabase for buyer/renter flow
- Personal account login flow for managed users
- Backend role authorization (`/api/auth/authorize-user`)
- Session persistence using local storage + Supabase auth state

### Society Operations Modules

- Complaint registration and tracking
- Property listing workflows
- Buyer offer submission flow
- Account and profile management
- Dashboard summary and monitoring endpoints

### Backend Data Layer

- PostgreSQL via `pg` connection pool
- Auto-initialization of core tables on startup
- Safe error normalization for duplicate/constraint cases
- Debug and health endpoints for runtime verification

### Deployment-Ready Infrastructure

- Vercel-compatible API handler (`Backend/api/index.js`)
- Environment-based DB URL switching
- Supabase direct URL + pooler URL fallback support
- CORS origin configuration for frontend/backend separation

---

## Features by Role

### Admin

- View and manage houses, owners, tenants
- Monitor complaints and maintenance items
- Use centralized operational dashboard

### House Owner

- Manage property details
- Track tenant status and updates
- Handle owner-side listing and activity workflows

### Tenant

- Access tenant dashboard
- Track maintenance/payment details
- Submit and monitor complaints

### Buyer/Renter

- Browse rent/sale opportunities
- Submit offers and inquiries
- Use Google OAuth + personal account access patterns

---

## Project Architecture

```text
SocSys/
|- Backend/
|  |- api/
|  |  |- index.js
|  |- config/
|  |  |- db.js
|  |- server.js
|  |- package.json
|  |- vercel.json
|  |- supabase_rls.sql
|  |- totalproject.sql
|
|- Frontend/
|  |- app/
|  |- src/
|  |  |- App.jsx
|  |  |- lib/supabaseClient.js
|  |  |- views/
|  |  |  |- login.jsx
|  |  |  |- dashboard/
|  |  |  |- site/
|  |  |- components/
|  |  |- styles/
|  |- package.json
|
|- README.md
```

---

## Tech Stack

### Frontend

- React (SPA routing and UI)
- React Router
- Framer Motion
- Supabase JS client
- CSS-based custom styling

### Backend

- Node.js
- Express
- pg (PostgreSQL client)
- dotenv
- cors

### Database and Auth

- Supabase PostgreSQL
- Supabase Auth (Google OAuth)

### Deployment

- Vercel (frontend and backend hosting)

---

## Local Development Setup

## 1) Clone Repository

```bash
git clone <your-repo-url>
cd SocSys
```

## 2) Backend Setup

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```dotenv
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
POSTGRES_SSL=true
SUPABASE_DB_URL=postgresql://<user>:<password>@db.<project>.supabase.co:5432/postgres
SUPABASE_POOLER_URL=postgresql://<user>:<password>@<region>.pooler.supabase.com:6543/postgres
ADMIN_EMAILS=<admin1>,<admin2>
ADMIN_PASSWORD=<admin-password>
ADMIN_PROVISION_SECRET=<admin-secret>
```

Run backend:

```bash
npm run dev
```

## 3) Frontend Setup

```bash
cd ../Frontend
npm install
```

Create `Frontend/.env`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Run frontend:

```bash
npm run dev
```

---

## Environment Configuration Notes

### Important DB Priority Order (Backend)

The backend currently resolves database URL in this order:

1. `SUPABASE_POOLER_URL`
2. `SUPABASE_DB_URL`
3. `POSTGRES_URL`
4. `DATABASE_URL`

This is intentional for serverless stability. On Vercel, prefer `SUPABASE_POOLER_URL`.

### Supabase Auth URL Configuration

Set in Supabase Dashboard:

- Site URL:
  - `https://soc-sys.vercel.app`
- Redirect URLs:
  - `https://soc-sys.vercel.app`
  - `https://soc-sys.vercel.app/dashboard/user`
  - `http://localhost:3000`

### Google Console OAuth

In Google Cloud OAuth client:

- Authorized JavaScript origins:
  - `https://soc-sys.vercel.app`
  - `http://localhost:3000`
- Authorized redirect URI:
  - `https://<project-ref>.supabase.co/auth/v1/callback`

---

## API Overview (Representative)

- `GET /api/health`
  - service health information
- `GET /api/dashboard-summary`
  - quick metrics + DB status message
- `POST /api/auth/authorize-user`
  - validates role authorization
- `POST /api/auth/personal-login`
  - personal account login
- `POST /api/auth/personal-account/register-self`
  - buyer self-registration
- `POST /api/auth/forgot-password/request`
  - request reset OTP
- `POST /api/auth/forgot-password/verify`
  - verify OTP and reset password
- `GET /api/debug/db-status`
  - runtime DB/env diagnostics

---

## Authentication Flow Summary

### Buyer/Renter Google OAuth

1. User starts Google sign-in from login page
2. Supabase handles provider auth
3. User returns to app root
4. App reads Supabase session
5. Backend validates role access
6. User is stored in local session object
7. User is routed to `/dashboard/user`

### Personal Account Login

1. User enters email/password
2. Frontend calls backend personal login endpoint
3. Backend verifies credentials and role
4. Frontend stores user session and routes by role

---

## Quality and Reliability Practices

- Protected routes for role-gated dashboards
- Centralized DB state checks before critical queries
- Connection diagnostics endpoint for deployment debugging
- Clear operational errors returned for frontend handling
- Pool-based DB connections to reduce overhead

---

## Known Limitations

- No fine-grained permission matrix beyond role-level checks
- No real-time notifications/websocket event bus yet
- Limited audit logging for admin actions
- Session storage is browser-local (no advanced device/session management)
- Dashboard analytics can be expanded for deeper insights

---

## Roadmap / Next Improvements

- Add refresh-token aware secure session model with stronger guards
- Add granular permissions (`admin.read`, `admin.write`, etc.)
- Add notification center and activity feed
- Add report exports (CSV/PDF)
- Add stronger observability (structured logs + tracing)
- Add automated tests:
  - frontend route/auth tests
  - backend integration tests
  - DB migration tests
- Add CI pipeline and deployment checks

---

## Troubleshooting Guide

### Issue: `PostgreSQL is not connected`

Checks:

- Verify backend env vars are configured in hosting platform
- Confirm pooler URL is set for serverless runtime
- Open `/api/debug/db-status` and inspect `dbState.error`
- Ensure `POSTGRES_SSL=true`

### Issue: OAuth login does not reach dashboard

Checks:

- Supabase Site URL and Redirect URLs configured correctly
- Google OAuth callback URI points to Supabase callback
- Frontend redirect returns to app origin first, then app routes to dashboard
- Clear stale browser storage/session and retry

---

## Authors

Built by:

- Megh
- Parixit

---

## Final Note

SocSys is a strong foundation for a production-grade society management product:

- real role-based access
- practical operational modules
- deployable full-stack architecture
- cloud-ready database/auth integration

The next level is about hardening:

- security depth
- testing maturity
- observability
- maintainability at scale

Treat this version as a launch-ready base and keep iterating with production engineering standards.
