# LaunchStack — Detailed Backend Learning Reference

## 1. How This Document Should Be Used

`LEARN.md` is the concise personal record. This file is the deep reference: use it when a concept has faded and the system needs to be reconstructed from first principles and actual LaunchStack code.

The current implementation is the authority for current behavior. Historical sections identify older implementations as historical rather than presenting them as current. The history used here runs from the initial project through the EW01, EW02, PostgreSQL, phase, membership, authorization-refactor, and cleanup commits.

## 2. LaunchStack Architecture

The backend uses:

`Routes -> Middleware -> Controllers -> PostgreSQL`

`app.js` creates the Express app, installs request logging and JSON parsing, mounts public auth routes, mounts authenticated project routes, mounts authenticated phase routes, and installs error middleware. `server.js` validates startup configuration, ensures the logs directory exists, and starts listening.

Routes describe the public HTTP surface. Middleware handles concerns shared by many routes: IDs, body fields, email format, authentication, and membership/role authorization. Controllers receive the request after those gates and coordinate SQL plus HTTP responses. `db/projectMembership.js` contains small shared membership lookups, not a service/repository architecture.

The database is the persistent model. `schema.sql` defines users, projects, memberships, and phases. PostgreSQL constraints remain important even when a controller checks the same rule first.

## 3. Backend Request Lifecycle

Take `PUT /phases/:id` as an example:

1. The client sends JSON and an `Authorization: Bearer <jwt>` header.
2. The logging middleware writes method and path information.
3. `express.json()` parses the body.
4. The root-mounted authenticated phase router runs `authenticate`.
5. `validateId('id')` rejects a non-positive/non-integer phase ID.
6. `requirePhaseOwner` resolves the phase's project using `getProjectIdFromPhase()` and checks `getProjectRole()` for `OWNER`.
7. Required/optional field middleware validates the body shape.
8. `putPhaseById` checks that the phase exists, checks position uniqueness, validates status/timestamps with `validatePhase()`, and executes a parameterized update.
9. PostgreSQL applies its own constraints.
10. The controller sends `200` with the updated phase, `404` for a missing phase, `409` for a conflicting position, or forwards an unexpected error.

This order matters. Authentication must establish `req.user` before authorization can use it. Authorization must happen before a protected controller changes data. Input validation should reject malformed values before they become database errors.

## 4. Node.js Foundation

Node runs the backend JavaScript process. In ESM mode, imports load modules and top-level `await` can be used during startup. The package declares `"type": "module"`, so files use `import`/`export`.

`config.js` loads dotenv using a path derived from `import.meta.url`, `fileURLToPath()`, and `dirname()`. This is different from resolving from `process.cwd()`: changing the directory from which the server is launched does not change which root `.env` file is selected.

Startup is intentionally sequential:

`validatePortNumber() -> await ensureLogsDir() -> app.listen()`

The filesystem utility uses promise APIs. It handles `ENOENT` by creating the logs directory and rethrows unexpected errors. The reason for awaiting it is operational: a required startup dependency must succeed before the server reports readiness.

## 5. Express Architecture

The app is an object assembled before the server listens. This allows route/middleware behavior to be separated from the startup side effect.

The logging middleware is mounted before the routes. It records `req.method` and `req.path`, awaits file writing, and calls `next()`. JSON parsing is installed before controllers read `req.body`.

The error middleware has four relevant paths:

- Express JSON parser error `entity.parse.failed` -> `400`.
- PostgreSQL unique violation `23505` -> `409`.
- PostgreSQL check violation `23514` -> `400`.
- Other errors -> generic `500`.

Controllers call `next(e)` for unexpected errors. The route/controller functions therefore need the `next` parameter even when they normally use only `req` and `res`.

## 6. Routing

Auth routes are mounted at `/auth`:

- `POST /auth/register`
- `POST /auth/login`

Project routes are mounted at `/projects`:

- `POST /projects`
- `GET /projects`
- `GET /projects/stats`
- parameterized project and member routes

Phase routes are mounted at `/`:

- `POST /projects/:projectId/phases`
- `GET /projects/:projectId/phases`
- `GET/PUT/DELETE /phases/:id`

