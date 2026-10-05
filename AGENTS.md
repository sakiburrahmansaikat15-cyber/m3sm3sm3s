<!-- Auto-generated from CLAUDE.md by `npm run sync-agents`. Edit CLAUDE.md instead. -->

# M3S — Full-stack T-shirt store (Next.js + MySQL + Admin CMS)

> Project guide for AI coding agents (Claude Code, Antigravity, Cursor…).
> Read this whole file before changing anything. `AGENTS.md` and `GEMINI.md`
> are copies — run `npm run sync-agents` after editing this file.

## What this is

**M3S Studio** — streetwear t-shirt e-commerce from Dhaka, Bangladesh.
**One Next.js project = frontend + backend + admin panel**, all TypeScript.

- Public site: dark, scroll-driven 3D homepage (one fixed three.js stage),
  shop, product pages (3D viewer), cart, checkout.
- Backend: Route Handlers (`src/app/api/**`), Server Actions
  (`src/app/admin/actions.ts`), MySQL via **Drizzle ORM** (`src/server/db`).
- Admin CMS at **`/admin`**: products (GLB models, SVG/PNG prints, colours,
  backgrounds, gallery), every homepage section, 3D poses, brand/theme/SEO,
  menus, delivery, payments, media library, orders, subscribers, admins.
- Hosting target: Namecheap cPanel (Node.js app + MySQL) — see `DEPLOY-CPANEL.md`.

All branding (wordmark, copy, slogan, icons, tee artwork) is M3S's own — never
paste in another brand's logo, copy or assets.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** strict
- **MySQL / MariaDB** + **Drizzle ORM** + `mysql2` (pure JS — no native binaries, good for cPanel)
- Auth: `jose` JWT in an httpOnly cookie (`m3s_admin`), `bcryptjs` hashes, `src/proxy.ts` guard
- Validation: **zod** (`src/lib/validators.ts`, `saveProductAction`)
- **Tailwind CSS v4** · **GSAP 3** + ScrollTrigger · **Lenis** · **three.js** (+ GLTFLoader, Draco, Meshopt)
- **zustand** cart (localStorage `m3s-cart`)
- Fonts self-hosted in `src/app/fonts` (Archivo wide italic, Geist, Geist Mono)

## Commands

```bash
cp .env.example .env     # set DATABASE_URL + AUTH_SECRET
npm install
npm run db:setup         # create tables from database/schema.sql
npm run dev              # http://localhost:3000  → /admin to create the first admin
npm run build            # must pass before you finish a task
npm run typecheck
npm run package:cpanel   # after build → deploy/m3s-cpanel.zip
npm run sync-agents      # CLAUDE.md → AGENTS.md + GEMINI.md
```

Without `DATABASE_URL` the public site still renders with demo content
(`src/lib/defaults.ts`) — useful for pure UI work.

## Data model

| Table | Purpose |
|---|---|
| `admins` | admin accounts (email, bcrypt hash) |
| `settings` | one JSON row per settings group (`brand`, `theme`, `faq`, `poses` …) |
| `products` | catalogue incl. `print_url`, `back_print_url`, `model_url`, `bg_image_url`, `gallery` |
| `media` | every uploaded file (url, kind: model/svg/image) |
| `orders`, `order_items` | checkout orders (prices recomputed on the server) |
| `subscribers` | newsletter emails |

Schema lives twice and must stay in sync: `src/server/db/schema.ts` (Drizzle)
and `database/schema.sql` (phpMyAdmin import). Add a column → edit both.

Settings shape = `SiteSettings` in `src/lib/types.ts`; defaults in
`src/lib/defaults.ts`. Stored JSON is **deep-merged over defaults** when read
(`loadSettings`), so adding a new field only needs a default — no migration.

## Folder map

