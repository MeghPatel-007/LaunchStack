# LaunchStack Test Report

Generated: Thu Nov 19 2026
Branch: `main` (working tree)
Backend port: 8000 | Frontend port: 3000 | Test DB: `launchstack_test`

## Suites and results

### Backend — `npm test` (Node 18+, `node:test` + `supertest`)
Run twice; 114 pass, 0 fail, exit 0.

| File | Tests |
|------|-------|
| `tests/auth.test.js` | 35 |
| `tests/projects.test.js` | 25 (+2 regression: null optional fields on create/update) |
| `tests/projectPhases.test.js` | 22 (+2 regression: null description on create/update) |
| `tests/middleware.test.js` | 15 |
| `tests/errorHandler.test.js` | 6 |
| `tests/config.test.js` | 4 |
| `tests/utils.test.js` | 3 |
| **Total** | **114** |

`bun test` also verified: 114 pass, exit 0 (Bun-safe `closePool` guard).

### Frontend E2E — Playwright / Chromium
`bun run test:e2e`, two consecutive full runs: 17 pass, 0 fail each (68/68 total across four post-fix runs).

| Spec | Tests |
|------|-------|
| `e2e/auth.setup.ts` (setup project) | 1 |
| `e2e/auth.spec.ts` | 6 |
| `e2e/dashboard-auth.spec.ts` (preserved) | 3 |
| `e2e/dashboard.spec.ts` | 1 |
| `e2e/projects.spec.ts` | 4 |
| `e2e/project-phases.spec.ts` | 2 |
| **Total** | **17** |

One E2E failure (logout click blocked by Next dev overlay) was fixed by opening the user menu with the keyboard (`press('Enter')`) instead of pointer click; not re-introduced.

## Endpoint inventory

Auth (`tests/auth.test.js`):
- `POST /auth/register` — success, duplicate email, required-field validation, email format, case normalization, rate limit (429), malformed JSON, DB error → 500
- `POST /auth/login` — success, wrong password, unknown email, validation, HttpOnly cookie attributes, rate limit (429)
- `POST /auth/logout` — cookie clear, no-cache, Origin allow/reject
- `GET /auth/me` — valid cookie; rejects missing, malformed, expired, bad-payload, deleted-user tokens

Projects (`tests/projects.test.js`):
- `POST /projects`, `GET /projects`, `GET /projects/stats`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`
- `POST /projects/:id/members`, `GET /projects/:id/members`, `DELETE /projects/:id/members/:userId`

Phases (`tests/projectPhases.test.js`):
- `POST /projects/:projectId/phases`, `GET /projects/:projectId/phases`
- `GET /phases/:id`, `PUT /phases/:id`, `DELETE /phases/:id`

Cross-cutting (`middleware`, `errorHandler`, `config`, `utils`): Helmet headers, CORS preflight/deny, cookie hardening, bearer-token rejection (cookie-only auth), token shape/signature/expiry, auth-before-validation, rate-limit 429 headers, ID validation, unique/check constraint mapping (409/400), generic 500 (no leak), port/DB config, phase status/timestamp rules.

## Security coverage

- Cookie: HttpOnly, SameSite, Secure; logout clears and no-cache.
- Token rejection: missing, wrong signature, expired, bad payload, deleted user.
- Authorization: owner-only write/delete/member management; member reads; phase ownership; non-member 403/404.
- Rate limiting: login and registration 429 with headers, per-IP loopback reset between suites.
- Validation: required/optional strings, whitespace, non-string, email format, positive-integer IDs, malformed JSON → 400 before auth on protected routes.
- CORS: configured origin allowed; unlisted denied; preflight; logout Origin check.
- Response safety: generic 500, no `password_hash` leakage, unique → 409, check → 400.
- Passwords hashed with bcrypt; hash never returned in responses.

## Database safety

- All runs used `.env.test` only: `NODE_ENV=test`, `DB_NAME=launchstack_test`.
- Helpers assert both values before any query; `e2e-data.mjs` refuses non-test DBs.
- No truncate/drop; tests delete only rows they create; FKs respected (projects deleted before users).
- Post-run audit: `e2e_users=0 e2e_projects=0`.
- Playwright webServer starts a fresh backend process (`reuseExistingServer: false`) pointed at the test DB.
- Ports 3000/8000 free after runs.

## Production bug fixed

Modals (`phase-modal.tsx`, `project-modal.tsx`) send `description: ... || null`. `validateOptionalStrings` rejected `null`, returning 400 `description must be a string if provided`.

**Fix** (one line, `backend/src/middleware/validation.js`):
```js
typeof req.body[field] !== 'undefined' &&
req.body[field] !== null &&   // added
typeof req.body[field] !== 'string'
```
Four regression tests added (create/update project + create/update phase with `description: null`); all failed red before the fix, pass after.

## Next.js security upgrade (NOT merged)

- Worktree branch `next-16.4.6` (commit `aae0772`), merge-base = current `main` HEAD (`7a49efb`).
- Diff vs main: `frontend/package.json` `next` 16.4.3 → 16.4.6; `frontend/bun.lock` `@next/*` packages → 16.4.6; `frontend/next.config.ts` adds `experimental.agentUpgrade: "security"`.
- Build validated in worktree: `bun run build` exit 0.
- Advisories addressed (Next.js November 2026 security release, fixed in 16.4.5; shipped in 16.4.6):
  - `GHSA-mfr8-8qww-v76h` (High) cross-tenant cache disclosure
  - `GHSA-vc7v-qv4w-wrv8` (Medium) nested `use cache` disclosure
  - `GHSA-rhh4-g77r-r9qj` (Medium) binary `use cache` argument collision
  - `GHSA-pc58-hwjq-p385` (Medium) stale compressed response framing
  - `GHSA-f3mh-rxg3-f5g2` (Medium) cookie exposure via `x-middleware-set-cookie`
  - `GHSA-7qx7-33qx-rqx2` (Medium) SVG rejection bypass in Image Optimization
- NOT merged into `main`; not pushed. Approval required before merge.

## Gaps

- E2E runs Chromium only.
- Playwright not wired into CI.
- No concurrency/load test for rate limits or DB pool.
- No migration/versioning system for PostgreSQL.

## Commands

```powershell
cd backend
npm test            # 114 pass, 0 fail
bun test            # 114 pass, exit 0

cd ..\frontend
bun run test:e2e    # 17 pass, 0 fail
```

## Files created / modified

Created: `backend/tests/{helpers,auth,projects,projectPhases,middleware,config,errorHandler,utils}.test.js`, `backend/tests/e2e-data.mjs`, `frontend/e2e/{auth.setup,auth.spec,dashboard.spec,dashboard-auth,global-teardown,helpers,projects,project-phases}.ts` (dashboard-auth preserved), `TEST_REPORT.md`.

Modified: `backend/package.json` (`test` script + `supertest`), `backend/bun.lock`, `backend/src/middleware/validation.js` (null fix), `backend/src/app.js`, `backend/src/config.js`, `backend/src/Utils/ensureLogsDir.js`, `frontend/playwright.config.ts`, `frontend/.gitignore` (`/e2e/.auth/`), plus pre-existing unrelated user changes (`backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js`, `database/schema.sql`, `frontend/src/app/layout.tsx`, `frontend/src/app/auth/SessionExpiryHandler.tsx`, `frontend/src/lib/api/apiClient.ts`, root `.gitignore`).