The static `/projects/stats` route is registered before `/:id`. This was a real route-matching lesson: a parameter route can consume a word intended for a static route if the static route is not placed first.

## 7. Middleware

Validation middleware is factory-style because each route can specify the field it needs. `validateId('id')` converts and checks a route parameter. Required strings reject missing, non-string, and whitespace-only values. Optional strings accept omission but reject non-string values. Positive integers are used for member IDs and phase positions. Email validation is used by both auth routes.

`authenticate` reads the Authorization header, requires exactly a Bearer scheme and token shape, verifies the JWT, validates the positive integer `user_id`, checks the user row, and attaches the verified payload to `req.user`.

Project authorization distinguishes project existence, membership, and ownership. Phase authorization has two paths: resolve a phase to its project for phase routes, or validate the project directly for project-phase collection routes.

`next()` advances normal processing. `next(e)` transfers control to error middleware. Calling `next()` twice is incorrect because it can run later middleware/controllers twice; this was fixed during cleanup.

## 8. Controllers

Controllers represent operations rather than transport-only route declarations. `projectController.js` performs project/member queries. `projectPhaseController.js` performs phase queries and invokes `validatePhase()`. `authController.js` performs bcrypt/JWT work and user queries.

A controller often follows:

`read request -> domain check -> parameterized query -> inspect result -> response`

Project creation is transactional because it writes a project and then its owner membership. The controller obtains a pool client, begins, inserts the project, inserts the owner relationship, commits, and releases the client in `finally`.

## 9. Error Handling

Expected client conditions are handled close to the decision:

- validation middleware returns `400`;
- auth middleware returns `401`;
- authorization middleware returns `403` or `404`;
- controllers return `404` for missing resources and `409` for known conflicts.

Unexpected database/runtime failures are forwarded with `next(e)`. The application error middleware is the final translation boundary. It deliberately returns generic unexpected-error text rather than database/JWT internals.

One historical cleanup issue was controllers calling `next(e)` without accepting `next`. The fix was to make the Express handler signature explicit. Another was duplicated `next()` in membership middleware.

## 10. PostgreSQL Integration

`db/pool.js` creates a `pg.Pool` from `getDatabaseConfig()`. A pool avoids opening a new database connection for every ordinary query. Controllers use `pool.query()` for independent operations and `pool.connect()` for the project-creation transaction.

Parameterized queries use placeholders such as `$1`, `$2` and pass values as a separate array. Results expose `rows` and `rowCount`; controllers use those to distinguish an existing resource, an empty result, and a successful insert/update/delete.

The application catches database errors at the request boundary. Some known PostgreSQL codes are translated centrally; unexpected errors remain `500`.

## 11. SQL CRUD

### Project listing and filtering

**WHY:** Return only projects connected to the authenticated user, optionally filtered by type.

**SQL shape:** `projects` joins `project_members`, filters `pm.user_id`, and optionally compares `p.project_type = $2`.

**Parameters:** authenticated `user_id`, optional query `type`.

**Result:** `result.rows` becomes the JSON array.

**Lesson:** authorization belongs in the query boundary too; a project list is not a global table dump.

### Project creation

**WHY:** Create the project and its ownership relationship as one operation.

**SQL shape:** insert project, return `project_id`, insert `OWNER` membership.

**Parameters:** project fields and authenticated user ID.

**Result:** commit returns the new project ID.

**Lesson:** a transaction protects the relationship between a project and its required owner membership.

### Member operations

Membership queries join/compare `user_id` and `project_id`. Before inserting, the controller checks the target user and existing membership. PostgreSQL's unique `(user_id, project_id)` constraint remains the final duplicate boundary.

### Phase CRUD

Phase queries use `project_id` for collection operations and `phase_id` for individual operations. Updates exclude the current phase when checking whether a position is already used. Result checks map absent rows to `404`.

### Statistics

The statistics query is described in detail in section 16 because it is an aggregate read rather than ordinary CRUD.

## 12. SQL Injection and Parameterized Queries

### My Original Note

> ! it is done to prevent sql injection

### Detailed Explanation

