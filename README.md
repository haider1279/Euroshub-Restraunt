# Euroshub Kitchen — Pakistani Fast-Food Ordering & Restaurant Management Platform

**Euroshub Kitchen** is a production-grade, full-stack Pakistani fast-food ordering and restaurant-management platform based in **Kohistan Tower, Saddar, Rawalpindi, Office 609**. 

The platform features a modern, responsive web application for dine-in and takeaway customers, an interactive menu catalog with real-time size variant selection, an administrative back-office console with sales analytics, live order fulfillment lifecycle dispatching, dining room table management across 100 tables (`01`–`100`), and Supabase-ready PostgreSQL architecture.

---

## 1. Restaurant Identity & Core Business Principles

- **Location:** Kohistan Tower, Saddar, Rawalpindi, Office 609, Pakistan
- **Operating Hours:** Daily 9:00 AM – 12:00 PM
- **Contact:** `haider1.euroshub@gmail.com`
- **Official Currency:** Pakistani Rupee (`PKR`), formatted consistently across all customer and administrative touchpoints as `Rs. 700` via centralized currency utilities.
- **Ordering Channels:**
  - **Dine-In:** Customers select their specific dining table from 100 configured tables (`01` through `100`).
  - **Takeaway:** Customers pick up fresh orders directly from the restaurant counter.
  - **Delivery Gated Off:** Home delivery is strictly disabled (`deliveryEnabled = false`) and concealed from customer ordering workflows until enabled by the restaurant owner in the Admin Console.
- **Payment Method:** "Pay at Restaurant" (cash/card upon dining or collection).
- **Strict Anti-Fabrication Mandate:**
  - Zero fabricated reviews, testimonials, ratings, or chef claims.
  - Reviews and ratings only render when genuine completed orders have been verified and submitted by customers.
  - Popular items are computed dynamically from real database order aggregation.

---

## 2. System Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │   Vite + React 18 + TypeScript          │
                     │   Tailwind CSS + Euroshub Horse Branding│
                     │   TanStack Query + React Hook Form + Zod│
                     └────────────────────┬────────────────────┘
                                          │ HTTP / JSON API
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │   Node.js + Express + TypeScript API    │
                     │   Server-Side Variant Re-Pricing Engine │
                     │   JWT Bearer Auth + HttpOnly Cookies    │
                     │   Order State Machine & Gating Engine   │
                     └────────────────────┬────────────────────┘
                                          │ Prisma ORM
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │   PostgreSQL / Supabase Database        │
                     │   12 Products, Variants, 100 Tables     │
                     │   Snapshot Line Items, Settings         │
                     └─────────────────────────────────────────┘
```

### Frontend (`apps/web`)
- **React 18 + TypeScript** bundled with Vite.
- **Tailwind CSS** with modern restaurant tokens:
  - Deep Charcoal (`#1A1815`), Warm Terracotta (`#C8763A`), Deep Olive (`#4A5D3A`), Warm Canvas (`#FAF6F1`).
  - Google Serif (`Playfair Display`) paired with clean modern Sans (`Inter`).
- **Brand Identity:** Stylized modern Euroshub Horse Logo SVG component.
- **Centralized Currency:** `formatCurrency(amount)` producing `Rs. X` universally (zero scattered `$`, `€`, or raw unformatted amounts).
- **Dynamic Restaurant Context:** Central provider fetching live restaurant identity, opening hours, and active social media links.
- **Interactive Variant Modals & Selectors:** Real-time size selection for multi-variant pizzas, burgers, and sandwiches with live price recalculation.

### Backend API (`apps/api`)
- **Node.js + Express + TypeScript**.
- **Prisma ORM** targeting PostgreSQL / Supabase with strict relational schema.
- **Server-Side Pricing Engine:** Re-prices every line item from verified database `ProductVariant` and `ProductAddon` records. Client-submitted prices are discarded.
- **Immutable Purchase Snapshots:** `OrderItem` permanently records `variantNameAtPurchase`, `priceAtPurchase`, `nameAtPurchase`, and `addonSnapshots` to preserve financial audit history.
- **Order State Machine:** Enforces valid lifecycle transitions: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `COMPLETED` (or `CANCELLED`).
- **Table Registry:** Validates dine-in table numbers against 100 active restaurant tables (`01`–`100`).
- **Review Verification:** Customers can only review orders they own and have been completed; each order permits at most one verified review.

---

## 3. Fast-Food Menu Catalogue (Seed Data)

The database is seeded with 12 fast-food products across 4 categories with variant pricing:

| Category | Product Name | Variants & Pricing (PKR) |
|----------|--------------|--------------------------|
| **Pizza** | Euroshub Special Pizza | Small: Rs. 700 / Regular: Rs. 1,200 / Large: Rs. 1,600 |
| **Pizza** | Chicken Fajita Pizza | Small: Rs. 650 / Regular: Rs. 1,150 / Large: Rs. 1,550 |
| **Pizza** | Chicken Tikka Pizza | Small: Rs. 650 / Regular: Rs. 1,150 / Large: Rs. 1,550 |
| **Pizza** | Cheesy Cheese Pizza | Small: Rs. 550 / Regular: Rs. 950 / Large: Rs. 1,350 |
| **Burgers** | Zinger Burger | Single: Rs. 380 / With Cheese: Rs. 430 |
| **Burgers** | Beef Burger | Single Patty: Rs. 450 / Double Patty: Rs. 650 |
| **Burgers** | Crispy Chicken Burger | Single: Rs. 350 / With Cheese: Rs. 400 |
| **Burgers** | Euroshub Tower Burger | Double Decker: Rs. 600 |
| **Sandwiches** | Club Sandwich | Standard: Rs. 420 |
| **Sandwiches** | Grilled Chicken Sandwich | Standard: Rs. 450 |
| **Sides & Extras** | French Fries | Regular: Rs. 180 / Large: Rs. 280 / Loaded: Rs. 380 |
| **Sides & Extras** | Chicken Wings | 6 Pieces: Rs. 350 / 10 Pieces: Rs. 550 |

---

## 4. Default Seed Accounts & Credentials

| Role | Email | Password | Access / Capabilities |
|------|-------|----------|-----------------------|
| **Administrator** | `admin@euroshubkitchen.com` | `AdminPassword123!` | Full access to POS, dispatch, settings, menu catalog, tables, review moderation |

> *Note: In accordance with our anti-fabrication policy, no fake customer accounts, fake orders, or fake reviews are seeded. Customer accounts are created during registration or automated testing.*

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 / Node 24)
- Local PostgreSQL 16 instance OR Supabase database URL

### Quickstart Commands

```bash
# 1. Install dependencies across the monorepo
npm install

# 2. Start PostgreSQL Database
# On Windows, start the zero-install portable postgres daemon:
npm run db:setup:windows
# Or use Docker if installed:
docker compose up -d

# 3. Synchronize schema & seed production data
npm run db:push
npm run db:seed

# 4. Start Development Servers
# Terminal 1: API Server (port 5000)
npm run dev:api

# Terminal 2: Web Application (port 5173)
npm run dev:web
```

Access the application in your browser:
- Customer Storefront: `http://localhost:5173`
- Admin Operations Console: `http://localhost:5173/admin`

---

## 6. Automated Verification & Testing

The repository includes both an integration test suite and an end-to-end user journey simulation script:

```bash
# 1. Run Vitest integration test suite (20 automated tests)
npm test

# 2. Run complete End-to-End customer & admin journey validation
node ./scripts/e2e-validate.mjs

# 3. Typecheck and build production bundles
npm run build
```

---

## 7. Supabase Deployment & Storage Configuration

The platform is designed to connect to **Supabase** in production:

### 1. Database Connection
In your production `.env`, configure the Supabase PostgreSQL connection strings:
```ini
# Supabase Transaction / Session Pooler (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 2. Supabase Storage Buckets
Create two public buckets in the Supabase Storage console:
- `product-images`: For menu item photography
- `logo`: For restaurant branding assets

Configure the bucket names in your environment:
```ini
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_STORAGE_BUCKET_PRODUCTS="product-images"
SUPABASE_STORAGE_BUCKET_LOGO="logo"
```

---

## 8. Application Routes & Key Features

### Public Storefront
- `/` — Homepage with dynamic restaurant identity, category showcase, and dynamic popularity sections.
- `/menu` — Fast-food catalog with search, category filtering, "From Rs. X" pricing, and instant size-selection modal.
- `/menu/:id` — Product detail page with interactive variant tabs and real-time total price calculation.
- `/cart` — Cart review with variant and add-on breakdown.
- `/checkout` — Checkout supporting Dine-In (with table selector `01`–`100`) and Takeaway, fixed to "Pay at Restaurant".
- `/order-confirmation/:id` — Instant order confirmation screen with order number and status.
- `/reservation` — Table booking for dining room slots between 9:00 AM and 12:00 PM.
- `/about` & `/contact` — Authentic Kohistan Tower, Saddar, Rawalpindi details.

### Customer Account
- `/account` — Account overview and order statistics.
- `/account/orders` — Historical order log.
- `/account/orders/:id` — Live order tracking with progress stepper.
- `/account/reservations` — Historical and upcoming table reservations.
- `/account/reviews` — Verified review submission for completed orders.

### Administrative Back-Office (`/admin`)
- `/admin` — Real-time operations dashboard with today's revenue, active order counts, and sales trends.
- `/admin/orders` — Live order fulfillment queue with status transitions (`CONFIRMED` → `PREPARING` → `READY` → `COMPLETED`).
- `/admin/menu` — Menu editor supporting variants and availability toggles.
- `/admin/reservations` — Table reservation calendar and guest confirmation.
- `/admin/customers` — Customer CRM and spend tracking.
- `/admin/reviews` — Review moderation controls (hide / unhide).
- `/admin/settings` — Restaurant address, opening hours, delivery controls, and table count configuration.
