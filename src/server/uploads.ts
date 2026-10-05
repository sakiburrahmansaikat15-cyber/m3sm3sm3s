import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type UploadKind = "model" | "svg" | "image";

const TYPES: Record<string, { kind: UploadKind; mime: string }> = {
  ".glb": { kind: "model", mime: "model/gltf-binary" },
  ".svg": { kind: "svg", mime: "image/svg+xml" },
  ".png": { kind: "image", mime: "image/png" },
  ".jpg": { kind: "image", mime: "image/jpeg" },
  ".jpeg": { kind: "image", mime: "image/jpeg" },
  ".webp": { kind: "image", mime: "image/webp" },
  ".avif": { kind: "image", mime: "image/avif" },
  ".ico": { kind: "image", mime: "image/x-icon" },
};

export const ACCEPT = {
  model: ".glb",
  svg: ".svg,.png,.webp",
  image: ".png,.jpg,.jpeg,.webp,.avif,.svg",
  any: Object.keys(TYPES).join(","),
};

export function uploadDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
}

export function maxBytes() {
  return Number(process.env.UPLOAD_MAX_MB || 60) * 1024 * 1024;
}

export function typeFor(filename: string) {
  return TYPES[path.extname(filename).toLowerCase()] ?? null;
}

/** Remove anything executable from an SVG (scripts, event handlers, external refs). */
export function sanitizeSvg(src: string) {
  let s = src.replace(/<\?xml[^>]*>/gi, "").replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, "").replace(/<script[^>]*\/>/gi, "");
  s = s.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/(href|xlink:href)\s*=\s*("|')\s*(javascript|data:text\/html|https?:)[^"']*\2/gi, "");
  s = s.replace(/<(iframe|embed|object)[\s\S]*?>/gi, "");
  return s.trim();
}

function magicOk(kind: UploadKind, ext: string, buf: Buffer) {
  if (kind === "model") return buf.subarray(0, 4).toString("ascii") === "glTF";
  if (kind === "svg") return /<svg[\s>]/i.test(buf.subarray(0, 4096).toString("utf8"));
  if (ext === ".png") return buf[0] === 0x89 && buf.subarray(1, 4).toString("ascii") === "PNG";
  if (ext === ".jpg" || ext === ".jpeg") return buf[0] === 0xff && buf[1] === 0xd8;
  if (ext === ".webp") return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return true;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";

export async function saveUpload(file: File) {
  const t = typeFor(file.name);
  if (!t) throw new Error("File type not allowed. Use .glb, .svg, .png, .jpg, .webp or .avif");
  if (file.size > maxBytes()) throw new Error(`File is larger than ${process.env.UPLOAD_MAX_MB || 60} MB`);
  const ext = path.extname(file.name).toLowerCase();
  let buf: Buffer = Buffer.from(await file.arrayBuffer());
  const kind: UploadKind = ext === ".svg" ? "svg" : t.kind;
  if (!magicOk(kind, ext, buf)) throw new Error("The file content doesn't match its extension");
  if (ext === ".svg") buf = Buffer.from(sanitizeSvg(buf.toString("utf8")), "utf8");

  const folder = kind === "model" ? "models" : kind === "svg" ? "prints" : "images";
  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${slugify(file.name)}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(uploadDir(), folder, sub);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return {
    url: `/uploads/${folder}/${sub}/${name}`,
    filename: file.name,
    kind,
    mime: t.mime,
    size: buf.length,
  };
}

/** Resolve a /uploads/... URL to an absolute path inside UPLOAD_DIR (or null). */
export function resolveUploadPath(parts: string[]) {
  const root = uploadDir();
  const full = path.resolve(root, ...parts.map((p) => decodeURIComponent(p)));
  if (!full.startsWith(root + path.sep)) return null;
  return full;
}

export async function readUpload(parts: string[]) {
  const full = resolveUploadPath(parts);
  if (!full) return null;
  try {
    const st = await stat(full);
    if (!st.isFile()) return null;
    return { data: await readFile(full), size: st.size, mtime: st.mtime, type: typeFor(full) };
  } catch {
    return null;
  }
}

export async function deleteUploadByUrl(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const full = resolveUploadPath(url.replace(/^\/uploads\//, "").split("/"));
  if (full) await unlink(full).catch(() => {});
}