LaunchStack builds the SQL statement separately from its values. A value such as a project type is passed through the parameter array rather than concatenated into SQL text. PostgreSQL/`pg` handles it as data, so input does not become query syntax.

### LaunchStack Example

The project filter uses the SQL condition `and p.project_type = $2` and passes `[userId, type]` separately.

### Mental Model

`query structure + parameter values` is safer than `string concatenation + user input`. Parameterization does not replace authorization or domain validation; it protects the SQL boundary.

## 13. Database Relationships

The relationships are:

`users -> project_members <- projects -> project_phases`

A user can belong to many projects. A project can have many users through `project_members`. A project can have many phases. A phase belongs to one project.

The membership table is the relationship plus role. The phase table is a child resource. That is why a phase authorization request must travel through its parent project before making a role decision.

## 14. Database Constraints

From `database/schema.sql`:

- Identity primary keys identify users, projects, memberships, and phases.
- Project and phase `name` fields are not null.
- Project `project_type` is not null.
- Phase `status` is not null and limited to `NOT_STARTED`, `IN_PROGRESS`, and `COMPLETED`.
- Phase `position` must be at least `1`.
- A finished phase requires a start and cannot finish before it starts.
- Status/timestamp combinations must agree: not started has no timestamps, in progress has a start only, completed has both.
- A phase's project must exist through a foreign key.
- `(project_id, position)` is unique.
- Email is unique.
- Membership roles are limited to `OWNER` and `MEMBER`.
- A membership's user and project must exist.
- `(user_id, project_id)` is unique.

Application checks improve responses, but constraints protect data during races or future code paths.

## 15. Project Phases

A phase has a name, description, status, position, and optional timestamps. The status is a small state model:

- `NOT_STARTED`: no start/finish timestamps.
- `IN_PROGRESS`: valid start timestamp and no finish timestamp.
- `COMPLETED`: valid start and finish timestamps, with finish not earlier than start.

The controller's `validatePhase()` expresses these rules before SQL. The database repeats the important invariants as checks. Position is project-scoped and unique, which makes ordering explicit and prevents two phases from occupying the same slot.

## 16. Project Statistics

The project statistics query first builds a `phase_stats` CTE. It groups phases by project and counts total phases and completed phases. The outer query joins projects to phases, phase aggregates, and memberships.

`COUNT(...) FILTER (WHERE ...)` counts each status category. `GROUP BY` produces one row per project/aggregate combination. `COALESCE(..., 0)` makes a project with no phases report zero counts instead of null. `CASE` avoids division by zero and derives `work_done` as completed phases divided by total phases times 100.

The result is restricted by the authenticated user's project membership. This is both an SQL aggregation lesson and an authorization lesson: the aggregate must use the same project visibility boundary as ordinary project reads.

## 17. Transactions

Project creation uses:

`BEGIN -> insert project -> insert OWNER membership -> COMMIT`

The first insert returns an ID used by the second insert. If an operation fails, the controller rolls back and releases the client. Without the transaction, a project could exist without its required owner membership.

The seed script also uses a transaction around truncation and development data insertion, then releases the pool. It is destructive development setup, not a production migration system.

## 18. Indexes and Query Planning

The Git history includes a PostgreSQL/indexing learning commit (`7d9cc67`). The supported general model is:

`query -> planner -> cost -> index scan or sequential scan`

A B-tree index can help equality/order lookups, but an index is not automatically better for every table size or selectivity. `EXPLAIN` shows the planner's chosen plan. `EXPLAIN ANALYZE` runs the query and reports measured behavior, so it should be used carefully with writes.

The current repository does not provide a completed production query-plan study or a broad explicit index strategy. The primary-key/unique constraints create database indexes as part of PostgreSQL's constraint implementation, but that is not the same as documenting every workload index.

## 19. Authentication

Registration validates fields, normalizes the email for lookup/storage, hashes the password with bcrypt, and inserts a password hash. Login retrieves the user by normalized email, compares the supplied password to the hash, and signs a JWT with the user's ID and a 24-hour expiry.

