# CHANGES.md — Euroshub Kitchen Security & Architecture Audit

Generated: 2026-11-20

---

## Task 1 — Remove Hardcoded Secrets & Add Startup Validation

### What Changed
- **`apps/api/src/config/index.ts`** — Deleted all fallback/hardcoded values for
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SUPABASE_URL`, and
  `SUPABASE_SERVICE_ROLE_KEY` (the `eyJ...` Supabase service-role key string is gone).
  The anon-key fallback for the service-role key was removed; the service-role key never
  falls back to the anon key.
  Added `validateConfig()` using Zod:
  - **Production**: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` required, ≥ 32 characters,
    must be distinct; `DATABASE_URL` required; Supabase vars required only when uploading.
  - **Development**: Supabase vars optional (uploads fall back to local disk).
  Process exits with a clear error list on failure.
- **`.env.example`** — Updated with safe placeholders and a comment showing how to generate
  secrets: `openssl rand -base64 48`.

### Verification
- `git grep "eyJhbGci"` → **0 hits** in the working tree.
- `apps/api/tests/config.test.ts` — **6/6 tests pass**.

---

## Task 2 — CORS Allow-list & Security Headers

### What Changed
- **`apps/api/src/app.ts`**:
  - Replaced the CORS origin function with one that reads a comma-separated
    `CORS_ORIGINS` environment variable.
  - Removed `origin.endsWith(".vercel.app")` wildcard and the "allow everything
    in non-production" rule.
  - In development, defaults to `http://localhost:5173` when `CORS_ORIGINS` is unset.
  - In production, an empty allow-list blocks all cross-origin requests if `CORS_ORIGINS`
    is not set.
  - Added `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })`.
  - Added `express.json({ limit: "1mb" })`.
- **`apps/api/package.json`** — Added `helmet@^8.3.0` to `dependencies`.

### Verification
- `apps/api/tests/cors-headers.test.ts` — **4/4 tests pass**.

---

## Task 3 — Refresh-Token Revocation

### What Changed
- **`apps/api/prisma/schema.prisma`** — Added `RefreshToken` model:
  `id`, `userId`, `tokenHash` (unique), `expiresAt`, `revokedAt`, `replacedById`,
  `createdAt`.
- **`apps/api/prisma/migrations/20261120000001_add_refresh_token/migration.sql`** —
  Migration SQL for the new table.
- **`apps/api/src/services/token.service.ts`** — New service:
  - `hashToken(token)` — SHA-256 hash stored in DB; raw token never persisted.
  - `createAndSaveRefreshToken(userId, payload)` — Signs JWT with
    `jti: crypto.randomUUID()` to prevent same-second hash collisions; stores hash + expiry.
  - `setRefreshTokenCookie(res, token)` — Sets `HttpOnly`, `Secure` (production),
    `Path=/api/auth`, 7-day `maxAge` cookie.
  - `SameSite` strategy: `strict` when `API_DOMAIN` and `WEB_DOMAIN` env vars match
    (same site), `lax` when they differ. In production cross-site deployments
    (e.g. Vercel → Render) browsers strip cookies on cross-site requests when
    `SameSite=strict`, so `lax` is required. `lax` is documented in code with this reason.
- **`apps/api/src/controllers/auth.controller.ts`** — Updated:
  - `register` / `login`: Create a `RefreshToken` record on each authentication.
  - `refresh`: Verifies JWT, looks up hash, rejects revoked/expired tokens.
    **Reuse detection**: if a revoked token is presented, all active tokens for that user
    are immediately revoked (stolen-token protection). Issues new access token with role
    reloaded from DB.
  - `logout`: Revokes the current refresh token by hash.
  - `changePassword` / `updateProfile` (when changing password): Revokes all tokens for
    the user.

### Verification
- `apps/api/tests/refresh-token.test.ts` — **5/5 tests pass**.

---

## Task 4 — In-Memory Access Token Storage

### What Changed
- **`apps/web/src/api/client.ts`**:
  - Removed all `localStorage.getItem/setItem/removeItem` calls for the access token.
  - Added `inMemoryAccessToken` module variable with `getAccessToken()` / `setAccessToken()`
    accessors.
  - The 401 → refresh → retry interceptor now uses `setAccessToken` to store the new
    access token from `/api/auth/refresh`.
- **`apps/web/src/context/AuthContext.tsx`**:
  - On app mount calls `GET /api/auth/refresh` to restore the session from the
    httpOnly refresh-token cookie, then stores the returned access token in memory.

### Verification
- `npm run build --workspace=apps/web` — TypeScript type-check and Vite production build
  pass (2462 modules, `✓ built in 6.92s`).

---

## Task 5 — Admin Account Safety & Change-Password Endpoint

