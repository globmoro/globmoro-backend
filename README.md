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
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries`, {
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

Set `NEXT_PUBLIC_API_URL` to the API origin (e.g. `https://api.globmoro.com`, no trailing slash).

## Local development

```bash
cp .env.example .env
npm install
npm run dev          # tsx watch on PORT (default 3000)
# or
npm run build && npm start
```

## Environment

See `.env.example`. No secrets required for v1. Never commit `.env`.

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | yes (EasyPanel) | `3000` |
| `HOST` | no (default `0.0.0.0`) | `0.0.0.0` |
| `NODE_ENV` | yes | `production` |
| `CORS_ORIGINS` | yes | `https://globmoro.com,https://www.globmoro.com` |
| `RATE_LIMIT_MAX` | no | `10` |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` |

## EasyPanel checklist

- [ ] App source: `https://github.com/globmoro/globmoro-backend` (no trailing hyphen)
- [ ] Branch: `main`
- [ ] Build path: `.`
- [ ] Deploy via **Dockerfile** (preferred) or Nixpacks (`npm run build` → `npm start`)
- [ ] Domain: `api.globmoro.com` → this app
- [ ] Env vars (production):

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGINS=https://globmoro.com,https://www.globmoro.com
```

- [ ] Optional: `RATE_LIMIT_MAX=10` / `RATE_LIMIT_WINDOW_MS=60000`
- [ ] Health: Dockerfile `HEALTHCHECK` hits `GET /health` (also use `/health` in EasyPanel health path if prompted)
- [ ] **Volume (jsonl persistence):** mount a persistent volume at `/app/data` so `data/inquiries.jsonl` survives restarts. Without a volume, in-memory + file data is lost on redeploy.
- [ ] Confirm frontend `NEXT_PUBLIC_API_URL=https://api.globmoro.com` and CORS matches FE origins
