# Euroshub Kitchen — Comprehensive Repository Audit (Phase 0)

**Date of Audit:** September 8, 2026  
**Auditor:** Antigravity Autonomous Agent  
**Target Repository:** `c:/Users/HEX/Desktop/Euroshub Restraunt`  
**Purpose:** Pre-transformation audit and classification of all existing subsystems for Euroshub Kitchen (Pakistani fast-food restaurant platform based in Saddar, Rawalpindi).

---

## 1. Monorepo & Project Structure
- **Package Manager:** npm (v10+ / Node.js v24.16.0)
- **Workspaces:** Configured in root `package.json`:
  - `apps/api` (Backend Express TypeScript service)
  - `apps/web` (Frontend Vite React TypeScript application)
- **Root Scripts:** `dev`, `dev:api`, `dev:web`, `build`, `test`, `db:migrate`, `db:seed`, `db:studio`, `db:setup:windows`, `db:start:windows`
- **Shared Code:** Types duplicated or manually aligned between `apps/api/src/types` and `apps/web/src/types`.
- **Classification:** **KEEP & ENHANCE** (maintain the lightweight two-workspace monorepo; add a shared currency formatter and types).

---

## 2. Frontend Stack
- **Core:** React 18.3.1, TypeScript 5.5.4, Vite 5.3.4 (`@vitejs/plugin-react`)
- **Routing:** `react-router-dom` v6.25.1 with nested route layouts (`PublicLayout`, `AccountLayout`, `AdminLayout`) and guards (`RequireAuth`, `RequireAdmin`)
- **State Management:** `@tanstack/react-query` v5.51.11 for server queries, caching, and polling; React Context for `AuthContext` and `CartContext`
- **Styling:** Tailwind CSS 3.4.7 with `@tailwindcss/forms` typography and custom bistro color palette
- **Component Library:** Hand-crafted UI kit in `apps/web/src/components/ui/` (`Badge`, `Button`, `Card`, `EmptyState`, `Input`, `Modal`, `Select`, `Skeleton`, `Table`, `Textarea`, `Timeline`)
- **Charts & Notifications:** `recharts` v2.12.7 (Admin analytics), `sonner` v1.5.0 (toasts), `lucide-react` v0.417.0 (icons)
- **Forms & Validation:** `react-hook-form` v7.52.1 + `@hookform/resolvers` + `zod` v3.23.8
- **Classification:** **KEEP & MODIFY** (stack is modern and robust; needs styling and copy alignment from European bistro to Pakistani fast-food, currency shift to `Rs.`, removal of fake marketing claims, and variant/addon selector integration).

---

## 3. Backend Stack
- **Runtime & Framework:** Node.js + Express 4.19.2 + TypeScript 5.5.4
- **Dev Runner:** `tsx` watch mode on `apps/api/src/server.ts`
- **Build Output:** Compiled via `tsc` to CommonJS in `apps/api/dist/`
- **Middleware:** `cors`, `cookie-parser`, `express.json`, `express-rate-limit` (auth endpoints), custom error handler in `src/middleware/error.ts`
- **Current Port:** `5000` (proxied by Vite on port `5173` via `/api` and `/uploads`)
- **Classification:** **KEEP & MODIFY** (clean Express architecture; needs schema migrations for variants, addons, tables, social links, and Supabase integration).

---

## 4. Database Layer
- **Current Engine:** PostgreSQL 16.3 (running locally via portable binary cluster in `.postgres/`)
- **ORM:** Prisma ORM 5.17.0 (`@prisma/client` 5.22.0)
- **Supabase Status:** Currently not configured; connection string in `.env` points to local Postgres (`postgresql://postgres:postgrespassword@localhost:5432/euroshub_kitchen?schema=public`).
- **Classification:** **MODIFY** (Prisma can target Supabase PostgreSQL directly with connection pooling; schema needs migration to support variants, addons, tables, social links, and review moderation statuses).

---

## 5. Authentication
- **Current Strategy:** Custom JWT auth:
  - Access token: short-lived (15 min), signed with `JWT_ACCESS_SECRET`, passed via `Authorization: Bearer <token>`
  - Refresh token: long-lived (7 days), signed with `JWT_REFRESH_SECRET`, stored in `httpOnly`, `sameSite: 'lax'` cookie
  - Endpoint: `/api/auth/refresh`
