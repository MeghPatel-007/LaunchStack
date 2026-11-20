# LaunchStack

LaunchStack is a project-planning workspace for turning an idea into a visible delivery path:

`Idea -> Planning -> Development -> Completion`

It models projects, project members, project phases, phase state, and aggregate progress. The current MVP has an implemented Express REST API and a Next.js frontend. The frontend supports authentication and the dashboard/project workflows, but a cross-domain cookie issue still blocks authenticated dashboard access in production. See [Known production authentication issue](#known-production-authentication-issue).

## Current MVP

Implemented backend capabilities:

- User registration, login, logout, and current-user lookup
- bcrypt password hashing and JWT authentication through an HTTP-only cookie
- Helmet security headers, a CORS origin allowlist, and Origin validation on state-changing requests
- Rate limiting on login and registration
- Project creation, listing, filtering, reading, updating, and deletion
- Project membership and OWNER/MEMBER roles
- Project member listing, addition, and removal
- Project phase creation, listing, reading, updating, and deletion
- Phase status and timestamp rules
- Project statistics based on phase completion
- Request logging and JSON request parsing
- PostgreSQL constraints for relationships and phase integrity
- Automated backend tests with `node:test` and Supertest

Implemented frontend capabilities:

- Next.js App Router application with TypeScript
- Reusable UI components based on shadcn/ui and Tailwind CSS
- Sign-in and sign-up forms with client-side validation and toast feedback
- Logout flow
- API client and service layer for auth, projects, members, and phases
- Dashboard shell, project list, project overview, members, phases, and supporting views
- Dashboard route protection through `src/proxy.ts` (limited by the production cookie issue below)
- Loading, empty, validation, and error states for the implemented flows
- Playwright end-to-end tests

## Architecture

```text
Browser
  -> Next.js frontend (Vercel)
      -> Express REST API (Render)
          -> PostgreSQL (Neon)
```

- The Next.js App Router frontend renders the UI and calls the existing Express API.
- Express remains responsible for business logic, authentication validation, authorization, and database operations.
- PostgreSQL stores users, projects, memberships, and phases and enforces database constraints.
- Next.js does not replace the Express API. Next.js API routes are not part of the current backend.
- Dashboard route protection runs in `frontend/src/proxy.ts` and calls the Express `/auth/me` endpoint.

Backend flow:

`Routes -> Middleware -> Controllers -> PostgreSQL`

- Routes map HTTP methods and paths to middleware and controllers.
- Middleware handles request logging, JSON parsing, Origin validation, input validation, authentication, and authorization.
- Controllers coordinate request data, SQL queries, transactions, and responses.
- There are no service or repository layers in the backend implementation.

The longer-term direction is recorded in [ARCHITECTURE.md](ARCHITECTURE.md). Migrating backend responsibilities into Next.js is deferred; Express is the current backend.

## Technologies

Frontend:

- Next.js 16.4.6 with the App Router
- React 19 and TypeScript
- Tailwind CSS and shadcn/ui-style components
- Playwright for end-to-end tests

Backend:

- Node.js with ESM modules
- Express 5
- PostgreSQL
- `pg`
- `bcrypt`
- `jsonwebtoken`
- `helmet`
- `cors`
- `express-rate-limit`
- `dotenv`
- `nodemon` for development
- `node:test` and `supertest` for tests

## Project Structure

```text
LaunchStack/
├── .github/workflows/ci.yml
├── backend/
│   ├── scripts/seed.js
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── launchstack_test.sql
│   └── ...
├── frontend/
│   ├── e2e/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/api/
│   │   ├── lib/services/
│   │   ├── proxy.ts
│   │   └── types/
│   ├── next.config.ts
│   ├── playwright.config.ts
│   └── package.json
├── ARCHITECTURE.md
├── PROGRESS.md
└── README.md
```

## Setup

### Requirements

- Node.js
- Bun (used by CI, the frontend, and the backend test command)
- PostgreSQL
- A PostgreSQL database with permission to create the LaunchStack tables

### Install backend dependencies

```powershell
cd backend
npm install
```

### Configure backend environment variables

Create a root `.env` file. The backend loads it relative to `backend/src/config.js`, so startup does not depend on the current working directory.

Required values:

```env
PORT=8000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
DB_USER=database_username
DB_PASSWORD=database_password
JWT_SECRET=replace-with-a-secret-value
ALLOWED_FRONTEND_ORIGINS=http://localhost:3000
COOKIE_DOMAIN=
```

`PORT` defaults to `8000` when omitted.

Database configuration accepts either:

- `DATABASE_URL`, a PostgreSQL connection string such as a Neon URL; or
- the individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` values.

`DATABASE_URL` takes precedence when both are present. In production, the individual settings enable TLS with certificate verification. Use a Neon connection string with the TLS mode required by the provider when using `DATABASE_URL`.

Use a long, private JWT secret outside development.

`ALLOWED_FRONTEND_ORIGINS` is required. The backend refuses to start when it is missing or empty. It accepts a comma-separated list of origins. `COOKIE_DOMAIN` stays empty on localhost and is set to a shared parent domain only when the frontend and backend run on different subdomains.

### Create the PostgreSQL schema

Create or select a PostgreSQL database, then apply:

```powershell
psql -U database_username -d database_name -f database/schema.sql
```

The schema creates `users`, `projects`, `project_members`, and `project_phases` with primary keys, foreign keys, uniqueness rules, role checks, and phase-state checks.

### Seed development data

The seed script clears the application tables and inserts development users, one project, memberships, and phases. It must only be used with development data:

```powershell
cd backend
npm run seed
```

### Run the backend

Development mode:

```powershell
cd backend
npm run dev
```

Normal startup:

```powershell
cd backend
npm start
```

The server listens on port `8000` by default at `http://localhost:8000`.

### Configure and run the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then:

```powershell
cd frontend
bun install
bun run dev
```

The frontend runs at `http://localhost:3000`.

## API

Authenticated project and phase requests use the `token` session cookie set by `POST /auth/login`:

```http
Cookie: token=<jwt>
```

State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) must also send an allowed `Origin` header. `GET`, `HEAD`, and `OPTIONS` bypass this check.

