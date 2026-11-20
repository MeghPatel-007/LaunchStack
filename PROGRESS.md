# LaunchStack Progress

This document describes the repository as it exists, using current source, the database schema, tests, and Git history. Roadmap language is not treated as implementation evidence. Status labels mean:

- **Complete** — implemented and verified by source or a passing check.
- **In progress** — implemented partially or verified only in some environments.
- **Pending** — not implemented.
- **Blocked** — cannot meet the exit criterion until a named issue is resolved.

## EW01 — Node.js Foundation

### Complete

- Backend package initialized as an ESM project.
- `package.json` defines development/start/seed/test scripts and the current dependencies.
- Root `.env` loading is based on `import.meta.url`, `fileURLToPath()`, and module-relative paths.
- `PORT` and database configuration are validated at startup; `PORT` defaults to `8000`.
- Startup awaits log-directory initialization before calling `app.listen()`.
- The logging utility uses promise-based filesystem operations and a path independent of `process.cwd()`.
- The Express application and server startup are separated.

### Partial

- Deployment-specific operational configuration is minimal; the backend Dockerfile exists but no full runbook is documented.

### Pending

- A PostgreSQL migration/versioning workflow.

## EW02 — Express.js & REST API

### Complete

- Express application setup and server startup separation.
- Request logging middleware and `express.json()` parsing.
- Static and parameterized routes.
- Route ordering for `/projects/stats` before `/projects/:id`.
- Controllers extracted from the original route/application implementation.
- Project CRUD, project filtering, project statistics, member operations, and phase routes are registered.
- Validation middleware handles route IDs, required strings, optional strings, positive integers, and emails.
- Central error middleware handles malformed JSON and selected PostgreSQL constraint codes.
- Origin validation middleware rejects unsafe methods without an allowed Origin.
- A `/health` endpoint returns a basic service status.

### Partial

- Error response shapes and some user-facing messages remain inconsistent.

### Pending

- Final production API documentation and operational checks.

## EW03 — Authentication & PostgreSQL

### Authentication: Complete

- Registration validates required fields and email format.
- Passwords are hashed with bcrypt before insertion.
- Login verifies the stored password hash.
- Login signs a JWT containing `user_id` with a 24-hour expiry.
- The JWT is delivered in the `token` HTTP-only cookie. In production the cookie uses `SameSite=None` and `Secure`; locally it uses `SameSite=Lax`.
- Authenticated routes read the `token` session cookie.
- Authentication middleware verifies the token, validates the user ID claim, and confirms the user exists.
- Login and registration rate limiting is implemented.

### Authentication: Partial

- Deployment secret management is not documented beyond environment configuration.
- JWT secret configuration is required, but rotation and revocation are not implemented.
- Rate-limit counters are in-memory and not shared across instances.

### Authentication: Pending

- Token revocation and refresh tokens are not implemented.
- A same-origin Backend-for-Frontend layer for cross-domain production sessions is not implemented.

### Authorization: Complete

- Project roles are `OWNER` and `MEMBER`.
- Owner-only project operations are protected by authorization middleware.
- Member-readable project operations are protected by membership checks.
- Phase authorization resolves a phase to its project before checking project membership or ownership.
- Shared database helpers provide `getProjectRole()` and `getProjectIdFromPhase()`.
- Project and membership relationships are enforced by PostgreSQL foreign keys and uniqueness constraints.

### Authorization: Partial

- Response formats are not fully standardized.
- Automated permission coverage exists, but authorization paths are still checked mainly through route-level tests.

### Authorization: Pending

- No additional authorization features are confirmed by the current repository.

### PostgreSQL: Complete

- PostgreSQL schema exists for users, projects, project memberships, and phases.
- `pg.Pool` is configured from environment variables.
- `getDatabaseConfig()` accepts either `DATABASE_URL` or individual `DB_*` settings, with `DATABASE_URL` taking precedence.
- Production configuration enables TLS with certificate verification for individual settings.
- Project CRUD and project statistics use parameterized SQL.
- Phase CRUD uses PostgreSQL-backed state and timestamp data.
- Transactions are used for project creation and ownership membership insertion.
- Constraints enforce primary keys, foreign keys, unique email, unique project membership, valid roles, valid phase statuses, valid positions, and phase timestamp/state relationships.

### PostgreSQL: Partial

- No broad production indexing strategy or query-plan report is documented as complete.
- Database error translation covers selected codes, not a full operational error policy.

### PostgreSQL: Pending

- Deployment migrations/versioning are not present as a migration system.

## EW04 — Backend Completion

### Complete

- Shared request validation middleware was added and applied to current routes.
- Numeric route IDs are validated before authorization/controller work.
- Missing body checks return `400` for the relevant validation middleware.
- Phase state validation is shared through `phaseValidation.js`.
- Duplicate phase positions and duplicate registration emails use `409` in their known application checks.
- Controller error forwarding uses Express `next` correctly.
- Duplicate middleware continuation was removed.
- Database port range validation was corrected.
- Malformed JSON is mapped to `400` by the central error handler.
- Selected PostgreSQL uniqueness/check errors are mapped centrally.
- Obsolete prototype code and stale route/test comments were removed during cleanup.
- An automated backend suite was added (`node:test` plus Supertest) and runs against `launchstack_test`.

