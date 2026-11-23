# UI Redesign — Euroshub Kitchen (apps/web)

A visual and structural redesign of the web app. API calls, routes, auth, form validation,
cart/checkout logic, admin logic and data shapes are unchanged (see "Logic guarantees" below).
`apps/api` was not touched. Nothing was committed.

---

## 1. Design system

**Tokens** live in `apps/web/src/styles/tokens.css` (CSS variables as `R G B` channels) and are
exposed through `apps/web/tailwind.config.js`. The Tailwind theme's `colors`, `borderRadius`,
`boxShadow` and `fontSize` are **replaced, not extended**, so old palette classes
(`stone-500`, `terracotta`, `amber-50`, `shadow-md` …) no longer produce any styles.

| Token | Value | Use |
|---|---|---|
| `night` / `canvas` / `deep` | #02040A / #050B14 / #08151F | hero sky, page, sunken bands |
| `surface` / `raised` | #0B1A24 / #102230 | cards, inputs / hover, tooltips |
| `line` / `line-strong` | ink at 8% / 16% | borders, dividers |
| `ink` / `muted` / `subtle` | #EEF6F3 at 100 / 66 / 45% | text |
| `accent` | #3DF5A6 | the one accent: focus, selected, success |
| `cyan`, `rose`, `danger`, `warning` | #2CC6E0, #FF5FA2, #FF6B6B, #F5C26B | status only; rose appears only as a faint aurora trace |

- **Type:** headings use "Iowan Old Style", Palatino, Georgia (weight 400, -0.02em). UI text uses the system stack.
  The scale is 12/14/16/18/22/28/40/56/84, with the display sizes fluid via `clamp()`. Prices use `.tabular`.
  There are no web fonts.
- **Radii:** 8px (inputs, `rounded`), 14px (cards, `rounded-lg`), pills (`rounded-full`). All other keys map to these three.
- **Shadows:** none, except `shadow-overlay` for dialogs. Depth comes from borders and surface steps.
- **Focus:** one global `:focus-visible` rule: 2px solid #3DF5A6, offset 3px (2px on inputs).
- **Contrast:** `subtle` (45%) is about 3.8:1 on the page background, so it's only used for placeholders,
  disabled states and decorative icons. All readable secondary text uses `muted` (about 7.5:1).
  The codemod mapped the old `stone-400/500` secondary text to `muted` for this reason.
- **Layout:** `.container-content` (max 1120px) for the site, `.container-admin` (max 1280px) for admin.
- **Dark only:** the site is now dark-only. `ThemeContext` and the light/dark toggle were removed.

### Component kit (`src/components/ui`)
- `Button` / `ButtonLink`: primary (ink pill), secondary (outline), ghost, danger; sm/md/lg; loading state.
  Small buttons are 44px tall on mobile.
- `Input`, `Select`, `Textarea`: built on `Field.tsx`, with label above, generated ids,
  `aria-invalid` and `aria-describedby`.
- `Checkbox`, `Radio`: the whole row is the tap target.
- `Badge` and `StatusBadge`: order/reservation status colors and labels are consistent everywhere.
- `Card`, `Dialog` (also exported as `Modal`), `Sheet`: focus moves in, Tab is trapped, Escape closes,
  focus is restored, and the page is scroll-locked.
- `Tabs`, `SegmentedControl` (radiogroup), `Skeleton` (static, not pulsing), `EmptyState`, `ErrorState`,
  `Notice`, `PriceTag` (plus `lowestPrice`), `QuantityStepper`, `Spinner`, `Timeline`, `Brand`,
  `DataTable` (`TableShell`, `Th`, `Td`, `Tr`, `RowAction`, `Pager`), `Section` (`Reveal`, `SectionHeader`).
- Toasts: Sonner, restyled, top-right below the navbar. They're announced through its aria-live region.

---

## 2. Home hero

**`docs/hero-spec.md` does not exist in the repo.** As agreed, the hero was built from the bullet points
in the brief. The exact visual values below are my own choices; compare them with the spec once you have it.

- `components/home/aurora.ts`: plain TypeScript renderer, so React never re-renders per frame.
  - Aurora curtains are drawn into a **1/3-size buffer** and upscaled.
    There are three ribbons: green (main), cyan (supporting) and a 7%-alpha rose trace.
  - A horizontal brightness envelope keeps the left side dark, so the copy never sits on the bright area.
  - Stars come from **mulberry32(seed 7)** on a separate full-resolution canvas, redrawn only on resize.
  - Runs at about 30fps. It pauses when the tab is hidden (`visibilitychange`) or the hero is
    off screen (IntersectionObserver). Resize is debounced (150ms).
  - Reduced motion: one still frame and no animation loop.
