# LaunchStack Test Report

Updated: Fri Nov 20 2026
Branch: `main`
Backend port: 8000 | Frontend port: 3000 | Test DB: `launchstack_test`

## Suites and results

### Backend — `bun test` / `npm test`

Current result: **121 pass, 0 fail, exit 0** from both commands.

Command sources:

- `bun test` runs the `node:test` files directly.
- `npm test` runs `node --env-file=../.env.test --test`.

| File | Tests |
|------|-------|
| `tests/auth.test.js` | 34 |
| `tests/projects.test.js` | 27 |
| `tests/projectPhases.test.js` | 24 |
| `tests/middleware.test.js` | 19 |
| `tests/config.test.js` | 8 |
| `tests/errorHandler.test.js` | 6 |
| `tests/utils.test.js` | 3 |
| **Total** | **121** |

The intentional `console.error` output during the run comes from malformed-input and simulated database-failure cases that the tests assert on.

### Frontend E2E — Playwright / Chromium

Command: `bun run test:e2e`

Last recorded result: **17 pass, 0 fail** across two consecutive full runs.

| Spec | Tests |
|------|-------|
| `e2e/auth.setup.ts` (setup project) | 1 |
| `e2e/auth.spec.ts` | 7 |
| `e2e/dashboard-auth.spec.ts` | 3 |
| `e2e/dashboard.spec.ts` | 1 |
| `e2e/projects.spec.ts` | 3 |
| `e2e/project-phases.spec.ts` | 2 |
| **Total** | **17** |

One earlier E2E failure (logout click blocked by the Next dev overlay) was fixed by opening the user menu with the keyboard (`press('Enter')`) instead of a pointer click.

## Endpoint inventory

Auth (`tests/auth.test.js`):

- `POST /auth/register` — success, duplicate email, required-field validation, email format, case normalization, rate limit (429), malformed JSON, DB error → 500
- `POST /auth/login` — success, wrong password, unknown email, validation, HttpOnly cookie attributes, `Max-Age`, rate limit (429)
- `POST /auth/logout` — cookie clear, no-cache, missing/disallowed Origin → 403, allowed Origin → 200
- `GET /auth/me` — valid cookie; rejects missing, malformed, expired, bad-payload, and deleted-user tokens

Projects (`tests/projects.test.js`):

- `POST /projects`, `GET /projects`, `GET /projects/stats`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`
- `POST /projects/:id/members`, `GET /projects/:id/members`, `DELETE /projects/:id/members/:userId`

Phases (`tests/projectPhases.test.js`):

- `POST /projects/:projectId/phases`, `GET /projects/:projectId/phases`
- `GET /phases/:id`, `PUT /phases/:id`, `DELETE /phases/:id`

Cross-cutting (`middleware`, `errorHandler`, `config`, `utils`): Helmet headers, CORS preflight/deny, cookie hardening, bearer-token rejection (cookie-only auth), token shape/signature/expiry, auth-before-validation, rate-limit 429 headers, ID validation, unique/check constraint mapping (409/400), generic 500 (no leak), port/DB config including `DATABASE_URL`, and phase status/timestamp rules.

## Origin validation coverage

`backend/src/middleware/validateOrigin.js` runs after CORS and before JSON parsing. It allows `GET`, `HEAD`, and `OPTIONS`; every other method requires an `Origin` in `ALLOWED_FRONTEND_ORIGINS`.

`backend/tests/middleware.test.js` covers the matrix:

| Request | Expected | Result |
|---------|----------|--------|
| `POST` with allowed Origin | Continues to route | Covered |
| `POST` with disallowed Origin | `403 Forbidden: Invalid origin` | Covered |
| `POST` without Origin | `403 Forbidden: Invalid origin` | Covered |
| `GET` without Origin | Continues to route | Covered |
| `OPTIONS` preflight | Handled by CORS | Covered |

Endpoint tests send `Origin: http://localhost:3000` on state-changing requests through the shared helpers and per-file constants.

## Security coverage

- Cookie: HttpOnly, SameSite, Secure in production, 24-hour `Max-Age`; logout clears and sets `Cache-Control: no-store`.
- Token rejection: missing, wrong signature, expired, bad payload, deleted user.
- Authorization: owner-only write/delete/member management; member reads; phase ownership; non-member 403/404.
- Rate limiting: login and registration 429 with headers, per-IP loopback reset between suites.
- Validation: required/optional strings, whitespace, non-string, email format, positive-integer IDs, malformed JSON → 400 before auth on protected routes.
- CORS: configured origin allowed; unlisted origin receives no CORS headers; preflight; Origin validation on unsafe methods.
- Response safety: generic 500, no `password_hash` leakage, unique → 409, check → 400.
- Passwords hashed with bcrypt; hash never returned in responses.

## Database safety

- All runs use `.env.test` only: `NODE_ENV=test`, `DB_NAME=launchstack_test`.
- Helpers assert both values before any query; `e2e-data.mjs` refuses non-test databases.
- No truncate/drop in tests; tests delete only rows they create; foreign keys are respected (projects deleted before users).
- Playwright starts a fresh backend process (`reuseExistingServer: false`) pointed at the test database.
- Ports 3000/8000 are released after runs.

## Next.js security upgrade

The Next.js 16.4.3 → 16.4.6 security upgrade is merged into `main`, including `eslint-config-next` at 16.4.6 and `experimental.agentUpgrade: "security"` in `frontend/next.config.ts`.

Previously recorded checks:

- `bun run build` exit 0 after the upgrade.
- E2E 17/17 after the upgrade.

Advisories addressed by the upgrade:

- `GHSA-mfr8-8qww-v76h` (High) cross-tenant cache disclosure
- `GHSA-vc7v-qv4w-wrv8` (Medium) nested `use cache` disclosure
- `GHSA-rhh4-g77r-r9qj` (Medium) binary `use cache` argument collision
- `GHSA-pc58-hwjq-p385` (Medium) stale compressed response framing
- `GHSA-f3mh-rxg3-f5g2` (Medium) cookie exposure via `x-middleware-set-cookie`
- `GHSA-7qx7-33qx-rqx2` (Medium) SVG rejection bypass in Image Optimization

## CI

`.github/workflows/ci.yml`:

- Backend job: PostgreSQL 16 service, `bun install --frozen-lockfile`, schema load from `database/launchstack_test.sql`, `bun test`.
- Frontend job: `bun install --frozen-lockfile`, `bun run lint`, `bun run tsc --noEmit`, `bun run build`.

Playwright is not wired into CI.

## Gaps

- E2E runs Chromium only.
- Playwright is not in CI.
- No concurrency/load test for rate limits or DB pool.
- No migration/versioning system for PostgreSQL.
- Authenticated production dashboard access is blocked by the cross-domain cookie issue; the BFF is pending.

## Commands

```powershell
cd backend
npm test            # 121 pass, 0 fail
bun test            # 121 pass, 0 fail

cd ..\frontend
bun run test:e2e    # 17 pass, 0 fail (last recorded run)
```
