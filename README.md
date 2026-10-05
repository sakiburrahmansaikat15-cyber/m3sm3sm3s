# M3S Studio — full-stack 3D t-shirt store

**One Next.js 16 project** — frontend, backend (TypeScript API + Server
Actions), MySQL database and a complete admin panel.

- 3D scroll homepage (three.js + GSAP + Lenis)
- Shop, product pages with 3D viewer, cart, checkout (COD / bKash / Nagad / card)
- **Admin CMS at `/admin`** — change everything without touching code:
  - Products: name, price, sizes, stock flags, colours, **.glb 3D model**,
    **SVG/PNG front & back prints**, background image, gallery, publish, order
  - Homepage: section order/visibility, background image per section,
    carousel, close-up, benefits (custom SVG icons), slogan section, range,
    FAQ, newsletter, and **3D camera poses** for every section
  - Site: brand/logo/favicon, theme colours, default 3D model, loader, sound,
    SEO, menu, social + legal links, delivery zones & fees, payment methods, shop page
  - Media library (drag & drop), orders (status, details), subscribers (CSV), admins

## Run locally

```bash
cp .env.example .env        # fill DATABASE_URL (local MySQL/MariaDB/XAMPP/Laragon) + AUTH_SECRET
npm install
npm run db:setup            # creates the tables
npm run dev                 # open http://localhost:3000/admin → create the first admin
```

No database yet? `npm run dev` still shows the site with demo content.

## Deploy (Namecheap cPanel)

See **[DEPLOY-CPANEL.md](./DEPLOY-CPANEL.md)** — short version:

```bash
npm run build && npm run package:cpanel   # → deploy/m3s-cpanel.zip
```

Import `database/schema.sql` in phpMyAdmin, create a Node.js app
(startup file `server.js`), set the environment variables, upload + extract
the zip, **Run NPM Install**, **Start**.

## Working with AI agents

- **Claude Code** reads `CLAUDE.md` automatically.
- **Antigravity / Gemini / others**: `AGENTS.md` and `GEMINI.md` are copies —
  run `npm run sync-agents` after editing `CLAUDE.md`.