### Authentication

| Method | Endpoint     | Purpose                             |
| ------ | ------------ | ----------------------------------- |
| `POST` | `/auth/register` | Register a user                 |
| `POST` | `/auth/login`    | Verify credentials and set the session cookie |
| `POST` | `/auth/logout`   | Clear the session cookie        |
| `GET`  | `/auth/me`       | Return the signed-in user's id  |

### Projects

All project endpoints require authentication.

| Method   | Endpoint                        | Purpose                                      |
| -------- | ------------------------------- | -------------------------------------------- |
| `POST`   | `/projects`                     | Create a project for the authenticated user  |
| `GET`    | `/projects`                     | List the authenticated user's projects       |
| `GET`    | `/projects?type=web%20app`      | Filter the user's projects by `project_type` |
| `GET`    | `/projects/stats`               | Return phase-based project statistics        |
| `GET`    | `/projects/:id`                 | Read a project as a member                   |
| `PUT`    | `/projects/:id`                 | Update a project as its owner                |
| `DELETE` | `/projects/:id`                 | Delete a project as its owner                |
| `POST`   | `/projects/:id/members`         | Add a user as a member as the owner          |
| `GET`    | `/projects/:id/members`         | List project members as a member             |
| `DELETE` | `/projects/:id/members/:userId` | Remove a member as the owner                 |

### Phases

All phase endpoints require authentication and project membership/ownership as appropriate.

| Method   | Endpoint                      | Purpose                             |
| -------- | ----------------------------- | ----------------------------------- |
| `POST`   | `/projects/:projectId/phases` | Create a phase as the project owner |
| `GET`    | `/projects/:projectId/phases` | List phases as a project member     |
| `GET`    | `/phases/:id`                 | Read a phase as a project member    |
| `PUT`    | `/phases/:id`                 | Update a phase as the project owner |
| `DELETE` | `/phases/:id`                 | Delete a phase as the project owner |

## Authentication and authorization

Registration stores a bcrypt hash rather than a plaintext password. Login compares the supplied password with the stored hash and signs a JWT containing the user ID, then sets it in the `token` cookie. Authenticated requests verify the JWT and confirm that the user still exists. Logout clears the `token` cookie and rejects requests without an allowed Origin.

Authentication answers who the caller is. Authorization checks whether that authenticated user is a project member or owner. Phase authorization first resolves the phase's project and then checks membership or ownership on that project.

## Security controls

