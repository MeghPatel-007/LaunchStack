# LaunchStack Progress

## Current Phase
EW02 — Express.js & REST API

## Overall Status
- Current phase: EW02
- Current milestone: Request & Response — **Complete**
- Next milestone: Controllers
- Last checked: 2026-08-25
- Current blocker: No blocking implementation issue. EW01 automated tests/documentation/final audit remain outstanding, while EW02 Controllers, Error Handling, and REST API Design are still pending.

## Roadmap Progress

### EW01 — Node.js Foundation & LaunchStack Setup

| Area | Status | Evidence |
|---|---|---|
| Node.js Runtime | Verified | ESM backend modules execute successfully. |
| npm | Verified | Backend manifest, lockfile, installed dependencies, and scripts exist. |
| package.json | Verified | `backend/package.json` defines ESM, scripts, and dependencies. |
| Environment Variables | Verified | Root `.env` is loaded through a CWD-independent module-relative path and `PORT` is consumed. |
| File System (fs) | Verified | Promise-based `fs.access`/`fs.mkdir`, `ENOENT` handling, startup awaiting, and missing/existing directory behavior verified. |
| Path Module | Verified | Logs and `.env` paths are now independent of the process working directory. |
| Project Structure | Partial | Backend/frontend separation is established; README and frontend implementation remain incomplete. |
| Git Workflow | Verified | Changes were reviewed, staged selectively, and implementation changes committed. |

### EW02 — Express.js & REST API

| Area | Status | Evidence |
|---|---|---|
| Express setup | Verified | Express application/server separation exists and the application is running successfully. |
| Routing | Verified | Static routes, parameterized routes, `req.params`, route ordering, resource lookup, and 404 handling implemented. |
| Middleware | Verified | Request logging middleware and `express.json()` middleware implemented and tested. |
| Request/Response | Verified | `req.query`, `req.body`, `res.json()`, `res.status()`, 400 responses, and 404 responses implemented. |
| Controllers | Not started | No controllers extracted yet. |
| Error handling | Not started | No centralized application error-handling flow yet. |
| REST API design | Not started | API design will be refined after controllers and error handling. |

## Implementation Status

- [x] Node project initialized as an ESM backend
- [x] Backend package manifest and lockfile configured
- [x] dotenv loads the root `.env` file
- [x] `PORT` validation rejects empty, decimal, non-numeric, and out-of-range `PORT` values
- [x] Express root route implemented
- [x] Logs-directory utility uses Promise-based filesystem APIs
- [x] Await logs-directory setup before server startup
- [x] Verify logs-directory behavior when missing and already present
- [x] Verify startup fails when required logs initialization fails
- [x] Remove working-directory dependence from configuration and logs paths
- [x] Express application/server architecture implemented
- [x] Static project routes implemented
- [x] Parameterized `/projects/:id` route implemented
- [x] Route order issue between `/projects/stats` and `/projects/:id` identified and fixed
- [x] Missing project IDs return HTTP 404
- [x] Request logging middleware implemented
- [x] Middleware uses `next()` to continue the request pipeline
- [x] Request logs written to daily log files
- [x] `express.json()` middleware implemented
- [x] Query parameters accessed through `req.query`
- [x] Project filtering implemented using `?type=`
- [x] Request body accessed through `req.body`
- [x] Empty POST body detection implemented
- [x] Empty POST body returns HTTP 400
- [x] JSON responses implemented with `res.json()`
- [ ] Controllers
- [ ] Centralized error-handling middleware
- [ ] REST API design refinement
- [ ] Automated tests and a working `npm test` command
- [ ] README/setup documentation
- [ ] Final EW01 requirement audit

## Startup Initialization

Startup now follows this order:

`textvalidatePortNumber()
        ↓
await ensureLogsDir()
        ↓
Express setup
        ↓
app.listen()`

This ensures the server cannot begin listening before required logs-directory initialization succeeds.

If `ensureLogsDir()` rejects, startup stops and `app.listen()` is never reached.

## Filesystem Verification

### Missing logs directory

Verified behavior:

`textLogs dir does not exist
Making one ...
Logs dir is made
Server is running...`

Result: `backend/logs/` is created before the server starts.

### Existing logs directory

Verified behavior:

`textLogs dir exists
Server is running...`

Result: Existing directory is handled successfully without unnecessary failure.

### Initialization failure

Verified by deliberate failure testing:

`textENOENT ...
Node.js ...
[nodemon] app crashed`

No server startup message appeared after the initialization failure.

Result: Required initialization failure correctly prevents server startup.

## Path Handling

The previous paths were dependent on `process.cwd()`:

`textpath.resolve('./logs')
path.resolve('./../.env')`

These have been replaced with module-relative resolution based on:

`textimport.meta.url
        ↓
fileURLToPath()
        ↓
dirname()
        ↓
project-relative path`

### Logs path

`ensureLogsDir()` now resolves the intended `backend/logs` location from the module location and reuses the same resolved path for filesystem operations.

The request logging utility writes daily log files under:

`textbackend/logs/app-info-YYYY-MM-DD.log`

### Environment path

`config.js` resolves the root `.env` file relative to the module location rather than the process working directory.

### CWD verification

The application was tested from:

1. `LaunchStack/backend`
2. `LaunchStack`

The `process.cwd()` value changed between these runs, while `import.meta.url` remained tied to the actual module location.

The logs directory continued to resolve to `backend/logs`, and the application started successfully.

## Testing Status

