# LaunchStack Progress

This document describes the repository as it exists, using current source, the database schema, and Git history. Roadmap language is not treated as implementation evidence.

## EW01 — Node.js Foundation

### Complete

- Backend package initialized as an ESM project.
- `package.json` defines development/start scripts and the current dependencies.
- Root `.env` loading is based on `import.meta.url`, `fileURLToPath()`, and module-relative paths.
- `PORT` and database configuration are validated at startup.
- Startup awaits log-directory initialization before calling `app.listen()`.
- The logging utility uses promise-based filesystem operations and a path independent of `process.cwd()`.
- The Express application and server startup were separated.

### Partial

- The foundation is implemented, but the repository has no automated test suite.
- The `npm test` script remains a failing placeholder.

### Pending

- A real automated test command and repeatable test coverage.
- Deployment-specific operational configuration.

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

### Partial

- Error response shapes and some user-facing messages remain inconsistent.
- Manual/API verification exists, but automated route tests are not present.

### Pending

- A documented, repeatable API test suite.
- Final deployment-facing API documentation and operational checks.

## EW03 — Authentication & PostgreSQL

### Authentication: Complete

- Registration validates required fields and email format.
- Passwords are hashed with bcrypt before insertion.
- Login verifies the stored password hash.
- Login signs a JWT containing `user_id` with a 24-hour expiry.
- Authenticated routes use the `Authorization: Bearer <token>` header.
- Authentication middleware verifies the token, validates the user ID claim, and confirms the user exists.

### Authentication: Partial

- JWT secret configuration is required, but deployment secret management is not documented beyond environment configuration.
- Automated authentication tests are absent.

### Authentication: Pending

- Production operational controls such as rate limiting and token revocation are not implemented or documented as current features.

### Authorization: Complete

- Project roles are `OWNER` and `MEMBER`.
- Owner-only project operations are protected by authorization middleware.
- Member-readable project operations are protected by membership checks.
- Phase authorization resolves a phase to its project before checking project membership or ownership.
- Shared database helpers provide `getProjectRole()` and `getProjectIdFromPhase()`.
- Project and membership relationships are enforced by PostgreSQL foreign keys and uniqueness constraints.

### Authorization: Partial

- Authorization status/message consistency has been cleaned up, but response formats are not fully standardized.
- Automated permission-matrix tests are absent.

### Authorization: Pending

- No additional authorization features are confirmed by the current repository.

### PostgreSQL: Complete

- PostgreSQL schema exists for users, projects, project memberships, and phases.
- `pg.Pool` is configured from environment variables.
- Project CRUD and project statistics use parameterized SQL.
- Phase CRUD uses PostgreSQL-backed state and timestamp data.
- Transactions are used for project creation and ownership membership insertion.
- Constraints enforce primary keys, foreign keys, unique email, unique project membership, valid roles, valid phase statuses, valid positions, and phase timestamp/state relationships.

### PostgreSQL: Partial

- Indexing was explored in Git history, but no broad production indexing strategy or query-plan report is documented as complete.
- Database error translation covers selected codes, not a full operational error policy.

### PostgreSQL: Pending

- Deployment migrations/versioning are not present as a migration system.
- Automated database integration tests are not present.

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

### Partial

- The backend is functionally implemented, but automated tests are still missing.
- Error response payloads are not fully uniform.
- Some internal cleanup and dependency review remain.
- The current frontend state is not established as a completed MVP in the repository documentation.

### Pending

- Replace the placeholder `npm test` command with real tests.
- Complete deployment configuration and runbook documentation.
- Decide whether the unused `cors` dependency should remain.
- Finish public API documentation and operational review.

## Current Backend State

The active backend flow is:

`server startup -> app middleware -> authentication -> route validation -> authorization -> controller -> PostgreSQL -> response`

The active source is under `backend/src/`. The database definition is under `database/schema.sql`. Development data is generated by `backend/scripts/seed.js`.

## Completed Features

- Node.js ESM startup and configuration
- CWD-independent `.env` and log paths
- Express app/server separation
- Request logging
- JSON parsing
- User registration/login
- JWT authentication
- Project CRUD
- Project filtering by `type`
- Project statistics
- Project membership management
- Project phase CRUD
- Phase status, position, and timestamp validation
- OWNER/MEMBER authorization
- PostgreSQL integrity constraints

## Features In Progress

- EW04 documentation and final backend review
- Consistent response/error presentation
- Automated verification coverage
- Deployment preparation

## Pending Features

Only items supported by the current repository are listed here:

- Automated tests and a working test script
- Deployment runbook and production configuration review
- Frontend completion status and integration documentation
- Migration/versioning workflow if PostgreSQL deployment requires one

## Known Technical Debt

- `npm test` is a placeholder that exits with an error.
- `cors` is declared but not used in current source.
- Error payloads mix strings and objects.
- Some controller and middleware response messages use inconsistent wording.
- The seed script is intentionally destructive for development and must not be used against production data.
- Database constraint handling is selective rather than a complete error taxonomy.
- Automated tests are absent.

## Recent Refactors

- `f8e91bd`: extracted project controllers from the application/routes implementation.
- `fc40d6f`: centralized project authorization queries through `projectMembership.js` and added phase authorization middleware.
- `72bebdb`: added shared validation middleware, phase validation utility, seed script, and cleanup-related changes.
- The current cleanup also removed stale prototype implementations and corrected several error/status handling issues.

## Testing Status

Automated tests are not present. `npm test` remains the default failing placeholder.

Historical/manual verification recorded in the repository includes startup/path behavior, logging-directory initialization, route matching, project filtering, body parsing, and status responses. Those checks should not be described as a replacement for an automated suite.

## Documentation Status

- `README.md`: public setup and usage documentation.
- `PROGRESS.md`: milestone and current-state tracking.
- `MENTAL_MODEL.md`: connected conceptual model.
- `LEARN.md`: concise personal learning notes.
- `LEARNDETAIL.md`: detailed technical reference reconstructed from source and history.

## Deployment Status

Not deployment-ready as a fully verified production release. The backend has a usable implementation and environment configuration, but automated tests, deployment procedures, secret management verification, and operational checks remain pending.

## Git / Development State

The history shows incremental implementation and checkpoints rather than a single rewrite:

`initial project -> Node/config/filesystem -> Express routes/middleware -> controllers -> PostgreSQL -> statistics -> phases -> membership/auth -> authorization refactor -> cleanup`

The latest recorded commit is `72bebdb chore: checkpoint before backend cleanup`. Documentation updates in this working session are intentionally not committed.

## Next Engineering Milestone

Complete the documentation/deployment review after adding a real automated test command and verifying the authentication, authorization, database-constraint, and malformed-input paths against the current API.