```
database/schema.sql            MySQL tables (import in phpMyAdmin)
server.js                      production entry for cPanel (Passenger)
src/
  proxy.ts                     guards /admin/* and /api/admin/*
  server/                      server-only code
    db/index.ts, db/schema.ts  pool + Drizzle schema
    content.ts                 ★ getSiteData() (settings + products, per request), row⇄Product, seed
    auth.ts, session.ts        login, sessions, requireAdmin()
    uploads.ts                 save/validate uploads, SVG sanitiser, UPLOAD_DIR
  lib/
    types.ts                   ★ Product, SiteSettings, Pose …
    defaults.ts                ★ default content + default poses + emptyProduct
    validators.ts              zod schemas shared by client + API
    tee-art.ts                 tee outline, coded prints, uploaded print drawing, textures
  app/
    layout.tsx                 loads getSiteData() → <SiteDataProvider>
    page.tsx                   homepage; section order/visibility from settings.sections
    shop/ product/[slug]/ cart/ checkout/
    uploads/[...path]/route.ts serves uploaded files (nosniff + CSP sandbox)
    api/orders, api/subscribe  public endpoints
    api/admin/upload|media|subscribers   admin endpoints (proxy-guarded + re-checked)
    admin/login                first-run setup / sign-in
    admin/(panel)/…            dashboard, products, homepage, settings, media, orders, subscribers, account
    admin/actions.ts           ★ all admin Server Actions (each calls requireAdmin())
  components/
    providers/SiteData.tsx     useSettings(), useProducts(), useProductMap(), lines()
    admin/                     fields.tsx (inputs, MediaField, ListEditor), GroupEditor, editors.tsx, ProductForm …
    home/                      Sections, Backdrop, StageCanvas, Choreography, stage-state, Loader, FAQ
    three/                     stage.ts (homepage), tee-scene.ts (viewer), tee-mesh.ts, model-loader.ts
    layout/ product/ ui/
```

## Rules

1. **Never hard-code content.** Text, links, colours, images → `SiteSettings`
   (+ an editor in `components/admin/editors.tsx`) or `Product`.
   Client components read data with `useSettings()` / `useProducts()`;
   server components with `await getSiteData()`.
2. **Adding a new editable field:** add it to the type in `lib/types.ts`, a
   default in `lib/defaults.ts`, an input in the matching editor, then use it.
   Product fields also need `schema.ts`, `schema.sql`, `rowToProduct`,
   `productToRow`, `productSchema` (actions) and `ProductForm`.
3. **Adding a homepage section:** add its id to `SectionId`/`SECTION_IDS`,
   a component in `Sections.tsx` with `data-pose` + `data-section`, map it in
   `app/page.tsx`, add a `Pose` in `defaultPoses` (+ `PoseKey`), an editor tab.
4. Every Server Action / admin route must call `requireAdmin()` /
   `adminOrNull()` even though `proxy.ts` guards the path.
5. Never trust client prices — `/api/orders` recomputes from the DB.
6. Uploads: only via `/api/admin/upload`; allowed `.glb .svg .png .jpg .jpeg .webp .avif .ico`;
   SVGs are sanitised; files live in `UPLOAD_DIR` and are served from `/uploads/...`.
7. three.js stays in `components/three/` and is imported dynamically; always `dispose()`.
   `Stage` renders a GLB when `product.modelUrl || theme.defaultModelUrl` is set,
   otherwise the procedural tee with the uploaded or coded print.
8. Animation = GSAP inside `gsap.context()` with `ctx.revert()`. Lenis is disabled on `/admin`.
9. Next 16: `params`/`searchParams` are Promises; middleware is `src/proxy.ts`.
10. Pages are `force-dynamic` (root layout) so admin edits show immediately.
11. `npm run build` must pass. Keep `server.js` CommonJS (cPanel/Passenger).

## How the 3D choreography works

1. Each homepage `<section>` has `data-pose="<PoseKey>"` and `data-section="<SectionId>"`.
2. Poses = `defaultPoses` merged with `settings.poses` (Admin → Homepage → 3D poses).
   Benefit N reuses `benefit{N % 4}`.
3. `Choreography.tsx` scrubs `stage.pose` from the previous section's pose to
   the next one's while each section scrolls in, and sets `stage.section`.
4. `stage.ts` and `Backdrop.tsx` read `stage.pose` every frame. `Backdrop`
   also shows the per-section background image and the product background.
5. `stage.active` = design picked in the carousel; `stage.cycle` auto-rotates
   designs in the slogan section (`settings.argument.intervalMs`).

## Design system

| Token | Value |
|---|---|
| page background | `settings.theme.background` → CSS `--site-bg` |
| accent | `settings.theme.accent` → CSS `--accent` |
| per-product `bg`, `tee`, `ink`, `ink2`, `fg` | set in Admin → Products |
| Display | `.display` — Archivo italic 850, `font-stretch:125%`, uppercase |
| Body / labels | Geist / Geist Mono |

Buttons: `.btn-glow` / `.btn-ink` (white, soft glow), `.btn-line`. Admin UI uses
neutral-950 surfaces with `border-white/10` cards (`components/admin/fields.tsx`).

## Backend hooks (TODO)

- Online payments: in `/api/orders`, when `payment !== "cod"`, create a bKash /
  Nagad / SSLCommerz session and return its redirect URL; add a callback route
  under `src/app/api/payment/<provider>/route.ts` that marks the order paid.
- Order emails/SMS: send after the insert in `/api/orders`.
- Stock counts per size (currently only `sold_out` flags).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
