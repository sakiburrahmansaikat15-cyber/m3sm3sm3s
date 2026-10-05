// Builds a ready-to-upload folder + zip for cPanel (run AFTER `npm run build`).
//   npm run build && npm run package:cpanel
// Output: deploy/m3s-cpanel.zip  (upload + extract into your app folder)
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

if (!existsSync(".next/BUILD_ID")) {
  console.error("✗ No production build found. Run `npm run build` first.");
  process.exit(1);
}
const out = path.resolve("deploy/m3s-cpanel");
rmSync("deploy", { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const include = [".next", "public", "database", "scripts", "server.js", "package.json", "package-lock.json", "next.config.mjs", ".env.example"];
for (const item of include) {
  if (!existsSync(item)) continue;
  cpSync(item, path.join(out, item), {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(process.cwd(), path.resolve(src)).split(path.sep).join("/");
      return rel !== ".next/cache" && !rel.startsWith(".next/cache/");
    },
  });
}

const zip = path.resolve("deploy/m3s-cpanel.zip");
try {
  if (process.platform === "win32") execSync(`tar -a -c -f "${zip}" -C "${out}" .`, { stdio: "inherit" });
  else execSync(`cd "${out}" && zip -qr "${zip}" .`, { stdio: "inherit", shell: "/bin/sh" });
  console.log(`✓ ${path.relative(process.cwd(), zip)} is ready — see DEPLOY-CPANEL.md`);
} catch {
  console.log(`✓ Folder ready: ${path.relative(process.cwd(), out)} — zip it manually and upload (see DEPLOY-CPANEL.md)`);
}