- `components/home/AuroraHero.tsx`: refs only.
  - The renderer starts **after first paint** (requestAnimationFrame, then `requestIdleCallback`, timeout 700ms).
  - Layers: sky gradient, then stars, then aurora (fades in over 700ms), then **two SVG ridges**
    (the back ridge has a faint green rim; the front ridge matches the page color), then static SVG
    film **grain** at 5% opacity.
  - Entrance: copy fades and rises 12px, staggered 90ms.
  - Copy is exactly as briefed. "Order now" goes to `/menu`; "Book a table →" goes to `/reservation`.
  - When closed, it shows "Closed now · opens at 9:00 AM" below the actions (bottom-left, over the dark sky).
    This uses the existing `checkRestaurantStatus`, formatted by the new `utils/openingHours.ts`.

---

## 3. Pages

- **Navbar:** fixed and minimal; transparent over the hero, solid `canvas` with a border once scrolled.
  - The cart count badge bumps when items are added, and changes are announced through aria-live.
  - On mobile the menu opens as a sheet. There's a skip link.
  - The old announcement bar and theme toggle were removed.
- **Footer:** name, address, hours summary, phone, email, social links, nav and footer text, all from settings.
- **Home:** hero, category pills, "From the kitchen", the signature dish, "Most ordered", "Visit us",
  reviews and a reservation call to action.
  - "From the kitchen" shows chef specials plus featured items, falling back to a menu sample.
  - The signature dish appears only if set in admin. "Most ordered" comes from real orders.
  - "Visit us" shows hours, location with an "Open in Maps" link, and contact details.
  - Reviews appear only when real reviews exist. The call to action shows the live table count only
    when the API actually answered.
  - **Removed:** the Unsplash background photo, and the made-up "5.0 ★ / Verified Dining" stat that
    showed when there were no reviews.
- **Menu:** search and sort; a sticky category bar; cards with image, name, two-line description and
  "From Rs X" (the lowest available variant); skeletons, an empty state and an error state.
  The quick-add dialog was kept, with the segmented variant picker and stepper.
- **Dish detail:**
  - Large image, sizes as a segmented control, and **add-ons as checkboxes with prices**
    (from `addonLinks`, sent through the existing `addItem(dish, variant, addons, qty)`).
  - Ingredients and tags, a stepper, and related dishes.
  - On mobile, a sticky "Add to cart · Rs X" bar.
- **Cart:** items and summary side by side on desktop, one column on mobile.
  Lines show their variant and add-ons. There's a quantity stepper (the trash icon at 1 removes the
  line), a visible Remove button, a sold-out warning and an honest pay-at-restaurant note.
- **Checkout:** form and summary side by side.
  - Dine-in or takeaway via the segmented control; a table select; phone.
  - Payment is a plain "Pay at the restaurant / nothing is charged online" block.
  - Notices for the closed state, API errors and signed-out users.
- **Order confirmation:** calm success state, order number, items and total, with a fallback if the details fail to load.
- **Account** (now with the site navbar and footer):
  - Orders show a compact five-step progress bar and status. The order detail page has the full
    PENDING → CONFIRMED → PREPARING → READY → COMPLETED timeline (a cancelled state is shown separately),
    the receipt with add-ons, and the review dialog with an accessible star picker.
  - Reservations and reviews are lists with empty and error states.
  - `/account/settings` now shows the profile and change-password form (it used to repeat the overview).
  - The "Total orders 3+" stat card was removed, because it was based on a 3-item page.
- **Reservations, login, register, contact, about:** calm card forms with labels above the fields, inline
  errors and `autocomplete` hints. About lost its stock photos and the hardcoded "12 core items" claim.
- **Admin** (sidebar, top bar, no aurora):
  - **Dashboard:** six-stat strip, token-colored revenue chart, recent orders and bookings.
  - **Orders, reservations, customers, categories:** dense tables with status badges, filters and pagers.
    Status changes use plain buttons ("Preparing", "Cancel").
  - **Order detail:** includes the timeline.
  - **Menu:** a table split into "On the menu" and "Hidden"; editor, options and option-form dialogs.
  - **Settings:** sectioned, with a sticky save bar and a row-per-day hours editor.
  - **Reviews:** moderation list.
  - Categories now has a sidebar link (the route existed but had no nav entry).
  - The hardcoded "Live Database Connected" pill was removed.
  - Delete confirmations now use the design-system dialog instead of `window.confirm()`.
    The same mutations are called after confirming.

---

## 4. Motion

