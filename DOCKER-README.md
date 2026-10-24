# BugTracker Docker setup (same-origin API)

The React frontend is served by Nginx. Requests to `/api/...` are reverse-proxied internally to the Express backend, so the browser uses one origin and does not need a separately exposed API port.

## Expected project layout

Place these Docker files in the root of the BugTracker project, alongside the root `package.json` and `src/` folder. The API must be in `server/` with `server/package.json`, `server/prisma/`, and `server/src/`.

```text
bugtracker/
├── docker-compose.yml
├── Dockerfile
├── frontend/nginx.conf
├── package.json
├── src/
└── server/
    ├── Dockerfile
    ├── package.json
    ├── prisma/
    └── src/
```

## Start

1. Copy `.env.example` to `.env` and set a strong `POSTGRES_PASSWORD` and `JWT_ACCESS_SECRET`.
2. Run `docker compose up --build -d`.
3. Open `http://localhost:5173`.
4. Check logs with `docker compose logs -f frontend backend`.

The frontend API base is compiled as `/api/v1`. Nginx forwards `/api/v1/...` unchanged to `backend:8080`, while the backend and database ports are not published to the host.

For production, configure HTTPS at your reverse proxy/load balancer and use Prisma migrations (`prisma migrate deploy`) instead of `prisma db push` once migrations are established.