- **Password Hashing:** `bcryptjs` (salt rounds 10)
- **User Roles:** `Role` enum on `User` model (`ADMIN`, `CUSTOMER`)
- **Classification:** **KEEP & ENHANCE** (works reliably; add Supabase Auth compatibility or maintain the bulletproof JWT/httpOnly cookie authentication while linking to `profiles`).

---

## 6. Authorization & RBAC
- **Backend Protection:**
  - `authenticateJWT`: verifies Bearer access token
  - `requireAdmin`: rejects any user where `role !== 'ADMIN'` with 403
  - Customer ownership checks: validates `resource.customerId === req.user.userId || req.user.role === 'ADMIN'`
- **Frontend Route Guards:**
  - `RequireAuth`: redirects unauthenticated users to `/login`
  - `RequireAdmin`: redirects non-admin users to `/account`
- **Classification:** **KEEP** (solid server-side re-validation on every protected endpoint).

---

## 7. API Structure
- **Auth Routes (`/api/auth`):**
  - `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- **Menu Routes (`/api`):**
  - `GET /menu-categories`, `GET /menu/categories`
  - `GET /menu-items`, `GET /menu/items`, `GET /menu-items/:id`, `GET /menu/items/:id`
  - `GET /admin/menu-items`, `POST /admin/menu-items`, `PUT /admin/menu-items/:id`, `DELETE /admin/menu-items/:id`
  - `POST /admin/menu-categories`, `PUT /admin/menu-categories/:id`, `DELETE /admin/menu-categories/:id`
- **Order Routes (`/api`):**
  - `POST /orders` (server-side price calculation)
  - `GET /orders`, `GET /orders/:id`
  - `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`
- **Reservation Routes (`/api`):**
  - `POST /reservations`, `GET /reservations`
  - `GET /admin/reservations`, `PATCH /admin/reservations/:id`, `PATCH /admin/reservations/:id/status`
- **Review Routes (`/api`):**
  - `GET /reviews` (public, approved only)
  - `POST /reviews` (customer, completed order only)
  - `GET /customer/reviews`, `GET /admin/reviews`, `PATCH /admin/reviews/:id`, `PATCH /admin/reviews/:id/visibility`
- **Settings Routes (`/api`):**
  - `GET /settings`, `PUT /admin/settings`
- **Admin Management Routes (`/api/admin`):**
  - `GET /customers`, `GET /customers/:id`, `GET /users`
  - `GET /dashboard`, `GET /analytics/overview`, `GET /analytics/revenue`
- **Upload Routes (`/api`):**
  - `POST /upload`
- **Classification:** **KEEP & MODIFY** (extend menu endpoints to handle `ProductVariant` and `ProductAddon`, add table management endpoints for tables 01–100, and social links endpoints).

---

## 8. Database Schema
Existing models in `apps/api/prisma/schema.prisma`:
- `User` (id, email, passwordHash, name, phone, role, createdAt, updatedAt)
- `MenuCategory` (id, name, sortOrder, createdAt, updatedAt)
- `MenuItem` (id, name, description, price, imageUrl, ingredients, tags, isAvailable, isFeatured, isPopular, categoryId)
- `Order` (id, orderNumber, customerId, type, status, subtotal, deliveryFee, total, deliveryAddress, deliveryNotes, tableNumber, contactPhone, paymentMethod)
- `OrderItem` (id, orderId, menuItemId, nameAtPurchase, priceAtPurchase, quantity)
- `Reservation` (id, customerId, date, partySize, notes, status)
- `Review` (id, customerId, orderId, rating, comment, isHidden)
- `RestaurantSettings` (id="singleton", name, description, phone, email, address, openingHours, deliveryEnabled, deliveryFee, tableCount)
- **Gaps identified against new spec:**
  - `MenuItem` only has flat `price`; lacks `ProductVariant` (e.g. Small/Medium/Large/Family for pizzas, Single/Double for burgers) and `ProductAddon` (e.g. extra dips, cheese, etc.).
  - `OrderItem` lacks `variantNameAtPurchase`, `unitPriceAtPurchase`, and `addonsSnapshot`.
  - Lacks dedicated `Table` model (tables 01–100 with capacity, active status).
  - Lacks `SocialLink` model (Facebook, Instagram, TikTok, WhatsApp).
  - Lacks `isChefSpecial`, `sortOrder`, and soft-delete (`deletedAt`) on menu items.
  - Review moderation status is boolean `isHidden` rather than moderation enum (`PENDING`, `APPROVED`, `HIDDEN`).
- **Classification:** **MODIFY** (evolve schema to support variants, addons, tables, social links, and review moderation).

---

## 9. Migrations
- Currently managed via `prisma db push`.
- **Classification:** **MODIFY** (generate baseline migration or use Prisma migrations compatible with Supabase PostgreSQL).

---

## 10. Seed Data & Fake Content Analysis
- **Current Seed Content:**
  - Identity: French/Italian European bistro, "42 Boulevard Saint-Michel, Grand Plaza, Suite 100", "+1 (555) 387-6748", fake European culinary heritage.
  - Menu Items: 34 dishes including "Wild Mushroom Tagliatelle", "Truffle Arancini", "Slow-Braised Short Rib", "Duck Confit".
  - Customers: Fake names ("Marco Rossi", "Sophie Laurent").
  - Reviews: Fake 5-star testimonials ("Superb dining experience...").
  - Currency: `€` (Euros) and `$` (Dollars) scattered arbitrarily.
- **Spec Violations:**
  - Must be Pakistani fast-food based in Kohistan Tower, Saddar, Rawalpindi.
  - Must use only the 12 specified items (BBQ Pizza, Hot & Spicy Pizza, Crown Crust Pizza, Cheezy Pizza, Vegetable Pizza, Reggy Burger, Bazinga Burger, Euro Sandwich, Mexican Sandwich, Mayo Dip, Water Bottle, Fries) with their exact variant pricing.
  - Currency must be `PKR` formatted as `Rs. 700` via a central utility.
  - Zero fake reviews, fake ratings, or fake popularity rankings.
- **Classification:** **REMOVE/REPLACE** (complete replacement of seed data and removal of hardcoded European bistro copy).

---

## 11. Tests Baseline
- **Vitest Unit/Integration Suite:** 20/20 tests passing in `apps/api/tests/api.test.ts`.
- **E2E Simulation Suite:** 13/13 steps passing in `scripts/e2e-validate.mjs`.
- **Classification:** **KEEP & EXTEND** (preserve baseline, add tests for variants, addons, tables, social links, RLS/auth denials, and data honesty).

---

## 12. UI Inventory & Currency Audit
- **Currency Symbols:**
  - Found hardcoded `€` in `AdminDashboardPage`, `AdminMenuPage`, `AdminOrderDetailPage`, `AdminOrdersPage`, `AdminSettingsPage`.
  - Found hardcoded `$` in `HomePage`, `MenuPage`, `DishDetailPage`, `CartPage`, `CheckoutPage`, `OrderConfirmationPage`, `OrderHistoryPage`, `OrderDetailPage`.
- **Hardcoded Copy:**
  - `HomePage.tsx`: "Artisanal European Bistro", "Centuries of European culinary mastery", hardcoded European reviews carousel, hardcoded fake "Wood-Fired Ribeye".
  - `AboutPage.tsx`: "Our European Heritage", fake family lineage, fake awards.
  - `ContactPage.tsx`: French address and US phone placeholder.
  - `PublicLayout.tsx`: French address, US phone.
- **Order Types in Checkout:**
  - Currently exposes `DELIVERY` alongside `DINE_IN` and `TAKEAWAY`. Must be strictly restricted to `DINE_IN` and `TAKEAWAY` while delivery is disabled.
  - Must incorporate table selection from the 100 seeded tables (01–100) for Dine-In orders.
- **Classification:** **MODIFY** (introduce unified `formatCurrency` helper, replace all hardcoded copy with DB-driven settings, update Dine-In checkout with table selection, and gate delivery UI).

---

## 13. Image Handling
- Local file upload via Multer to `/uploads` directory.
- Seed data uses Unsplash URLs.
- **Classification:** **MODIFY** (support Supabase Storage bucket `product-images` and `logo` with local static fallback; replace images with genuinely matching Pakistani fast-food photos: pizzas, burgers, sandwiches, fries, mayo dip, water bottle, and a horse-themed logo).

---

## 14. Existing Admin Functionality
- Dashboard: Overview stats, 7-day revenue bar chart, recent orders & reservations.
- Menu Management: Create/edit dish, inline availability toggle, delete.
- Category Management: Create/edit category, sort order.
- Orders: Order list with filters, detail view, valid status transition buttons.
- Reservations: Reservation list, status updates (confirm/cancel).
- Customers: Customer directory with order count & lifetime spend.
- Reviews: Moderation list with visibility toggle.
- Settings: Restaurant identity, opening hours, delivery fee, table count.
- **Gaps:** Lacks variant pricing editor, addon management, table management (01–100), and social links management.
- **Classification:** **MODIFY & EXPAND** (enhance existing admin screens with variants, addons, tables, social links, and honest empty states).

---

## 15. Existing Customer Functionality
- Browsing: Home, menu with categories/search/sort, dish detail.
- Cart: Client-side persistent cart with add/remove/quantity.
- Checkout: Customer info, order type selector, Pay at Restaurant demo payment.
- Tracking: Order confirmation, timeline tracking with polling.
- Account: Orders, reservations, review submission on completed orders.
- **Gaps:** Lacks variant selection (e.g. Small/Medium/Large/Family), lacks addons selection, lacks table selection (01–100) for Dine-In, exposes Delivery when it should be disabled.
- **Classification:** **MODIFY & ENHANCE**.

---

## 16. Environment Configuration
- Variables in `.env`:
  - `DATABASE_URL`: local PostgreSQL
  - `PORT`: 5000
  - `NODE_ENV`: development
  - `FRONTEND_URL`: http://localhost:5173
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- **Secrets leak check:** No backend secrets (`JWT_SECRET`, database password) are bundled into the Vite frontend build.
- **Classification:** **KEEP & EXPAND** (add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` with placeholder values in `.env.example`).