- Helmet sets security headers on every response.
- CORS compares the request origin with `ALLOWED_FRONTEND_ORIGINS`. A request with no origin or a listed origin continues; an unlisted origin receives no CORS headers.
- `validateOrigin` rejects `POST`, `PUT`, `PATCH`, and `DELETE` requests that have no Origin or an Origin outside the allowlist with `403 Forbidden: Invalid origin`.
- `express-rate-limit` guards the credential endpoints:
  - `POST /auth/login` allows 10 requests per IP per 15 minutes.
  - `POST /auth/register` allows 5 requests per IP per hour.
- A rejected request returns `429` with `Too many requests, please try again later.` and draft-8 `RateLimit` headers.
- The rate-limit counters are in-memory and per process, so they reset on restart and are not shared across instances.

## Frontend integration

- `frontend/src/lib/api/apiClient.ts` calls the Express API, sends credentials, serializes JSON bodies, and converts non-2xx responses into errors carrying the server message.
- `frontend/src/lib/services/authService.ts` holds the login, signup, and logout handlers.
- `frontend/src/lib/services/projectService.ts` and `projectPhaseService.ts` wrap the project, member, and phase endpoints.
- `frontend/src/types/` holds the shared auth, project, member, and phase types.
- `frontend/src/proxy.ts` protects `/dashboard/:path*` by reading the `token` cookie and calling `/auth/me`.

## Testing and CI

Backend tests run against `launchstack_test` and never against the development database:

```powershell
cd backend
bun test
npm test
```

Current result: 121 passing, 0 failing from both commands. See [TEST_REPORT.md](TEST_REPORT.md).

Frontend end-to-end tests:

```powershell
cd frontend
bun run test:e2e
```

The recorded E2E result is 17 passing, 0 failing with Chromium. GitHub Actions runs backend tests plus frontend lint, TypeScript check, and build. Playwright is not wired into CI.

## Deployment

| Component | Platform |
| --------- | -------- |
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

The backend includes a `backend/Dockerfile` for container-based hosting.

Required environment variables by deployment target:

- Backend (Render): `NODE_ENV`, `PORT`, `DATABASE_URL` or the `DB_*` variables, `JWT_SECRET`, `ALLOWED_FRONTEND_ORIGINS`, and `COOKIE_DOMAIN` when a shared cookie domain is used.
- Frontend (Vercel): `NEXT_PUBLIC_API_URL`.
- Database (Neon): connection details supplied through `DATABASE_URL` or the `DB_*` variables.

No production URLs are recorded in this repository.

Current deployment limitations:

- The production authentication flow is blocked by the cross-domain cookie issue described below.
- Playwright is not part of CI.
- The backend has no PostgreSQL migration/versioning system.

## Known production authentication issue

The Express API sets the authentication cookie on the Render API domain. The Next.js proxy runs on the Vercel frontend domain. The browser does not send the Render-domain cookie to Vercel, so the proxy cannot read the authentication cookie and redirects authenticated users to the sign-in page.

The proposed solution is a same-origin Backend-for-Frontend (BFF) layer in Next.js that owns the browser-facing session cookie and forwards authenticated requests to the Express API.

Status: **pending, not implemented.** The architecture has not been changed, and the authentication flow is not production-ready.

## Frontend routes

- `/` — landing page
- `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` — authentication pages
- `/auth/errors/*` — forbidden, unauthorized, not-found, internal-server-error, and maintenance states
- `/dashboard/[id]` — dashboard shell
- `/dashboard/[id]/projects` — project list
- `/dashboard/[id]/projects/[projectId]` — project overview and project subpages
- `/dashboard/[id]/members`, `tasks`, `calendar`, `chat`, `mail`, `faqs`, `pricing`, `settings`, `users` — dashboard views

Some dashboard views use static sample data and are not connected to the Express API.

## Status

- EW01–EW04 backend work: complete.
- EW05 Next.js foundation and deployed skeleton: implemented; exit criteria are tracked in [PROGRESS.md](PROGRESS.md).
- EW06 frontend authentication and dashboard shell: implemented locally and covered by Playwright; production authentication remains blocked by the cross-domain cookie issue and the pending BFF.
- Automated backend and E2E suites exist and pass locally. CI runs backend tests and frontend static/build checks.

See [PROGRESS.md](PROGRESS.md) for milestone status and exit criteria, [ARCHITECTURE.md](ARCHITECTURE.md) for the architecture decision, [TEST_REPORT.md](TEST_REPORT.md) for test evidence, [MENTAL_MODEL.md](MENTAL_MODEL.md) for connected concepts, [LEARN.md](LEARN.md) for concise personal notes, and [LEARNDETAIL.md](LEARNDETAIL.md) for the detailed technical reference.
