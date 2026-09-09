# LaunchStack Mental Model

This is the connected picture of the backend: not a syntax reference, but a way to rebuild the system in my head when I forget how one part relates to another.

## Node.js: From Process to Server

Node is the runtime process that executes the ESM modules. The process receives environment variables, loads modules, performs asynchronous work, and eventually keeps listening for HTTP requests.

The startup chain is:

`process -> ESM modules -> configuration -> filesystem initialization -> Express app -> listen`

`config.js` loads `.env` relative to the module location. `server.js` validates the port, awaits `ensureLogsDir()`, and only then calls `app.listen()`. The reason for awaiting setup is causal: if required initialization fails, the server should not announce itself as ready.

Modules divide responsibilities. `app.js` builds the application and registers middleware/routes. `server.js` owns startup. Controllers own request/database coordination. Utilities isolate reusable filesystem and phase-validation behavior. `pg.Pool` owns PostgreSQL connections.

Async operations matter because filesystem access, database queries, bcrypt, and JWT-related request work do not finish immediately. `await` makes startup and request sequencing explicit.

## Express: The Request Pipeline

The current mental model is:

`Request -> middleware -> router -> controller -> database -> response`

The application first writes a request log and parses JSON. `/auth` routes are public. `/projects` and phase routes pass through authentication. Route-specific middleware then validates IDs/body fields and checks project membership or ownership. The controller performs the domain operation and PostgreSQL query. The controller sends the response or forwards an unexpected error with `next(e)`.

`next()` means the current middleware is done and the next function may run. `next(e)` means normal processing stops and Express should use error middleware. The final error middleware translates malformed JSON and selected PostgreSQL constraint errors, then returns a generic `500` for unexpected failures.

Route order matters. `/projects/stats` must be registered before `/projects/:id`, otherwise the word `stats` could be treated as an ID. More specific routes are placed before general parameter routes.

Controllers are deliberately thin coordinators rather than a new architecture layer. They receive already-authenticated/authorized requests, perform operation-specific validation and SQL, and shape the response.

## Authentication and Authorization

Registration follows:

`credentials -> required/email validation -> bcrypt hash -> users row`

Login follows:

`email/password -> users query -> bcrypt.compare -> JWT -> token response`

Authentication answers: **Who are you?** The JWT carries `user_id`; `authenticate` verifies the token, validates the claim, checks that the user exists, and attaches `req.user`.

Authorization answers: **What are you allowed to do?** Project authorization queries membership and reads the role. `OWNER` can change/delete the project and manage members/phases. `MEMBER` can read member-level project/phase resources.

A phase ID alone is not enough to authorize a request. The phase belongs to a project, so phase middleware uses `getProjectIdFromPhase()` and then checks the authenticated user's role in that project. This is nested-resource authorization:

`phase -> project -> membership -> role -> decision`

## PostgreSQL

The database model is:

`application -> parameterized SQL -> PostgreSQL -> constraints -> result`

The schema contains:

- `users`: identity, username, email, password hash.
- `projects`: project metadata.
- `project_members`: the relationship between users and projects, with `OWNER`/`MEMBER` roles.
- `project_phases`: ordered project work with status and timestamps.

Primary keys identify rows. Foreign keys connect memberships/phases to their parent rows and use cascade behavior where defined. Unique constraints prevent duplicate emails, duplicate user/project memberships, and duplicate phase positions within a project. Check constraints enforce valid roles, statuses, positions, and timestamp/state combinations.

LaunchStack uses parameterized SQL such as `$1` and `$2`: query structure stays separate from values. Joins combine projects with memberships and users. The statistics query uses a CTE, aggregation, `FILTER`, `GROUP BY`, `CASE`, and `COALESCE` to turn phase rows into project progress.

Transactions group project creation and owner-membership insertion. `BEGIN -> operations -> COMMIT` makes the project and its owner relationship one unit. Failure should lead to rollback.

Indexes and query planning were explored in the PostgreSQL learning history. The mental model is `query -> planner -> cost comparison -> index scan or sequential scan`; `EXPLAIN` inspects the plan and `EXPLAIN ANALYZE` measures execution. The repository does not contain a documented production indexing strategy.

## Validation Layers

Validation is layered:

1. **Input validation:** middleware checks route IDs, required strings, optional strings, positive integers, emails, and malformed JSON.
2. **Domain validation:** phase status determines whether timestamps are allowed; positions must be unique within a project; only valid roles/permissions may act.
3. **Database integrity:** PostgreSQL is the final boundary for non-null fields, foreign keys, unique values, role/status checks, and phase state rules.

The layers answer different questions. Input validation asks whether the request has an acceptable shape. Domain validation asks whether the operation makes sense. Database constraints protect stored data even if application logic misses a case or two requests race.

## HTTP Semantics

The project uses these meanings:

- `400`: malformed JSON or invalid request fields/IDs.
- `401`: missing or invalid authentication.
- `403`: authenticated but not permitted by membership/role.
- `404`: requested project, phase, user, or membership does not exist.
- `409`: duplicate email, membership, or phase position conflicts with existing state.
- `500`: unexpected server/database failure.

## CRUD Mental Model

CRUD is the repeated path:

`HTTP method/path -> route -> middleware -> controller -> SQL -> PostgreSQL -> response`

Projects and phases use POST to create, GET to read, PUT to replace/update, and DELETE to remove. The controller checks the query result and selects a resource/status response. PostgreSQL supplies persistence and integrity rather than the controller maintaining an in-memory collection.

## Debugging and Refactoring

The journey was incremental:

`make it work -> observe behavior -> find the controlling boundary -> fix -> checkpoint -> clean up`

Historical examples include moving from in-memory project examples to PostgreSQL, discovering route-order behavior around `/projects/stats`, separating `app.js` from server startup, extracting controllers, adding phase constraints, and centralizing membership queries.

The project was not born with its current shape. Early Express routes and handlers were direct and educational. PostgreSQL and authorization were added later. Cleanup followed a checkpoint so the learning implementation and the refactor could be compared.

## Git as a Learning Tool

Git records the sequence:

`implementation -> checkpoint -> test/inspection -> refactor -> review -> commit`

Commit history shows the concepts arriving in context: Node foundation, Express routes/middleware, controller extraction, PostgreSQL schema/CRUD, statistics, phases, membership authorization, and authorization-query refactoring.

## Quick Revision

- **Node:** a process loads modules, configuration, async operations, and finally a listening server.
- **Express:** middleware moves a request through routing, authorization, controller, and response.
- **Middleware:** cross-cutting request decisions happen before the controller.
- **Authentication:** JWT establishes the user identity.
- **Authorization:** membership and role decide the allowed action.
- **PostgreSQL:** SQL persists the model and constraints protect its integrity.
- **SQL:** parameters carry values separately from query structure.
- **Transactions:** related writes commit together or roll back together.
- **Validation:** input shape, domain rules, and database integrity are separate layers.
- **Errors:** `next(e)` moves unexpected failures to error middleware.
- **Git:** commits preserve the path from learning implementation to refactoring.
- **Refactoring:** simplify after behavior is understood and stable.
