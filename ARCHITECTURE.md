# LaunchStack Architecture Decision Record

**Status:** Accepted
**Decision date:** 2026-10-19
**Scope:** LaunchStack application architecture and staged transition from the completed backend MVP to the intended full-stack application.

## Decision

LaunchStack will evolve into one **Next.js full-stack application** using React for the frontend, Next.js server-side capabilities for application logic and APIs, and PostgreSQL for persistent data.

The transition is staged. Starting at EW05, build the Next.js frontend and integrate it with the existing Express REST API. Keep Express as the backend throughout frontend development and integration. Once that frontend is complete and integrated, migrate backend responsibilities from Express into appropriate Next.js server-side modules, Route Handlers, and Server Actions. Preserve PostgreSQL. Remove Express only after migration checks pass.

The migration is **deferred, not cancelled**. This record sets direction; it does not authorize a blind rewrite. When migration begins, the actual LaunchStack repository is the source of truth for the implementation plan.

## Current state

- EW01–EW04 are complete.
- The backend MVP uses Node.js, Express, and PostgreSQL.
- It includes authentication and authorization, project APIs, project phases, validation, and error handling.
- EW05 onward resumes with the Next.js frontend, followed by integration with the existing API.

This is the agreed high-level state. Confirm details such as the repository structure, database schema, and exact auth implementation from the repository before changing them.

## Staged transition

### Stage 1 — Build the Next.js frontend (EW05 onward)

- Establish the Next.js app shell, routes, layouts, and user-facing flows.
- Connect frontend requests to the existing Express REST API.
- Match the backend's current authentication and authorization behavior; handle tokens or sessions safely.
- Keep the Express API and PostgreSQL as the system of record for backend operations and data.
- Document local configuration and how to run the integrated frontend and backend.

**Exit condition:** The frontend is complete for the intended MVP scope and its primary user journeys work end to end through Express and PostgreSQL, with expected access control and failure behavior.

### Stage 2 — Assess and plan the migration

Before moving code, inspect the actual repository and document:

- Existing routes, middleware, controllers, services, and their dependencies.
- Authentication/session/token flows and authorization rules.
- Validation schemas, error contracts, and API behavior relied on by the frontend.
- PostgreSQL schema, migrations, queries/data-access layer, and transaction boundaries.
- Environment configuration, secrets, deployment setup, and current test coverage.
- A feature-by-feature migration order, compatibility needs, and rollback approach.

Prefer moving and adapting well-understood responsibilities in small, reviewable slices. Keep database schema and user data stable unless a separately justified migration is needed.

### Stage 3 — Migrate backend responsibilities into Next.js

- Implement server-side logic in framework-appropriate modules and expose HTTP endpoints with Route Handlers where an API is needed.
- Use Server Actions only for suitable server mutations; do not force every existing REST operation into that model.
- Preserve authentication, authorization, validation, business rules, error semantics, and PostgreSQL data access.
- Maintain compatible behavior for frontend flows during the transition, changing contracts deliberately and updating callers together.
- Migrate responsibility by responsibility; avoid a wholesale rewrite without repository evidence.

### Stage 4 — Verify, switch over, and retire Express

- Verify feature parity for every migrated flow.
- Verify data integrity and behavior against the existing PostgreSQL database, including relevant transactions and migrations.
- Review authentication, authorization, session/token handling, secret management, and exposed server/client boundaries.
- Run the applicable automated tests and focused integration/regression checks; add coverage for gaps that affect the migration.
- Confirm production configuration, deployment, logging, and rollback/switch-over steps.
- Switch traffic or application usage to the Next.js backend only when the checks pass.
- Remove Express code and dependencies only after the Next.js implementation is the verified active backend and rollback needs have been addressed.

## Target state

```text
User
  ↓
Next.js application
  ├── React frontend
  ├── Server-side application logic
  ├── Route Handlers and suitable Server Actions
  ├── Authentication, authorization, and validation
  └── PostgreSQL data access
          ↓
      PostgreSQL
```

The final application has one Next.js application boundary for the UI and backend responsibilities, with PostgreSQL retained as the database. The target does not prescribe a particular ORM, authentication library, deployment platform, or database-access pattern; choose those from repository evidence and project needs when the migration is planned.

## Constraints and guardrails

1. **Do not rebuild or replace the backend during frontend work.** EW05 onward uses the existing Express REST API.
2. **Migration timing:** Start backend migration only after the Next.js frontend is complete and integrated with Express.
3. **No blind rewrites:** Inspect the actual repository and preserve proven behavior; migrate in small, reviewable steps.
4. **Preserve PostgreSQL and existing data.** Any schema or data migration requires an explicit, tested plan.
5. **Preserve security behavior.** Authentication is not sufficient without authorization checks on every protected operation; do not rely on frontend route protection alone.
6. **Keep secrets and privileged database access server-side.** Never expose credentials or secret-bearing configuration to the browser.
7. **Treat contracts deliberately.** Validation, response/error formats, and authorization outcomes must remain compatible or change with coordinated callers and documentation.
8. **Express removal is gated.** Do not remove it until parity, data integrity, security, tests, and deployment/switch-over readiness are verified.
9. **Repository is authoritative at migration time.** Update the plan to reflect what is actually present, including deviations from this high-level record.

## Migration checklist

- [ ] Inspect and map the actual Express implementation and frontend integration.
- [ ] Record current routes, request/response contracts, auth rules, and error behavior.
- [ ] Map data access to PostgreSQL schema, migrations, constraints, and transactions.
- [ ] Decide which responsibilities belong in server modules, Route Handlers, or Server Actions.
- [ ] Define migration slices, compatibility strategy, and rollback/switch-over steps.
- [ ] Migrate authentication and session/token handling securely.
- [ ] Migrate authorization checks and verify them on every protected operation.
- [ ] Migrate validation, business logic, and error handling without dropping edge cases.
- [ ] Migrate or reuse PostgreSQL data access while preserving data and transaction semantics.
- [ ] Verify feature parity and frontend behavior for all in-scope flows.
- [ ] Verify data integrity, security boundaries, and secret handling.
- [ ] Run and extend relevant tests; complete focused integration and regression checks.
- [ ] Verify production configuration, deployment, monitoring, and rollback readiness.
- [ ] Switch to the Next.js backend after the checks pass.
- [ ] Remove Express only after successful switch-over and confirmation that it is no longer required.
- [ ] Update this record and project documentation to reflect the implementation.

## Rationale

The agreed final direction is a single Next.js full-stack application. Completing the frontend against the existing Express API first preserves the work already done, keeps EW05 onward focused on the user-facing product, and avoids mixing two large changes at once. The Express backend work remains valuable: HTTP, REST, PostgreSQL, authentication, authorization, validation, and business logic concepts transfer to Next.js server-side development. A repository-led, staged migration then allows those responsibilities to move carefully while protecting existing behavior and data.

## Decision review

Revisit this record if repository evidence, product requirements, deployment constraints, or migration risk make the target impractical. Any change to the target should be recorded here with its rationale; the migration should not be silently abandoned or assumed complete.