- Only `transform` and `opacity` animate. UI motion is 150–400ms; reveals are 700ms;
  easing is `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- `hooks/useReveal.ts` / `<Reveal>`: fade plus a 12px rise, once per element, via IntersectionObserver.
- Cards lift 2px and their border brightens on hover. Buttons scale to 0.98 when pressed.
  The cart badge bumps (320ms). Route changes fade in over 150ms. Dialogs and sheets have short entrances.
- `prefers-reduced-motion`: all animations and transitions become effectively instant, reveals use
  opacity only, and the hero draws one still frame.
- No animation libraries, particles, parallax, cursor effects, bouncing or infinite pulsing.
  The only looping animation is the loading spinner while work is in flight.

---

## 5. Performance (measured)

**Before**, from `vite build` on the original code: one JS bundle of **985.08 kB raw, 265.72 kB gzip**.
CSS was 60.35 kB raw, 9.79 kB gzip. Google Fonts (Inter and Playfair) loaded from an external host.

**After**, from `vite build`, per chunk:

| Chunk | raw | gzip |
|---|---|---|
| `index` (app shell) | 71.37 kB | 22.17 kB |
| `react` (react, react-dom, clsx, tailwind-merge) | 162.77 kB | 52.31 kB |
| `router-query` | 62.14 kB | 19.64 kB |
| `forms` (react-hook-form, zod), only on form pages | 84.66 kB | 23.54 kB |
| `charts` (recharts and d3), only on the admin dashboard | 371.81 kB | 103.04 kB |
| `HomePage` | 15.77 kB | 6.04 kB |
| CSS | 39.55 kB | 8.37 kB |

**JS needed for a first visit**, measured by following the real static-import graph of the built files
(gzip level 9, so it differs slightly from Vite's figures):

| Route | JS (gzip) |
|---|---|
| Home `/` | **104.27 kB** (target was under 200 kB) |
| Menu `/menu` | 102.00 kB |
| Checkout `/checkout` | 121.91 kB |
| Admin dashboard | 196.72 kB (the only route that loads Recharts) |

Other changes:
- Every page is `React.lazy` with Suspense, and admin pages and the admin layout are separate chunks.
  `index.html` preloads only `react` and `router-query`.
  A Rollup quirk had pulled `clsx` into `charts`, which made every page preload it; it's now pinned to `react`.
- No external fonts or requests at load.
- Hovering or focusing "Order now" prefetches the menu data and chunk, through the shared query
  definitions in `api/queries.ts`. Menu and categories have a 5-minute `staleTime`.
  Cross-tab admin sync still invalidates them.
- Images have explicit width and height, `loading="lazy"` and `decoding="async"`.
  `priority` (eager plus `fetchpriority="high"`) is used only for the first visible image.
- `ThemeContext`, `HorseLogo` and the unused `Table.tsx` were deleted. No npm dependency became unused.

---

## 6. Bugs found (not fixed, because they're logic)

1. **The checkout table list is always empty** (this predates the redesign). `CheckoutPage` reads
   `res.data?.tables`, but `api.get('/tables')` returns `{ tables: [...] }`. Every dine-in order is sent
   with the default table "01". The fix is one line: use `res.tables` (in both places).
2. **The contact form doesn't send anything.** `onSubmit` waits 600ms and shows "sent". There's no API
   endpoint. Either wire it up or replace it with the phone and email links.
3. **Cart lines merge across add-ons.** `CartContext` builds the line id from `item + variant` only, so
   adding the same size twice with different add-ons merges into one line that keeps the first add-ons.
   The server reprices from the `addonIds` it receives, so totals stay correct server-side, but the line is wrong.
   This only matters now that add-ons are selectable.
4. **Admin category saves don't refresh the public menu cache** in the same tab. They invalidate
   `['menu-categories']`, but the public pages use `['categories']`. With the new 5-minute `staleTime`,
   a change can take up to 5 minutes to show in a tab that's already open.

**Fixed as part of the UI kit:** the old `Select` called `onChange(value, event)`. With React Hook Form's
`register()`, that threw on every change, so the reservation time and guest selects never registered.
The new `Select` passes the native event. I verified this in the browser: the form validated and
redirected to sign-in. The admin filters accept both forms, so they still work.

---

## 7. Not completed or not verified

- **No frontend tests exist** (`apps/web` has no test runner or script), so none were run.
  `tsc` and `vite build` pass.
- **Admin pages were not checked in a browser**, because that needs admin credentials. They build and
  type-check, and their query and mutation code was diffed to confirm it's unchanged. Please click through them.
- Browser checks covered Home, Menu, Dish, Cart and Checkout (viewed only; no order was placed against
  the live database), Reservation, Login, Register, About and Contact.
  - These were checked at 1536px and in 375px iframes: no horizontal overflow, and tap targets of 44px or more.
  - 768px wasn't checked separately, and 360px was covered by the 375px pass.
- Supabase image transformations (`/render/image`) weren't used, because they need a paid plan.
  Food images are served at their original size (about 700–800px).
- The admin "Hero headline/subtitle" settings are no longer displayed, because the hero copy is now fixed.
  The fields are kept in a "Legacy homepage text" section so nothing is lost.

## Logic guarantees

Pages were rewritten with a script that keeps everything above the returned JSX byte-for-byte
(schemas, state, queries, mutations, handlers) and only replaces imports and markup. After each page,
`git diff` was checked for changes to API calls, payloads, `invalidateQueries`, schemas and navigation.
None were found, apart from these deliberate exceptions:

- Menu and Home use the shared `categoriesQuery` / `menuItemsQuery`. The keys and endpoints are the
  same, but they add a 5-minute `staleTime`.
- Dish detail has new add-on selection state, passed to the existing `addItem`.
- `/account/settings` renders profile and password instead of repeating the overview.
- Admin delete confirmations moved from `window.confirm()` to a dialog. The same mutation runs on confirm.
- `formatCurrency` now outputs `Rs 1,250` (was `Rs. 1,250`). Date helpers output `23 Nov 2026, 2:30 pm`.
