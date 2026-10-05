# Deploy on Namecheap cPanel (Stellar Business / any cPanel with "Setup Node.js App")

Frontend + backend are one Next.js app. cPanel runs it with Node.js; MySQL
stores products, settings, orders and subscribers; uploads are saved on disk.

> Namecheap recommends **building on your own computer**, not on the server.
> Shared hosting has little RAM for `next build`.

---

## 1 · Create the database (cPanel → MySQL® Databases)

1. **Create New Database** → e.g. `cpuser_m3s`
2. **Add New User** → e.g. `cpuser_m3suser` + a strong password
3. **Add User To Database** → tick **ALL PRIVILEGES**
4. Open **phpMyAdmin** → select the database → **Import** → choose
   `database/schema.sql` → **Go**. (Creates 7 tables.)

Your connection string:

```
mysql://cpuser_m3suser:PASSWORD@localhost:3306/cpuser_m3s
```

If the password has symbols like `@ # / ?`, URL-encode them
(`@` → `%40`, `#` → `%23`, `/` → `%2F`, `?` → `%3F`).

## 2 · Build on your computer

```bash
npm install
npm run build
npm run package:cpanel      # → deploy/m3s-cpanel.zip
```

(Windows 10/11 is fine — the script uses the built-in `tar`.)

## 3 · Create the Node.js app (cPanel → Setup Node.js App → Create Application)

| Field | Value |
|---|---|
| Node.js version | **22.x** (or 20.x / 24.x — needs ≥ 20.9) |
| Application mode | Production |
| Application root | `m3s-app` (a folder **outside** `public_html`) |
| Application URL | your domain (or a subdomain) |
| Application startup file | `server.js` |

**Environment variables** (same screen → *Add Variable*):

| Name | Value |
|---|---|
| `DATABASE_URL` | the string from step 1 |
| `AUTH_SECRET` | a long random string (32+ chars) — e.g. from a password generator |
| `UPLOAD_DIR` | `/home/CPANELUSER/m3s-uploads` (absolute path, outside the app folder so uploads survive redeploys) |
| `UPLOAD_MAX_MB` | `60` |
| `NODE_ENV` | `production` |

Click **Create**, then **Stop App**.

## 4 · Upload

1. cPanel → **File Manager** → open `m3s-app`
2. **Upload** `m3s-cpanel.zip` → right-click → **Extract** → delete the zip
3. Back in **Setup Node.js App** → **Run NPM Install** (wait until it finishes)
4. **Start App** (or **Restart**)

Open `https://your-domain/admin` → **Create the first admin** (tick
*Load demo products & content* if you want the sample tees) → done.

## 5 · Updating the site later

- **Content / products / images / 3D models** → just use `/admin`. No redeploy.
- **Code changes** → `npm run build && npm run package:cpanel` on your computer,
  upload + extract over the old files (overwrite), **Restart** the app.
  Only run **Run NPM Install** again if `package.json` changed.

## Troubleshooting

| Problem | Fix |
|---|---|
| `/admin` says *Database not connected* | Check `DATABASE_URL` (user, password encoding, db name) and that `schema.sql` was imported. Restart the app after changing variables. |
| 503 / app won't start | cPanel → Setup Node.js App → check Node version ≥ 20.9, startup file `server.js`, then look at `stderr.log` in the app folder. |
| Uploads fail for big `.glb` files | Raise `UPLOAD_MAX_MB`. Compress models with Draco / Meshopt (e.g. gltf.report or `gltf-transform optimize`). Very large bodies may also be limited by the host — ask Namecheap support. |
| Logged out after every restart | `AUTH_SECRET` must stay the same. |
| Behind HTTP only (no SSL yet) | Sign-in cookies are `Secure` in production. Enable AutoSSL, or temporarily set `INSECURE_COOKIES=1`. |
| Changes not visible | Hard-refresh (Ctrl+F5). Pages render fresh from the database on every request. |

## SSH alternative (optional)

If SSH is enabled you can create tables with `npm run db:setup` (reads
`DATABASE_URL`) instead of phpMyAdmin. Enter the app's virtual environment with
the command shown at the top of the *Setup Node.js App* page first.
