# BugTracker React + Express API

The React frontend now reads and writes application data through the Express REST API. It no longer uses seeded issue/project/user data as the source of truth. JWT access tokens are used for authenticated API requests.

## Requirements
- Node.js 20+
- PostgreSQL 14+

## 1. Start the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`, set `DATABASE_URL`, set a long random `JWT_ACCESS_SECRET`, and configure `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the initial admin account.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed:admin
npm run dev
```

The API defaults to `http://localhost:8080/api/v1`. Verify it at `http://localhost:8080/api/v1/health`.

## 2. Start the frontend

From the project root:

```bash
npm install
```

Copy `.env.example` to `.env` if the API is not running at the default URL. Set `VITE_API_URL` to the API base URL (including `/api/v1`), then run:

```bash
npm run dev
```

Open `http://localhost:5173` and sign in with the seeded administrator credentials or register a user. Registration creates a Developer account; only Admin and Project Manager roles can create projects, and only Admin can manage users.

## Connected frontend features
- Login, registration, current-user profile and logout use `/auth` endpoints.
- Issues and projects load from the API; issue creation/editing, status/priority changes, comments, deletion and filters use persisted API data.
- Attachments are uploaded to the server, stored in `server/uploads`, and downloaded through authenticated API requests. The browser attachment UI supports browse, drag/drop and pasted screenshots.
- User management uses `/users` (Admin only).
- Profile preferences use `/settings`; report summaries can be queried from `/reports/summary`.

## Notes
- The backend uses PostgreSQL. Do not use the frontend local demo data as a database backup.
- Access tokens expire after the configured JWT lifetime; expired tokens are discarded and the user is sent back to login.
- Password reset email delivery is not implemented by the backend yet, so the Forgot Password screen explains this limitation.
