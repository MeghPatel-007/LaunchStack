# LaunchStack

LaunchStack is a project-planning workspace for turning an idea into a visible delivery path:

`Idea -> Planning -> Development -> Completion`

It exists to make project progress easier to structure and inspect. The current MVP models projects, project members, project phases, phase state, and aggregate progress. The backend is the implemented part of the MVP; the frontend directory exists but is not documented here as a completed feature.

## Current MVP

Implemented backend capabilities:

- User registration and login
- bcrypt password hashing and JWT authentication
- Project creation, listing, filtering, reading, updating, and deletion
- Project membership and OWNER/MEMBER roles
- Project member listing, addition, and removal
- Project phase creation, listing, reading, updating, and deletion
- Phase status and timestamp rules
- Project statistics based on phase completion
- Request logging and JSON request parsing
- PostgreSQL constraints for relationships and phase integrity

## Architecture

The backend intentionally uses this flow:

`Routes -> Middleware -> Controllers -> PostgreSQL`

- Routes map HTTP methods and paths to middleware and controllers.
- Middleware handles request logging, JSON parsing, input validation, authentication, and authorization.
- Controllers coordinate request data, SQL queries, transactions, and responses.
- PostgreSQL stores users, projects, memberships, and phases and enforces database constraints.

There are no service or repository layers in the current implementation.

## Technologies

- Node.js with ESM modules
- Express 5
- PostgreSQL
- `pg`
- `bcrypt`
- `jsonwebtoken`
- `dotenv`
- `nodemon` for development

## Project Structure

```text
LaunchStack/
├── backend/
│   ├── scripts/seed.js
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config.js
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── learning.sql
│   └── test-data.sql
├── frontend/
├── LEARN.md
├── LEARNDETAIL.md
├── MENTAL_MODEL.md
├── PROGRESS.md
└── README.md
```

## Setup

### Requirements

- Node.js
- PostgreSQL
- A PostgreSQL database with permission to create the LaunchStack tables

### Install backend dependencies

```powershell
cd backend
npm install
```

### Configure environment variables

Create a root `.env` file. The backend loads it relative to `backend/src/config.js`, so startup does not depend on the current working directory.

Required values:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
DB_USER=database_username
DB_PASSWORD=database_password
JWT_SECRET=replace-with-a-secret-value
```

Use a long, private JWT secret outside development.

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

The server listens at `http://localhost:3000` when `PORT=3000`.

## API

Authenticated project and phase requests use:

```http
Authorization: Bearer <jwt>
```

### Authentication

| Method | Endpoint         | Purpose                             |
| ------ | ---------------- | ----------------------------------- |
| `POST` | `/auth/register` | Register a user                     |
| `POST` | `/auth/login`    | Verify credentials and return a JWT |

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

Registration stores a bcrypt hash rather than a plaintext password. Login compares the supplied password with the stored hash and signs a JWT containing the user ID. Authenticated requests verify the JWT and confirm that the user still exists.

Authentication answers who the caller is. Authorization checks whether that authenticated user is a project member or owner. Phase authorization first resolves the phase's project and then checks membership or ownership on that project.

## Status

The backend MVP is functionally implemented and has undergone cleanup through EW04. The repository does not currently contain an automated test suite: `npm test` is still the package placeholder. Documentation and deployment preparation remain in progress. The frontend is not represented as a completed implementation in this document.

See [PROGRESS.md](PROGRESS.md) for the evidence-based milestone status, [MENTAL_MODEL.md](MENTAL_MODEL.md) for connected concepts, [LEARN.md](LEARN.md) for concise personal notes, and [LEARNDETAIL.md](LEARNDETAIL.md) for the detailed technical reference.