### Partial

- Error response payloads are not fully uniform.
- Some internal cleanup and dependency review remain.

## EW05 — Next.js Foundations + UI Foundation + Deployed Skeleton

### Decisions

- Authentication token strategy: the Express API signs a JWT and stores it in the HTTP-only `token` cookie. The Next.js proxy reads that cookie and validates it through `/auth/me`.
- Hosting plan for frontend, API, and PostgreSQL: Vercel frontend, Render backend, Neon PostgreSQL.

### Learning

- Next.js fundamentals and App Router.
- Layouts, pages, reusable components.
- TypeScript.
- Server/client components.
- Environment variables.
- Component design and forms.
- UI states: loading, empty, and error.

### Build

- Next.js application and frontend structure.
- Global layout and navigation.
- Responsive UI shell.
- GitHub Actions CI for linting, type-checking, and tests.
- Deployed skeleton with frontend, API, and database connectivity.

### Exit criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| Local application and routes work | Complete | The frontend runs at `http://localhost:3000`; Playwright covers the landing, auth, dashboard, project, and phase flows. |
| Reusable components exist | Complete | `frontend/src/components/ui/`, `frontend/src/components/launchstack/`, and shared layout components. |
| CI is green on main | Partial | `.github/workflows/ci.yml` runs backend tests and frontend lint, type-check, and build. Current GitHub run status must be confirmed on GitHub; it is not stored in the repository. |
| Deployed frontend can communicate with the production API | Blocked | The cross-domain cookie issue prevents the Vercel proxy from reading the Render-domain cookie. API calls that send credentials directly can still succeed, but authenticated dashboard access does not. |
| Authentication token strategy is chosen and documented | Complete | HTTP-only JWT cookie, documented in this file and `README.md`. |

## EW06 — Frontend Authentication + Dashboard Shell

### Learning

- Frontend authentication flow and auth state.
- Protected routes and authenticated API requests.
- Logout and unauthorized states.
- Credential and token safety.

### Build

- Login, registration, and logout flows.
- Protected dashboard shell.
- Authenticated API communication.
- Forms with validation and feedback.
- Backend hardening: CORS configuration, Helmet, and auth-route rate limiting.

### Exit criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| Authenticated users can access permitted views | Partial | Works locally and in Playwright; blocked in production by the cross-domain cookie issue. |
| Unauthorized access is handled deliberately | Complete | `src/proxy.ts` redirects to sign-in, allows only the signed-in user's dashboard id, and fails closed with `503` when the API is unavailable. `SessionExpiryHandler` redirects on a `401` broadcast from `apiClient`. |
| Credentials are handled safely | Complete | bcrypt hashes, HTTP-only cookie, `Secure` in production, JWT in the cookie rather than browser storage. |
| Authentication works in production | Blocked | Express sets the cookie on the Render domain; the Vercel proxy cannot read it. The proposed same-origin BFF is pending. |
| At least one API test and one E2E test cover login | Complete | Backend auth tests and Playwright auth specs cover login. |

### Additional frontend hardening

- `src/proxy.ts` validates the session with `/auth/me`, caches the user id for 30 seconds per server instance, and clears the `token` cookie on redirect.
- `apiClient` broadcasts `auth:unauthorized` for `401` responses on protected routes.

## Current Backend State

The active backend flow is:

`server startup -> app middleware -> Origin validation -> authentication -> route validation -> authorization -> controller -> PostgreSQL -> response`

Middlewares run in this order: Helmet, `/health`, request logging, CORS, Origin validation, JSON parsing, cookie parsing, then routes. `/auth` routes are public; `/projects` and phase routes pass through authentication.

The active source is under `backend/src/`. The database definition is under `database/schema.sql`. Development data is generated by `backend/scripts/seed.js`. Tests are under `backend/tests/`.

## Current Frontend State

- Next.js App Router with TypeScript under `frontend/src/app/`.
- Shared UI under `frontend/src/components/`.
- API client under `frontend/src/lib/api/` and services under `frontend/src/lib/services/`.
- Auth pages: sign-in, sign-up, forgot-password, and error pages.
- Dashboard shell with project list, project overview, members, phases, tasks, calendar, chat, mail, FAQs, pricing, and settings views.
- Some dashboard views use static sample data and are not wired to the Express API.
- Playwright config starts a test backend and the Next.js dev server against `launchstack_test`.

## Completed Features