On a protected request, authentication reads the header, verifies the token with `JWT_SECRET`, validates the payload ID, checks the user row, and sets `req.user`. Controllers use that identity rather than accepting a client-provided owner identity.

The mechanism present is JWT bearer authentication. Token revocation, refresh tokens, rate limiting, and other mechanisms are not current features and are not described as implemented.

## 20. Authorization

`projectMembership.js` contains two shared lookups:

- `getProjectRole(userId, projectId)` returns the membership role or `null`.
- `getProjectIdFromPhase(phaseId)` resolves a phase to its project or `null`.

Git commit `fc40d6f` records the authorization-query centralization. Before that refactor, membership/project lookup SQL was duplicated in middleware and controllers. The current middleware uses the helpers and applies OWNER/MEMBER decisions consistently across project and phase routes.

For `/projects/:projectId/phases`, authorization checks the project directly. For `/phases/:id`, authorization first resolves the parent project. A known phase ID does not itself prove that the caller belongs to its project.

## 21. Validation

Route middleware handles shape and basic scalar rules. Controllers handle operation-specific checks. `validatePhase()` handles the state/timestamp relation. PostgreSQL enforces the final durable rules.

This separation avoids asking one layer to do everything. For example, a route ID can be rejected as malformed before a query; a missing project can be identified by a query as `404`; a duplicate position is a state conflict; and the unique constraint protects concurrent requests.

## 22. HTTP Status Codes

Current semantics are:

- `400` for malformed JSON and invalid input.
- `401` for absent/invalid bearer authentication or invalid JWT identity.
- `403` for authenticated users without the required project role.
- `404` for missing projects, phases, users, or memberships.
- `409` for duplicate email, membership, or phase-position conflicts.
- `500` for unexpected failures.

The codebase still has some response-shape/message inconsistency. The meanings above describe the intended/current cleanup behavior, not a claim that every payload is standardized.

## 23. Debugging Lessons

### Problem: `/projects/stats` could be captured as an ID

**Investigation:** Static and parameterized routes were compared.

**Root Cause:** A general `/:id` route can match `stats` if registered first.

**Fix:** Register `/stats` before `/:id`.

**Lesson:** Express route order is part of API behavior.

### Problem: startup could depend on the launch directory

**Investigation:** `process.cwd()` changed depending on where the command ran.

**Root Cause:** Relative path resolution used the process working directory.

**Fix:** Resolve `.env` and logs from `import.meta.url` and module-relative paths.

**Lesson:** Resource paths should follow the module/project location when startup must be CWD-independent.

### Problem: the server could listen before required log setup finished

**Investigation:** Startup sequence and async filesystem work were inspected.

**Root Cause:** Initialization was not awaited before listening.

**Fix:** `server.js` awaits `ensureLogsDir()` before `app.listen()`.

**Lesson:** readiness should follow required initialization.

### Problem: authorization SQL was repeated

**Investigation:** Membership and phase-parent queries appeared across authorization paths.

**Root Cause:** Each middleware path owned a copy of the lookup logic.

**Fix:** `getProjectRole()` and `getProjectIdFromPhase()` were introduced and authorization middleware was refactored around them.

**Lesson:** Small helpers can remove meaningful duplication without creating a service layer.

### Problem: cleanup uncovered error/status issues

**Investigation:** The backend was audited after the functional implementation and checkpoint.

**Root Cause:** Controllers forwarded `next(e)` without receiving `next`, membership middleware called `next()` twice, and several invalid/conflict paths were inconsistent.

**Fix:** Handler signatures, middleware continuation, validation, conflict statuses, and configuration checks were corrected.

**Lesson:** A working path still needs an explicit error-path review.

## 24. Architecture Evolution

1. **Initial implementation:** Node project setup and basic Express application.
2. **Express implementation:** project routes, route parameters, request/response handling, logging, and JSON parsing.
3. **Controller extraction:** project handlers moved out of the application route setup (`f8e91bd`).
4. **PostgreSQL integration:** schema, pool/configuration, project CRUD, and statistics migrated from in-memory behavior (`ad58f6f`, `970bdce`, `e6f8a87`).
5. **Phase model:** phase creation/CRUD and state constraints were added (`00bac5d`, `4885796`).
6. **Identity and access:** membership, JWT authentication, and OWNER/MEMBER authorization were added (`2d22f10`).
7. **Authorization refactor:** shared membership/phase-parent query helpers were introduced (`fc40d6f`).
8. **Current cleanup:** validation, error forwarding, conflict status handling, seed cleanup, and documentation are being finalized.

