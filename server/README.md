# BugTracker API server

Module-based Express REST API for the BugTracker React app. Uses PostgreSQL + Prisma, JWT bearer authentication, Zod validation, role checks, and file attachments.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and set your PostgreSQL credentials plus a long random `JWT_ACCESS_SECRET` (32+ characters). Create the database named `bugtracker`, or update `DATABASE_URL` to an existing database.

```bash
npm run prisma:generate
npm run prisma:migrate
# Optional: configure ADMIN_EMAIL / ADMIN_PASSWORD in .env, then bootstrap an admin
npm run seed:admin
npm run dev
```

API base URL: `http://localhost:8080/api/v1`

Health check: `GET http://localhost:8080/api/v1/health`

## Module structure

```text
server/
├── prisma/schema.prisma
├── src/
│   ├── config/prisma.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── modules/
│   │   ├── auth/{route,controller,service}.js
│   │   ├── user/{route,controller,service}.js
│   │   ├── project/{route,controller,service}.js
│   │   ├── issue/{route,controller,service}.js
│   │   ├── attachment/{route,controller,service}.js
│   │   ├── report/{route,controller,service}.js
│   │   └── setting/{route,controller,service}.js
│   ├── utils/
│   ├── app.js
│   └── server.js
├── uploads/
├── .env.example
└── package.json
```

Each business module separates HTTP routes, request/controller handling, and database/business logic in the service layer.

## API endpoints

All routes except health, register, and login require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Login and get JWT |
| GET/PATCH | `/auth/me` | Read/update current user profile |
| POST | `/auth/logout` | Client token discard acknowledgement |
| GET/POST | `/projects` | List/create projects |
| GET/PATCH/DELETE | `/projects/:id` | Read/update/archive project |
| GET/POST | `/issues` | List/create issues |
| GET/PATCH/DELETE | `/issues/:id` | Read/update/archive issue |
| POST | `/issues/:id/comments` | Add issue comment |
| DELETE | `/issues/:id/comments/:commentId` | Delete own comment (or admin) |
| GET/POST | `/attachments/issue/:issueId` | List/upload issue attachments |
| GET/DELETE | `/attachments/:id/download` or `/attachments/:id` | Download/delete attachment |
| GET | `/users` | List users (admin only) |
| POST | `/users` | Create user (admin only) |
| GET/PATCH/DELETE | `/users/:id` | Read/update/disable user (admin only) |
| GET | `/reports/summary` | Summary counts for reports |
| GET/PATCH | `/settings` | Get/update current user's preferences |

List endpoints accept `page`, `limit`, and optional filter query parameters. `limit` is capped at 100.

## Example login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}
```

The initial registration route assigns `DEVELOPER` role; it does not let public users self-assign admin permissions. To bootstrap an administrator, set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters), and optionally `ADMIN_NAME` in `.env`, then run `npm run seed:admin`. Treat these credentials as secrets and remove them from deployment configuration after bootstrap if no longer needed.

## Issue attachments and pasted screenshots

Send `multipart/form-data` with field name `file` to `POST /api/v1/attachments/issue/:issueId`. The endpoint accepts one file per request and stores it in `UPLOAD_DIR` (default `server/uploads`); the configured size limit defaults to 10 MB. A pasted screenshot from the frontend should be converted to a `File`/`Blob` and posted using `FormData`.

For production, use private object storage (for example S3-compatible storage), malware scanning, file-type allowlists, and authorization checks before making uploads accessible. The current local disk adapter is intended for local development/single-server deployments.

## Important integration notes

- The existing frontend demo currently persists data in `localStorage`; it is not automatically connected to this API yet. Configure the frontend to call `http://localhost:8080/api/v1` and replace the demo store with API queries to use server data.
- The API uses enum values in uppercase (for example `IN_PROGRESS`, `HIGH`, `BUG`); map them to display labels in the UI.
- `logout` is stateless because access tokens are JWTs; the client must discard the token. For a production session system, add refresh-token rotation/revocation.
- No demo password or default administrator account is created.