### What Changed
- **`apps/api/prisma/seed.ts`**:
  - Requires `ADMIN_SEED_PASSWORD` environment variable; exits with a clear message if
    missing.
  - When the admin user already exists, does **not** overwrite `passwordHash` or `role`
    (only non-sensitive fields like `name` are updated).
- **`apps/api/prisma/seed.js`** — Deleted (replaced entirely by the TypeScript version).
- **`apps/api/src/controllers/auth.controller.ts`** — Added `changePassword` handler:
  verifies current password, hashes new password (min 10 chars), revokes all refresh
  tokens, clears cookie.
- **`apps/api/src/schemas/auth.schema.ts`** — Re-exports `changePasswordSchema` from
  `@euroshub/shared`.
- **`apps/api/src/routes/auth.routes.ts`** — Added `PUT /api/auth/password` route with
  `authenticateJWT` + `validateBody(changePasswordSchema)`.
- **`apps/web/src/components/auth/ChangePasswordCard.tsx`** — New component: form with
  current-password and new-password fields (min 10 chars), calls `PUT /api/auth/password`.
- **`apps/web/src/pages/AccountOverviewPage.tsx`** — Embeds `<ChangePasswordCard />`.
- **`apps/web/src/pages/admin/AdminSettingsPage.tsx`** — Embeds `<ChangePasswordCard />`.
- **`README.md`** — Removed hardcoded admin credentials.

### Verification
- `apps/api/tests/admin-safety.test.ts` — **4/4 tests pass**.

---

## Task 6 — Prisma Migration Baseline

### What Changed
- **`apps/api/prisma/migrations/0_init/migration.sql`** — Baseline SQL snapshot of the
  full schema (generated via `prisma migrate diff --from-empty --to-schema-datamodel`).
- **`apps/api/prisma/migrations/20261120000001_add_refresh_token/migration.sql`** —
  Incremental migration adding the `RefreshToken` table.
- **`apps/api/package.json`** — Added `db:deploy` script (`prisma migrate deploy`);
  `db:migrate` already present (`prisma migrate dev`).
- **Root `package.json`** — Delegates `db:migrate` and `db:deploy` to the API workspace.
- **`README.md`** — Documented `prisma migrate resolve --applied 0_init` for existing
  Supabase databases (run once to mark the baseline as applied without re-running it).
  Stopped recommending `db push` for production.

### Verification
- Migrations applied cleanly to local PostgreSQL 16.3.
- All 82 API tests pass against the migrated database.

---

## Task 7 — Real Opening Hours & Server-Side Enforcement

### What Changed
- **`apps/api/prisma/seed.ts`** — Updated seeded opening hours to `09:00`–`00:00` every
  day (midnight close). Previously `09:00`–`12:00`.
- **`apps/api/src/services/hours.service.ts`** — New service:
  - Reads `RestaurantSettings.openingHours` from DB.
  - Supports closing times after midnight (e.g. a 23:00–02:00 shift).
  - `isRestaurantOpen(now, hours, timezone)` — returns `{ open, opensAt }`.
  - Timezone: `Asia/Karachi` (UTC+5, no DST).
- **`apps/api/src/controllers/order.controller.ts`** — Server-side check on order
  creation; returns `422 RESTAURANT_CLOSED` with a friendly message if outside hours.
- **`apps/api/src/controllers/reservation.controller.ts`** — Server-side check on
  reservation creation; returns `422 OUTSIDE_OPENING_HOURS` with a friendly message.
- **`apps/web/src/utils/hours.ts`** — Client-side `isOpen()` / `nextOpenTime()` helpers.
- **`apps/web/src/layouts/PublicLayout.tsx`** — Top banner shows `"Closed now — opens at
  HH:MM"` when outside hours.
- **`apps/web/src/pages/CheckoutPage.tsx`** — Disables checkout and shows closed message
  while outside hours.
- **`README.md`**, **`apps/web/src/pages/HomePage.tsx`**,
  **`apps/web/src/pages/AboutPage.tsx`**, **`apps/web/src/pages/ContactPage.tsx`** —
  Updated operating hours text to `09:00–00:00 daily`.

### Verification
- `apps/api/tests/opening-hours.test.ts` — **8/8 tests pass** (including midnight edge
  cases: 23:50, 00:01, 00:30 after midnight).
- `apps/api/tests/reservation.test.ts` — **28/28 tests pass**.

---

## Task 8 — Upload File-Signature Verification