## 25. Code Evolution Examples

### Application handlers to controllers

**Before:** Project behavior lived close to route/application setup and included an in-memory data experiment.

**Why insufficient:** Persistence and route registration became mixed together as the backend grew.

**After:** `projectRoutes.js` registers middleware/controller functions and `projectController.js` performs the operation.

**What learned:** Extract a controller when the route file is no longer the clearest place for request/database behavior; do not add layers merely for naming.

### In-memory project lookup to PostgreSQL lookup

**Before:** Static objects and `Object.hasOwn()` represented projects.

**Why insufficient:** Data did not persist and could not support users, memberships, phases, or constraints.

**After:** Parameterized SQL queries use project/member tables and inspect `rows`/`rowCount`.

**What learned:** The storage boundary changes the controller's responsibility from object lookup to query/result/error handling.

### Repeated authorization queries to helpers

**Before:** Middleware paths contained repeated SQL for membership and phase ownership relationships.

**Why insufficient:** Repeated query logic could drift.

**After:** `getProjectRole()` and `getProjectIdFromPhase()` are shared from `db/projectMembership.js`.

**What learned:** A focused database helper can reduce duplication while preserving the intentional architecture.

## 26. Git and Development Workflow

The commit sequence demonstrates an incremental workflow rather than a large rewrite. A feature or concept was implemented, inspected/tested, committed, then used as the base for the next concept. The checkpoint before cleanup separated the functional learning implementation from cleanup changes.

The current documentation reconstruction is intentionally uncommitted. Git history is used as evidence, while current source is used to decide what is actually true now.

## 27. AI-Assisted Cleanup

The current Git history proves a cleanup checkpoint and subsequent working-tree cleanup, but it does not independently prove which individual edits were AI-assisted. The accurate distinction is:

`learning implementation -> Git checkpoint -> cleanup/review -> human verification`

This document therefore does not claim a specific AI contribution beyond what the conversation/worktree establishes.

## 28. Engineering Principles Learned

Supported principles from the journey include:

- Database constraints are the final integrity boundary.
- Authentication and authorization are different responsibilities.
- Middleware owns cross-cutting request concerns.
- Parameterized SQL separates query structure from data.
- Make functionality work before adding unnecessary abstraction.
- Refactor after behavior is stable.
- Startup must wait for required initialization.
- Git checkpoints preserve the evolution from learning implementation to cleanup.
- Nested resources require authorization through their parent relationship.

## 29. Common Mistakes

The repository/history supports these mistakes or corrected paths:

- Treating a parameter route as harmless without considering static-route ordering.
- Resolving important paths from the current working directory.
- Starting the server before required async initialization completed.
- Keeping controller behavior in route/application setup until extraction became useful.
- Duplicating authorization queries before centralizing them.
- Forwarding errors with `next(e)` from handlers that did not accept `next`.
- Calling `next()` twice in authorization middleware.
- Allowing invalid configuration ranges through a flawed boolean condition.

## 30. Quick Revision

- **Node:** runtime process loads ESM modules and sequences async startup.
- **Express:** request moves through ordered middleware and route matching.
- **Middleware:** validates, authenticates, authorizes, or forwards errors.
- **Authentication:** bcrypt verifies credentials and JWT carries identity.
- **Authorization:** membership and role decide project/phase access.
- **PostgreSQL:** relational tables and constraints persist/protect state.
- **SQL:** placeholders keep values separate from query structure.
- **Transactions:** related writes commit or roll back together.
- **Validation:** shape, domain, and database rules work at different boundaries.
- **Errors:** expected conditions respond locally; unexpected errors use `next(e)`.
- **Git:** history shows the concepts arriving in stages.
- **Refactoring:** cleanup follows understanding and a checkpoint.