- Node.js ESM startup and configuration
- CWD-independent `.env` and log paths
- Express app/server separation
- Request logging
- JSON parsing
- User registration/login
- Session logout
- JWT authentication through an HTTP-only cookie
- Helmet security headers, CORS origin allowlist, and Origin validation
- Login and registration rate limiting
- Project CRUD
- Project filtering by `type`
- Project statistics
- Project membership management
- Project phase CRUD
- Phase status, position, and timestamp validation
- OWNER/MEMBER authorization
- PostgreSQL integrity constraints
- `DATABASE_URL` support
- Next.js frontend foundation, auth pages, and dashboard shell
- API client and service layer for auth, projects, members, and phases
- Backend automated tests and Playwright E2E tests
- GitHub Actions CI for backend tests and frontend lint, type-check, and build

## Features In Progress

- Production authentication through a same-origin BFF
- Consistent response/error presentation
- Deployment runbook and production configuration review
- Wiring remaining dashboard views to real API data
- Confirming current CI status on GitHub

## Pending Features

- Same-origin BFF in Next.js
- Production-ready cross-domain session handling
- PostgreSQL migration/versioning workflow
- Playwright in CI
- Token revocation or refresh tokens

## Blocked

- Authenticated production dashboard access, until the BFF or another same-origin session strategy is implemented.

## Known Technical Debt

- The Express API and Next.js frontend are separate origins, so the browser cookie set by Render is not visible to the Vercel proxy. This is the current production authentication blocker.
- Error payloads mix strings and objects.
- Some controller and middleware response messages use inconsistent wording.
- The seed script is intentionally destructive for development and must not be used against production data.
- Database constraint handling is selective rather than a complete error taxonomy.
- Rate-limit counters are in-memory per process, so they reset on restart and are not shared across instances.
- The proxy's `/auth/me` cache is per server instance; a revoked token can pass for up to 30 seconds.
- Some dashboard pages use static sample data.
- Playwright runs Chromium only and is not wired into CI.

## Recent Refactors

- `f8e91bd`: extracted project controllers from the application/routes implementation.
- `fc40d6f`: centralized project authorization queries through `projectMembership.js` and added phase authorization middleware.
- `72bebdb`: added shared validation middleware, phase validation utility, seed script, and cleanup-related changes.
- `8a1e87b`, `e55adc8`, `1365acc`, `1bfb13a`: added Helmet/CORS origin allowlist, logout with shared cookie options, the frontend `apiClient` layer, and matching documentation.
- Rate limiting for login and registration lives in `backend/src/middleware/limiter.js` and is mounted on the auth routes.
- `10973ab`: aligned `eslint-config-next` with Next.js 16.4.6 and fixed the test database seed filename.
- `0d036ed`: added `DATABASE_URL` support to `getDatabaseConfig()`.
- `e3acd9c`: added `validateOrigin` for state-changing requests.
- `ae2d081`: defaulted `PORT` to `8000`, made the session cookie persistent, and bound the server to `0.0.0.0`.
- `f397091`: added the backend Dockerfile.

## Testing Status

Backend:

- Command: `bun test` or `npm test` from `backend/`.
- Result: 121 passing, 0 failing.
- Database: `launchstack_test` only; helpers assert `NODE_ENV=test` and a `_test` database name.

Frontend:

- Command: `bun run test:e2e` from `frontend/`.
- Recorded result: 17 passing, 0 failing with Chromium.
- The suite starts a fresh backend and Next.js dev server and cleans up its test rows.

CI:

- `.github/workflows/ci.yml` runs backend tests with a PostgreSQL service and frontend lint, TypeScript check, and build.
- Playwright is not in CI.

See [TEST_REPORT.md](TEST_REPORT.md) for the detailed report.

## Documentation Status

- `README.md`: public setup, API, security, testing, deployment, and known-issue documentation.
- `PROGRESS.md`: milestone status, exit criteria, and current state.
- `ARCHITECTURE.md`: architecture decision record, including the pending BFF.
- `TEST_REPORT.md`: test evidence and known gaps.
- `MENTAL_MODEL.md`: connected conceptual model.
- `LEARN.md`: concise personal learning notes.
- `LEARNDETAIL.md`: detailed technical reference reconstructed from source and history.
- `frontend/README.md`: frontend-specific setup, routes, auth flow, and limitations.

## Deployment Status

Deployed architecture:

- Frontend on Vercel.
- Backend on Render.
- PostgreSQL on Neon.

No production URLs are recorded in this repository.

Production authentication is not complete. The API cookie is scoped to the Render domain, and the Vercel-hosted Next.js proxy cannot read it. The BFF is pending and not implemented. Do not describe the production authentication flow as ready.

## Git / Development State

The history shows incremental implementation and checkpoints rather than a single rewrite:

`initial project -> Node/config/filesystem -> Express routes/middleware -> controllers -> PostgreSQL -> statistics -> phases -> membership/auth -> authorization refactor -> cleanup -> security middleware -> frontend API integration -> tests -> Next.js security upgrade -> Origin validation -> deployment scaffolding`

The recorded history ends at the current `main` head.

## Next Engineering Milestone

Implement the same-origin BFF so the browser session cookie is visible to the Next.js frontend, then verify authenticated dashboard access against the production Express API and document the deployment runbook.