Tests present? **No**

Automated tests passing? **No — `npm test` remains the default failing placeholder.**

Manual verification:

- Valid `PORT` accepted.
- Empty `PORT` rejected.
- Decimal `PORT` rejected.
- Non-numeric `PORT` rejected.
- Zero rejected.
- Out-of-range `PORT` rejected.
- Missing logs directory created successfully.
- Existing logs directory handled successfully.
- Required initialization failure prevents server startup.
- Startup works from the backend directory.
- Startup works from the project root.
- `.env` loading works independently of the current working directory.
- Logs path remains independent of the current working directory.
- `GET /projects` tested.
- `GET /projects/:id` tested.
- Existing project IDs return the correct project.
- Unknown project IDs return HTTP 404.
- `/projects/stats` tested.
- Route ordering between `/projects/stats` and `/projects/:id` verified.
- Request logging middleware tested.
- `GET /projects?type=software` tested.
- `GET /projects?type=hardware` tested.
- `POST /projects` request body parsing tested.
- Empty POST body returns HTTP 400.
- JSON request body is accessible through `req.body`.

## Documentation Status

- README status: Empty
- API documentation: None
- Setup instructions: None
- Architecture documentation: None
- Progress tracker: This document is updated at the end of the day.

## Code Quality

- Startup ordering: **Verified** — required logs initialization is awaited before `app.listen()`.
- Path handling: **Verified** — logs and `.env` paths no longer depend on the process working directory.
- Filesystem errors: **Verified** — `ENOENT` is handled for directory creation; unexpected filesystem and mkdir errors are rethrown and prevent startup.
- Initialization failure handling: **Verified** — server does not start when required initialization fails.
- Express architecture: **Verified** — application and server responsibilities are separated.
- Route ordering: **Verified** — specific `/projects/stats` route is registered before `/projects/:id`.
- Middleware ordering: **Verified** — logging middleware and `express.json()` execute before the relevant route handlers.
- Request logging: **Implemented** — request method and path are written to daily log files.
- Request body parsing: **Implemented** — `express.json()` populates `req.body`.
- HTTP status handling: **Implemented** — missing resources use 404 and invalid/empty POST requests use 400.
- Unused dependency: `cors` is installed but not used; defer until it is actually required.
- Abstraction level: Kept intentionally minimal; no unnecessary controllers/services/repositories/database layers introduced yet.
- Git hygiene: Implementation changes should continue to be reviewed and committed separately from progress documentation.

## Concepts Learned

### EW01

- Top-level `await` in ESM
- Asynchronous application startup
- Promise rejection and startup failure
- `process.cwd()`
- `import.meta.url`
- `fileURLToPath()`
- `path.dirname()`
- CWD-independent filesystem paths
- Reusing one resolved path for multiple filesystem operations
- Git diff review and `git diff --check`
- CRLF vs LF line endings and their effect on Git diffs

### EW02

- Express application architecture
- Express application vs HTTP server
- Route matching
- Static routes
- Parameterized routes
- Route parameters
- `req.params`
- Route order
- Static vs parameterized route conflicts
- Middleware
- `app.use()`
- `next()`
- Middleware execution order
- Asynchronous middleware
- Request logging middleware
- `express.json()`
- `req.method`
- `req.path`
- `req.query`
- Query parameters
- `req.body`
- JSON request bodies
- `res.send()`
- `res.json()`
- `res.status()`
- HTTP 400 Bad Request
- HTTP 404 Not Found
- Basic query-based filtering
- Empty request-body handling
- Request/response pipeline

## Current Assessment

### Actually Done

Node/ESM/npm setup, backend restructuring, dotenv configuration, `PORT` validation, Express application/server separation, Promise-based filesystem handling, awaited startup initialization, filesystem verification, initialization-failure verification, CWD-independent logs/configuration paths, Express routing, route parameters, route ordering, request logging middleware, JSON body parsing, query parameters, query filtering, basic POST request handling, and HTTP status handling.

### Partially Done

Project structure remains intentionally minimal because controllers, services, repositories, database layers, and other abstractions have not yet been justified.

EW02 is partially complete.

Completed:

- Express Architecture
- Routing
- Middleware
- Request/Response

Remaining:

- Controllers
- Error Handling
- REST API Design

### Missing

- Automated tests
- Working `npm test`
- README/setup documentation
- Final EW01 audit against all original requirements
- Controllers
- Centralized error handling
- Final REST API design refinement
- Database persistence

## Problems / Technical Debt

- No automated test suite exists yet.
- README is empty.
- EW01 completion percentage should be recalculated against the actual full checklist.
- POST `/projects` currently does not persist projects; it only demonstrates request-body handling.
- POST request validation is currently minimal.
- No centralized Express error-handling middleware exists.
- `cors` is installed but unused; leave it alone until middleware requirements justify it.
- Route handlers currently live directly inside `app.js`.
- Hardcoded project data is temporary and will eventually be replaced by PostgreSQL.

## Recommended Next Step

Do **not** jump into PostgreSQL, WebSockets, authentication, load testing, or broad Express tutorials.

The next milestone is:

**EW02 → Controllers**

Refactor the existing project route handlers into controller functions without introducing unnecessary services, repositories, or database abstractions.

Use:

**LEARN → IMPLEMENT → TEST → DEBUG → COMMIT → DOCUMENT**

The refactor should preserve the current API behavior while making `app.js` responsible primarily for application configuration, middleware, and route registration.
