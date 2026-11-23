# Deployment Environment Variables

Real values live only in `apps/api/.env` (gitignored). Never paste them into this file, commits, or chat.

---

## Render — API (`apps/api`)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://euroshub-restraunt-web.vercel.app` |
| `CORS_ORIGINS` | `https://euroshub-restraunt-web.vercel.app` (no trailing slash; comma-separate if you add more) |
| `DATABASE_URL` | `<Supabase Session pooler URL — see note below>` |
| `JWT_ACCESS_SECRET` | `<copy from apps/api/.env>` |
| `JWT_REFRESH_SECRET` | `<copy from apps/api/.env>` |
| `JWT_ACCESS_EXPIRES_IN` | `<copy from apps/api/.env>` (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | `<copy from apps/api/.env>` (default `7d`) |
| `SUPABASE_URL` | `<copy from apps/api/.env>` |
| `SUPABASE_ANON_KEY` | `<copy from apps/api/.env>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<copy from apps/api/.env>` |
| `SUPABASE_STORAGE_BUCKET_PRODUCTS` | `<copy from apps/api/.env>` |
| `SUPABASE_STORAGE_BUCKET_LOGO` | `<copy from apps/api/.env>` |

**Do not set `PORT`** — Render sets it automatically and the API reads it.

### Optional

| Variable | When |
|---|---|
| `ADMIN_SEED_PASSWORD` | Only read by `prisma/seed.ts`. Set it only if you run the seed on Render; otherwise leave it out. |
| `COOKIE_SAMESITE` | `strict` or `lax` to override the automatic refresh-cookie SameSite choice. |

### Notes

- **`DATABASE_URL` must be the Supabase Session pooler string**, not the direct `db.<ref>.supabase.co` host.
  The direct host is IPv6-only and Render cannot reach IPv6. Get it from Supabase → **Connect** → **Session pooler**
  (host looks like `aws-0-<region>.pooler.supabase.com`, port `5432`, user `postgres.<project-ref>`).
- Production startup validation (`apps/api/src/config/index.ts`) fails the boot if `DATABASE_URL` is missing,
  or if either JWT secret is shorter than 32 characters, or if the two JWT secrets are identical.
- If `CORS_ORIGINS` is unset in production, **no** origins are allowed.
- Migrations: `0_init` was marked applied and `add_refresh_token` deployed on the live database on 2026-11-23
  (`prisma migrate status`: up to date). It is now safe to run `npx prisma migrate deploy` in the Render build for
  future migrations. Never run `migrate reset`, `migrate dev` or `db push` against this database.

---

## Vercel — Web (`apps/web`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | See below |

`VITE_API_BASE` is accepted as a fallback name; only set one of them.

- **Recommended: leave `VITE_API_URL` empty.** The app then calls `/api/...` on its own domain, and `vercel.json`
  rewrites that to `https://euroshub-restraunt-1.onrender.com`. Requests stay same-site, so the refresh-token
  cookie is sent.
- If set to `https://euroshub-restraunt-1.onrender.com`, the browser calls Render directly (cross-site,
  `vercel.app` → `onrender.com`). The API only issues `SameSite=Strict`/`Lax` cookies, which browsers do not send
  on cross-site fetches, so token refresh / staying logged in will break.
- `apps/web/.env.production` (committed) sets `VITE_API_URL=` (empty) so the build uses the proxy. Make sure no
  `VITE_API_URL` is set in the Vercel dashboard either, since dashboard values override the file.
- `VITE_*` values are baked in at build time — redeploy on Vercel after changing them. Never put secrets in `VITE_*`.