### What Changed
- **`apps/api/src/controllers/upload.controller.ts`**:
  - Added `verifyImageSignature(buffer)` checking magic bytes:
    - JPEG: `FF D8 FF`
    - PNG: `89 50 4E 47 0D 0A 1A 0A`
    - WebP: `52 49 46 46 … 57 45 42 50`
  - Rejects files whose magic bytes don't match a supported format with `400
    INVALID_FILE_TYPE` (even if `file.mimetype` says otherwise — prevents MIME spoofing).
  - In **production**: Supabase Storage is required; returns `500
    STORAGE_CONFIGURATION_ERROR` if Supabase is not configured, `520 SUPABASE_UPLOAD_FAILED`
    if the upload fails.
  - In **development**: Falls back to local disk at `apps/api/uploads/`.
- **`apps/api/src/routes/upload.routes.ts`** — Added `POST /api/upload` alias alongside
  the existing `POST /api/admin/upload`.

### Verification
- `apps/api/tests/upload.test.ts` — **7/7 tests pass**.

> [!NOTE]
> Live Supabase Storage connectivity was **not** tested — genuine Supabase credentials are
> required for a live call and are not available in this environment. The production path
> (config check + Supabase client calls) is verified by unit tests that mock the Supabase
> client and by code review.

---

## Task 9 — Shared Types Package (`packages/shared`)

### What Changed
- **`packages/shared/`** — New workspace package `@euroshub/shared`:
  - `src/types.ts` — All shared TypeScript interfaces and type aliases previously
    duplicated across `apps/api/src/types` and `apps/web/src/types`:
    `Role`, `OrderType`, `OrderStatus`, `ReservationStatus`, `JwtPayload`, `User`,
    `MenuItem`, `Order`, `Reservation`, `Review`, `CartItem`, `RestaurantSettings`, etc.
  - `src/schemas.ts` — All Zod schemas previously duplicated:
    `registerSchema`, `loginSchema`, `changePasswordSchema`, `createOrderSchema`,
    `createReservationSchema`, `createReviewSchema`, `updateSettingsSchema`, and others.
  - `src/index.ts` — Re-exports everything from both files.
  - `tsconfig.json` — Compiles to `dist/` as CommonJS with `.d.ts` declarations.
  - `package.json` — `name: "@euroshub/shared"`, `main: "dist/index.js"`,
    `types: "dist/index.d.ts"`.
- **Root `package.json`**:
  - Added `"packages/*"` to `workspaces`.
  - Updated `build` script to compile `packages/shared` first, then generate Prisma
    client, then build `apps/api` and `apps/web`.
- **`apps/api/package.json`** and **`apps/web/package.json`** — Added
  `"@euroshub/shared": "*"` dependency.
- **`apps/api/src/types/index.ts`** — Re-exports everything from `@euroshub/shared`;
  keeps the Express-specific `AuthRequest` interface locally.
- **`apps/web/src/types/index.ts`** — Re-exports everything from `@euroshub/shared`.
- **`apps/api/src/schemas/*.ts`** — Each file re-exports the matching schemas from
  `@euroshub/shared` instead of defining them locally.
- **`apps/api/src/middleware/validate.ts`** — Updated to use a duck-type `isZodError()`
  guard in addition to `instanceof ZodError`. This handles the ESM/CJS module-instance
  boundary between Vitest's ESM test runner and the CJS-compiled `@euroshub/shared`
  package (Zod 3.25.x ships both ESM and CJS; they can be different module instances in
  the same process).

### Verification
- `npm run build --workspace=packages/shared` — `tsc` succeeds, `dist/` generated.
- All 82 API tests pass with schemas sourced from `@euroshub/shared`.
- `npm run build --workspace=apps/web` — TypeScript type-check passes; Vite builds
  `dist/` successfully (2462 modules, `✓ built in 6.92s`).

---

## Files Changed (Complete List)

| File | Change |
|------|--------|
| `apps/api/src/config/index.ts` | Removed hardcoded secrets; added Zod startup validation |
| `apps/api/src/app.ts` | CORS allow-list from env; helmet; 1 MB body limit |
| `apps/api/src/middleware/validate.ts` | Duck-type ZodError guard for ESM/CJS compat |
| `apps/api/src/middleware/error.ts` | No change (existing handler) |
| `apps/api/src/services/token.service.ts` | **New** — refresh-token hash, rotation, cookie helpers |
| `apps/api/src/services/hours.service.ts` | **New** — opening-hours check with midnight support |
| `apps/api/src/controllers/auth.controller.ts` | Token revocation; changePassword; reuse detection |
| `apps/api/src/controllers/order.controller.ts` | 422 on outside-hours order creation |
| `apps/api/src/controllers/reservation.controller.ts` | 422 on outside-hours reservation |
| `apps/api/src/controllers/upload.controller.ts` | Magic-byte verification; production Supabase requirement |
| `apps/api/src/routes/auth.routes.ts` | Added PUT /api/auth/password |
| `apps/api/src/routes/upload.routes.ts` | Added POST /api/upload alias |
| `apps/api/src/schemas/auth.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/schemas/menu.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/schemas/order.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/schemas/reservation.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/schemas/review.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/schemas/settings.schema.ts` | Re-exports from @euroshub/shared |
| `apps/api/src/types/index.ts` | Re-exports from @euroshub/shared; keeps AuthRequest |
| `apps/api/prisma/schema.prisma` | Added RefreshToken model |
| `apps/api/prisma/seed.ts` | ADMIN_SEED_PASSWORD required; no overwrite of existing admin |
| `apps/api/prisma/seed.js` | **Deleted** |
| `apps/api/prisma/migrations/0_init/migration.sql` | **New** — baseline migration |
| `apps/api/prisma/migrations/20261120000001_add_refresh_token/migration.sql` | **New** |
| `apps/api/tests/config.test.ts` | **New** — 6 tests for startup validation |
| `apps/api/tests/cors-headers.test.ts` | **New** — 4 tests for CORS and headers |
| `apps/api/tests/refresh-token.test.ts` | **New** — 5 tests for token rotation/revocation |
| `apps/api/tests/admin-safety.test.ts` | **New** — 4 tests for admin safety and password change |
| `apps/api/tests/opening-hours.test.ts` | **New** — 8 tests including midnight edge cases |
| `apps/api/tests/upload.test.ts` | **New** — 7 tests for signature verification |
| `apps/api/package.json` | Added helmet; @euroshub/shared dep; db:deploy script |
| `apps/web/src/api/client.ts` | In-memory access token; removed localStorage |
| `apps/web/src/context/AuthContext.tsx` | Session restore on app load via /api/auth/refresh |
| `apps/web/src/types/index.ts` | Re-exports from @euroshub/shared |
| `apps/web/src/utils/hours.ts` | **New** — client-side opening-hours helpers |
| `apps/web/src/layouts/PublicLayout.tsx` | "Closed now — opens at" banner |
| `apps/web/src/pages/CheckoutPage.tsx` | Blocks checkout when closed |
| `apps/web/src/pages/HomePage.tsx` | Updated operating hours text |
| `apps/web/src/pages/AboutPage.tsx` | Updated operating hours text |
| `apps/web/src/pages/ContactPage.tsx` | Updated operating hours text |
| `apps/web/src/pages/AccountOverviewPage.tsx` | Embeds ChangePasswordCard |
| `apps/web/src/pages/admin/AdminSettingsPage.tsx` | Embeds ChangePasswordCard |
| `apps/web/src/components/auth/ChangePasswordCard.tsx` | **New** — change-password form |
| `apps/web/package.json` | Added @euroshub/shared dep |
| `packages/shared/package.json` | **New** package |
| `packages/shared/tsconfig.json` | **New** |
| `packages/shared/src/types.ts` | **New** — all shared types |
| `packages/shared/src/schemas.ts` | **New** — all shared Zod schemas |
| `packages/shared/src/index.ts` | **New** — barrel export |
| `package.json` (root) | Added packages/* workspace; sequential build script |
| `.env.example` | Updated with placeholders and secret-generation instructions |
| `README.md` | Removed credentials; added migration docs; updated hours |

---

## Test Summary

| Suite | Tests | Status |
|-------|-------|--------|
| `tests/config.test.ts` | 6 | ✅ All pass |
| `tests/cors-headers.test.ts` | 4 | ✅ All pass |
| `tests/refresh-token.test.ts` | 5 | ✅ All pass |
| `tests/admin-safety.test.ts` | 4 | ✅ All pass |
| `tests/opening-hours.test.ts` | 8 | ✅ All pass |
| `tests/upload.test.ts` | 7 | ✅ All pass |
| `tests/reservation.test.ts` | 28 | ✅ All pass |
| `tests/api.test.ts` | 20 | ✅ All pass |
| **Total** | **82** | **✅ 82/82** |

---

## Known Limitations / Items Left Undone

| Item | Reason |
|------|--------|
| **Live Supabase Storage test** | Requires real Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Not available in this environment. The code path is covered by mocked unit tests and code review only. |
| **Code splitting in `apps/web`** | Vite warns that the JS bundle is > 500 KB. This is a performance concern, not a security or correctness issue, and is out of scope for this audit. |
| **Rate limiting on `PUT /api/auth/password`** | The route uses `authenticateJWT` (token required) so brute-force via this endpoint is bounded by token validity. A dedicated rate limiter could be added as a follow-up. |
| **Email verification** | No email-verification flow was added. Out of scope for this audit. |
| **`prisma migrate resolve --applied`** | Cannot be run against the production Supabase database without credentials. Documented in `README.md` with the exact command for the operator to run once. |
