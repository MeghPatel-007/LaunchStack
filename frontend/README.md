# LaunchStack Frontend

Next.js App Router frontend for LaunchStack. It is a TypeScript application that renders the UI and calls the existing Express REST API.

## Stack

- Next.js 16.4.6 with the App Router
- React 19 and TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Playwright for end-to-end tests

## Setup

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Install and run:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Express backend must be running separately. See the root [README](../README.md) for backend setup.

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start the development server |
| `bun run build` | Production build |
| `bun run start` | Start the production build |
| `bun run lint` | Run ESLint |
| `bun run test:e2e` | Run Playwright end-to-end tests |

Type checking is run in CI with `bun run tsc --noEmit`.

## Structure

```text
src/
├── app/
│   ├── layout.tsx                 # Root layout, providers, SessionExpiryHandler
│   ├── loading.tsx                # Route loading state
│   ├── not-found.tsx              # 404 page
│   ├── page.tsx                   # Landing page
│   ├── auth/                      # Sign-in, sign-up, forgot-password, error pages
│   └── dashboard/[id]/            # Dashboard shell and workspace views
├── components/
│   ├── ui/                        # Reusable UI primitives
│   ├── launchstack/               # Project, phase, member, and layout components
│   └── ...                        # Layout, theme, landing, and table components
├── contexts/                      # Sidebar and theme context
├── hooks/                         # Shared hooks
├── lib/
│   ├── api/apiClient.ts           # Fetch wrapper for the Express API
│   ├── services/                  # Auth, project, member, and phase services
│   └── config.ts                  # API_URL resolution
├── proxy.ts                       # Dashboard route protection
└── types/                         # Auth, project, member, and phase types
```

## Authentication flow

1. `POST /auth/login` is sent to the Express API with `credentials: 'include'`.
2. Express verifies the credentials, signs a JWT, and sets the HTTP-only `token` cookie.
3. The login handler redirects to `/dashboard/<userId>`.
4. `src/proxy.ts` matches `/dashboard/:path*`, reads the `token` cookie, and calls the Express `/auth/me` endpoint.
5. If the cookie is missing or `/auth/me` rejects it, the proxy redirects to `/auth/sign-in` and clears the cookie.
6. If the dashboard id does not match the authenticated user, the proxy redirects to the user's own dashboard.
7. `apiClient` broadcasts `auth:unauthorized` on `401` responses from protected endpoints; `SessionExpiryHandler` redirects to sign-in.

Logout calls `POST /auth/logout` and redirects to sign-in in all cases.

## Known production limitation

The Express API sets the cookie on the Render API domain. The Next.js proxy runs on the Vercel frontend domain. The browser does not send the Render-domain cookie to Vercel, so the proxy cannot read it and redirects authenticated users to sign-in.

The proposed fix is a same-origin Backend-for-Frontend (BFF) layer in Next.js. It has **not** been implemented. See the root [ARCHITECTURE.md](../ARCHITECTURE.md) and [PROGRESS.md](../PROGRESS.md).

Additional known frontend issue: the sign-in form's "Forgot your password?" link points to `/auth/forgot-password-2`, while the existing route is `/auth/forgot-password`. Source is unchanged; this is recorded as a pending fix.

## Routes

- `/` — landing page
- `/auth/sign-in` — login
- `/auth/sign-up` — registration
- `/auth/forgot-password` — password recovery placeholder
- `/auth/errors/forbidden`, `unauthorized`, `not-found`, `internal-server-error`, `under-maintenance` — error pages
- `/dashboard/[id]` — dashboard shell
- `/dashboard/[id]/projects` — project list
- `/dashboard/[id]/projects/[projectId]` — project overview
- `/dashboard/[id]/projects/[projectId]/phases` — phase management
- `/dashboard/[id]/projects/[projectId]/members` — member management
- `/dashboard/[id]/projects/[projectId]/board`, `backlog`, `activity`, `settings` — project views
- `/dashboard/[id]/members`, `tasks`, `calendar`, `chat`, `mail`, `faqs`, `pricing`, `settings`, `users` — workspace views

Some workspace views use static sample data and are not connected to the Express API.

## UI states

- Global loading state in `src/app/loading.tsx`.
- 404 state in `src/app/not-found.tsx` and the auth error routes.
- Project list loading, error, and empty states in `projects-client.tsx`.
- Phase list error and empty states.
- Form validation and server-error feedback in the auth, project, and phase forms.
- Toast feedback through the shared `Toaster`.

## Testing

```bash
bun run test:e2e
```

Playwright starts the backend from `../backend` against `.env.test` and starts the Next.js dev server. The last recorded result is 17 passing, 0 failing with Chromium. Playwright is not wired into CI.

## Deployment

The frontend is deployed on Vercel. Set `NEXT_PUBLIC_API_URL` to the Render API URL and configure the API's `ALLOWED_FRONTEND_ORIGINS` to include the Vercel origin.

No production URLs are recorded in this repository.