---

## 17. Deployment Configuration
- Vite build produces optimized production bundle in `apps/web/dist`.
- API compiles via `tsc` to `apps/api/dist`.
- Documented paths for Vercel/Netlify (frontend), Render/Railway (API), and Supabase/Neon (database).
- **Classification:** **KEEP**.

---

## 18. Subsystem Classification Matrix

| Subsystem | Current State | Classification | Action Required |
|-----------|---------------|----------------|-----------------|
| **Monorepo Architecture** | npm workspaces (`api`, `web`) | **KEEP** | Maintain clean structure |
| **Frontend UI Core** | React 18, Vite, Tailwind | **KEEP** | Standardize components |
| **Design Tokens** | Bistro Charcoal/Terracotta/Olive | **KEEP** | Adapt to modern fast-food branding |
| **Currency Display** | Scattered `$` and `€` | **REMOVE/REPLACE** | Replace with shared `formatCurrency` (`Rs. 700`) |
| **Restaurant Identity** | European bistro (Paris, France) | **REMOVE/REPLACE** | Replace with Saddar, Rawalpindi, Kohistan Tower |
| **Menu Items & Pricing** | 34 French/Italian dishes | **REMOVE/REPLACE** | Replace with exact 12 Pakistani fast-food items & variants |
| **Product Variants & Addons** | Flat price only | **MODIFY** | Add `ProductVariant` & `ProductAddon` models & UI |
| **Table Management** | Flat table integer | **MODIFY** | Add `Table` model (01–100) & selection in Dine-In checkout |
| **Delivery Flow** | Enabled by default | **MODIFY** | Gate off customer UI while disabled; Dine-in & Takeaway only |
| **Social Links** | Hardcoded/placeholder links | **MODIFY** | Add `SocialLink` DB model & conditional public rendering |
| **Reviews & Ratings** | Seeded fake reviews & ratings | **REMOVE/REPLACE** | Remove all fake reviews; honest empty states ("No reviews yet") |
| **Chef Special / Popular** | Hardcoded flags & fake labels | **REMOVE/REPLACE** | Render only with real admin flags / verified orders |
| **Logo & Imagery** | Generic bistro photos | **MODIFY** | Provide horse-themed logo & matching fast-food imagery |
| **Auth & RBAC** | JWT + roles (ADMIN, CUSTOMER) | **KEEP & ENHANCE** | Integrate with Supabase Auth / profiles |
| **Database ORM** | Prisma + PostgreSQL | **KEEP & MODIFY** | Update Prisma schema with new models & migrations |
| **Storage** | Local disk `/uploads` | **MODIFY** | Add Supabase Storage provider with local fallback |
| **Test Suite** | 20 Vitest + 13 E2E | **KEEP & EXPAND** | Preserve pass baseline, add variant/addon/table tests |
| **Documentation** | European bistro README | **MODIFY** | Rewrite for Supabase & Pakistani fast-food platform |

---
*End of Phase 0 Repository Audit.*
