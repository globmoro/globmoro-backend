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

v1 stores inquiries in memory and appends to `data/inquiries.jsonl` (best-effort). After a successful store, the API also tries to email the owner via SMTP (nodemailer). **If mail fails or SMTP is misconfigured, the inquiry is still kept and the client still receives `201`** — leads are not lost to SMTP hiccups; failures are logged (`inquiry_email_failed` / `inquiry_email_misconfigured`).

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

Without SMTP env locally, inquiries still save; mail is skipped with log `inquiry_email_skipped_no_smtp`.

## Environment

See `.env.example`. Never commit `.env` or real App Passwords.

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | yes (EasyPanel) | `3000` |
| `HOST` | no (default `0.0.0.0`) | `0.0.0.0` |
| `NODE_ENV` | yes | `production` |
| `CORS_ORIGINS` | yes | `https://globmoro.com,https://www.globmoro.com` |
| `RATE_LIMIT_MAX` | no | `10` |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` |
| `INQUIRY_TO_EMAIL` | no (default `Globmoro@gmail.com`) | `Globmoro@gmail.com` |
| `SMTP_HOST` | for email | `smtp.gmail.com` |
| `SMTP_PORT` | for email | `465` (SSL) or `587` (STARTTLS) |
| `SMTP_SECURE` | for email | `true` for 465; `false` for 587 |
| `SMTP_USER` | for email | Gmail address |
| `SMTP_PASS` | for email | Gmail **App Password** (not account password) |
| `SMTP_FROM` | no (defaults to `SMTP_USER`) | `Globmoro <Globmoro@gmail.com>` |

### Gmail App Password (EasyPanel)

1. Google Account for `Globmoro@gmail.com` → enable **2-Step Verification**.
2. Security → **App passwords** → create one (e.g. “EasyPanel SMTP”).
3. Set EasyPanel env: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=Globmoro@gmail.com`, `SMTP_PASS=<app-password>`, optional `INQUIRY_TO_EMAIL` / `SMTP_FROM`.
4. Alternate: port `587` with `SMTP_SECURE=false` (STARTTLS).

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
INQUIRY_TO_EMAIL=Globmoro@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Globmoro@gmail.com
SMTP_PASS=<gmail-app-password>
```

- [ ] Optional: `RATE_LIMIT_MAX=10` / `RATE_LIMIT_WINDOW_MS=60000` / `SMTP_FROM=...`
- [ ] Health: Dockerfile `HEALTHCHECK` hits `GET /health` (also use `/health` in EasyPanel health path if prompted)
- [ ] **Volume (jsonl persistence):** mount a persistent volume at `/app/data` so `data/inquiries.jsonl` survives restarts. Without a volume, in-memory + file data is lost on redeploy.
- [ ] Confirm frontend `NEXT_PUBLIC_API_URL=https://api.globmoro.com` and CORS matches FE origins
- [ ] After deploy: submit contact form → expect `201` and an email at `INQUIRY_TO_EMAIL`
