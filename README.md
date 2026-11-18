# globmoro-backend

Minimal contact/inquiry API for [globmoro.com](https://globmoro.com).

**Repo:** https://github.com/globmoro/globmoro-backend

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/inquiries` | Submit contact form |

### `POST /api/inquiries`

JSON body:

```json
{
  "name": "Fatima Alaoui",
  "company": "Atlas Logistics",
  "phone": "+212600000000",
  "email": "fatima@example.com",
  "message": "Interested in a Linde electric forklift.",
  "machineInterest": "linde"
}
```

`machineInterest` must be one of: `linde` | `toyota` | `both` | `other`.

Success: `201` `{ "ok": true, "id": "<uuid>" }`  
Validation error: `400` with field details (no PII echoed back wholesale).

v1 stores inquiries in memory and appends to `data/inquiries.jsonl` (best-effort). No Postgres yet.

## Frontend usage

```ts
await fetch(`${import.meta.env.VITE_API_URL}/api/inquiries`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name,
    company,
    phone,
    email,
    message,
    machineInterest, // "linde" | "toyota" | "both" | "other"
  }),
});
```

Set the frontend env to your deployed API origin (e.g. `https://api.globmoro.com`).

## Local development

```bash
cp .env.example .env
npm install
npm run dev          # tsx watch on PORT (default 3000)
# or
npm run build && npm start
```

## Environment

See `.env.example`. Important vars:

- `PORT` — listen port (EasyPanel sets this)
- `CORS_ORIGINS` — comma-separated allowed frontend origins
- `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` — light per-IP limit on inquiries

No secrets are required for v1. Never commit `.env`.

## EasyPanel

- **GitHub repo:** `https://github.com/globmoro/globmoro-backend` (no trailing hyphen)
- **Branch:** `main`
- **Build path:** `.` (repo root)
- **Start:** `npm start` (runs after `npm run build` via Dockerfile, or Nixpacks detect `build` + `start`)
- **Port:** use the platform `PORT` env (Dockerfile exposes `3000`)
- Set `CORS_ORIGINS` to your frontend URL(s), e.g. `https://globmoro.com,https://www.globmoro.com`

Dockerfile is included for container deploys. Nixpacks also works: install → `npm run build` → `npm start`.
