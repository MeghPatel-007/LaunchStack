# LaunchStack Progress

## Current Phase

EW01 — Node.js Foundation & LaunchStack Setup

## Overall Status

- Current phase: EW01
- Completion percentage: ~80% (verified implementation only; final percentage to be reconciled with the full EW01 checklist)
- Last checked: 2026-08-24
- Current blocker: No blocking implementation issue in the completed startup/path work. Automated tests, README/setup documentation, and remaining EW01 requirements are still outstanding.

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
| Project Structure | Partial | Committed `backend/` separation is appropriate; `frontend/` and README remain empty. |
| Git Workflow | Verified | Changes were reviewed, staged selectively, and implementation changes committed. |

### EW02 — Express.js & REST API

| Area | Status | Evidence |
|---|---|---|
| Express setup | Partial | Express app and a `GET /` route exist. |
| Routing | Partial | Only the root route exists. |
| Middleware | Not started | No middleware is registered; `cors` is installed but unused. |
| Controllers | Not started | No controllers. |
| Error handling | Not started | No application error-handling flow. |
| REST API design | Not started | No resource API design exists yet. |

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
- [ ] Automated tests and a working `npm test` command
- [ ] README/setup documentation
- [ ] Final EW01 requirement audit

## Startup Initialization

Startup now follows this order:

```text
validatePortNumber()
        ↓
await ensureLogsDir()
        ↓
Express setup
        ↓
app.listen()
```

This ensures the server cannot begin listening before required logs-directory initialization succeeds.

If `ensureLogsDir()` rejects, startup stops and `app.listen()` is never reached.

## Filesystem Verification

### Missing logs directory

Verified behavior:

```text
Logs dir does not exists
Making one ...
Logs dir is made
Server is running...
```

Result: `backend/logs/` is created before the server starts.

### Existing logs directory

Verified behavior:

```text
Logs dir exists
Server is running...
```

Result: Existing directory is handled successfully without unnecessary failure.

### Initialization failure

Verified by deliberate failure testing:

```text
ENOENT ...
Node.js ...
[nodemon] app crashed
```

No server startup message appeared after the initialization failure.

Result: Required initialization failure correctly prevents server startup.

## Path Handling

The previous paths were dependent on `process.cwd()`:

```text
path.resolve('./logs')
path.resolve('./../.env')
```

These have been replaced with module-relative resolution based on:

```text
import.meta.url
        ↓
fileURLToPath()
        ↓
dirname()
        ↓
project-relative path
```

### Logs path

`ensureLogsDir()` now resolves the intended `backend/logs` location from the module location and reuses the same resolved path for both checking and creation.

### Environment path

`config.js` now resolves the root `.env` file relative to the module location rather than the process working directory.

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

## Documentation Status

- README status: Empty
- API documentation: None
- Setup instructions: None
- Architecture documentation: None
- Progress tracker: This document will be updated at the end of the day.

## Code Quality

- Startup ordering: **Verified** — required logs initialization is awaited before `app.listen()`.
- Path handling: **Verified** — logs and `.env` paths no longer depend on the process working directory.
- Filesystem errors: **Verified** — `ENOENT` is handled for directory creation; unexpected filesystem and mkdir errors are rethrown and prevent startup.
- Initialization failure handling: **Verified** — server does not start when required initialization fails.
- Unused dependency: `cors` is installed but not used; defer until middleware work begins.
- Abstraction level: Kept intentionally minimal; no unnecessary path utility or bootstrap abstraction introduced.
- Git hygiene: Implementation changes were reviewed and committed separately from the end-of-day progress update.

## Concepts Learned

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

## Current Assessment

### Actually Done

Node/ESM/npm setup, backend restructuring, dotenv configuration, `PORT` validation, Express starter route, Promise-based filesystem handling, awaited startup initialization, filesystem verification, initialization-failure verification, and CWD-independent logs/configuration paths.

### Partially Done

Project structure remains partially complete because the frontend and README are still empty. Express is only at the starter-route stage.

### Missing

- Automated tests
- Working `npm test`
- README/setup documentation
- Final EW01 audit against all original requirements
- Any remaining EW01 items identified during that audit

### Problems / Technical Debt

- `cors` is installed but unused; leave it alone until middleware work begins.
- No automated test suite exists yet.
- README is empty.
- EW01 completion percentage should be recalculated against the actual full checklist rather than the old 58% figure.

## Recommended Next Step

Do **not** jump into PostgreSQL, controllers, or broad Express tutorials.

First perform a **final EW01 audit** against the original tracker and identify the remaining EW01 requirements. Then tackle the smallest remaining requirement using:

**LEARN → IMPLEMENT → TEST → DEBUG → COMMIT → DOCUMENT**
