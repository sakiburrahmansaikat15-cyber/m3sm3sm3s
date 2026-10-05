/**
 * Tee geometry + print artwork, drawn with the Canvas 2D API.
 * The SAME functions feed the 2D product cards and the three.js texture,
 * so a design only has to be defined once (in `drawPrint`).
 */
import type { Product } from "./types";

/* ------------------------------------------------------------------ */
/* Tee silhouette (units: 100 wide x 110 tall, y pointing down)        */
/* ------------------------------------------------------------------ */
type Cmd = ["M" | "L", number, number] | ["Q", number, number, number, number];

export const TEE_W = 100;
export const TEE_H = 110;

const TEE_PATH: Cmd[] = [
  ["M", 36, 3],
  ["Q", 50, 16, 64, 3],
  ["L", 82, 8],
  ["Q", 92, 14, 100, 28],
  ["L", 86, 40],
  ["Q", 82, 37, 79, 34],
  ["L", 80, 106],
  ["Q", 80, 110, 76, 110],
  ["L", 24, 110],
  ["Q", 20, 110, 20, 106],
  ["L", 21, 34],
  ["Q", 18, 37, 14, 40],
  ["L", 0, 28],
  ["Q", 8, 14, 18, 8],
  ["L", 36, 3],
];

/** Chest print box in tee units */
export const PRINT_BOX = { x: 31, y: 22, size: 38 };

type PathTarget = {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): unknown;
};

/** Trace the tee outline onto a CanvasRenderingContext2D or a THREE.Shape */
export function traceTee(t: PathTarget, map: (x: number, y: number) => [number, number], neckDip = 16) {
  for (const c of TEE_PATH) {
    if (c[0] === "Q") {
      const [cx, cy] = c[1] === 50 && c[2] === 16 ? map(50, neckDip) : map(c[1], c[2]);
      const [x, y] = map(c[3], c[4]);
      t.quadraticCurveTo(cx, cy, x, y);
    } else if (c[0] === "M") t.moveTo(...map(c[1], c[2]));
    else t.lineTo(...map(c[1], c[2]));
  }
}

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
export type ArtFonts = { display: string; body: string; mono: string; brand?: string };

/** Uploaded print images (SVG/PNG) for a product */
export type ArtImages = { front?: CanvasImageSource | null; back?: CanvasImageSource | null };

const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  let p = imgCache.get(url);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        // SVGs without intrinsic size: give them one so drawImage works
        if (!img.naturalWidth) { img.width = 1024; img.height = 1024; }
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imgCache.set(url, p);
  }
  return p;
}

export async function loadArtImages(p: Product): Promise<ArtImages> {
  const [front, back] = await Promise.all([loadImage(p.printUrl), loadImage(p.backPrintUrl)]);
  return { front, back };
}

function drawContain(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width || 1;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height || 1;
  const k = Math.min(w / iw, h / ih);
  ctx.drawImage(img, x + (w - iw * k) / 2, y + (h - ih * k) / 2, iw * k, ih * k);
}

export const fallbackFonts: ArtFonts = {
  display: "Impact, 'Arial Black', sans-serif",
  body: "Arial, sans-serif",
  mono: "ui-monospace, monospace",
};

export async function loadArtFonts(brand = "M3S"): Promise<ArtFonts> {
  if (typeof window === "undefined") return { ...fallbackFonts, brand };
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--art-display").trim() || fallbackFonts.display;
  const body = css.getPropertyValue("--art-body").trim() || fallbackFonts.body;
  const mono = css.getPropertyValue("--art-mono").trim() || fallbackFonts.mono;
  try {
    await Promise.all([
      document.fonts.load(`italic 800 64px ${display}`),
      document.fonts.load(`700 32px ${body}`),
      document.fonts.load(`500 32px ${mono}`),
    ]);
  } catch {
    /* fall through with whatever is available */
  }
  return { display, body, mono, brand };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Print artwork — drawn into a transparent square (512 design units)  */
/* ------------------------------------------------------------------ */
function fitText(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, maxPx: number) {
  let px = maxPx;
  ctx.font = font(px);
  const w = ctx.measureText(text).width;
  if (w > maxW) px = Math.floor((px * maxW) / w);
  ctx.font = font(px);
  return px;
}

export function drawPrint(ctx: CanvasRenderingContext2D, p: Product, size: number, f: ArtFonts) {
  const { ink, ink2 } = p;
  const D = (px: number) => `italic 800 ${px}px ${f.display}`;
  const B = (px: number) => `700 ${px}px ${f.body}`;
  const M = (px: number) => `500 ${px}px ${f.mono}`;

  ctx.save();
  ctx.scale(size / 512, size / 512);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (p.print.motif) {
    case "neon": {
      ctx.shadowColor = ink;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 10;
      roundRect(ctx, 30, 40, 452, 400, 40);
      ctx.stroke();
      // moon
      ctx.fillStyle = ink2;
      ctx.beginPath();
      ctx.arc(400, 110, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(386, 98, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = ink;
      fitText(ctx, p.print.title, D, 380, 190);
      ctx.fillText(p.print.title, 256, 290);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 5;
      fitText(ctx, p.print.sub, D, 300, 110);
      ctx.strokeText(p.print.sub, 256, 400);
      ctx.fillStyle = ink2;
      ctx.font = M(26);
      ctx.fillText("OPEN 24/7 · M3S", 256, 490);
      break;
    }
    case "rickshaw": {
      const cx = 256, cy = 190;
      ctx.fillStyle = ink;
      for (let i = 0; i < 12; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 6);
        ctx.beginPath();
        ctx.ellipse(0, -92, 26, 62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = ink2;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 + Math.PI / 12;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 118, cy + Math.sin(a) * 118, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFC23D";
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      fitText(ctx, p.print.title, D, 460, 130);
      ctx.fillText(p.print.title, 256, 430);
      ctx.fillStyle = ink2;
      ctx.font = B(34);
      ctx.fillText(`— ${p.print.sub} —`, 256, 490);
      break;
    }
    case "wave": {
      for (let r = 0; r < 7; r++) {
        ctx.strokeStyle = r % 2 ? ink2 : ink;
        ctx.lineWidth = 9;
        ctx.beginPath();
        for (let x = 30; x <= 482; x += 6) {
          const y = 70 + r * 32 + Math.sin(x / 34 + r * 0.9) * 12;
          if (x === 30) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // rain drops
      ctx.fillStyle = ink;
      for (let i = 0; i < 9; i++) {
        const x = 60 + i * 49, y = 20 + (i % 3) * 14;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 9, y + 18, x, y + 24);
        ctx.quadraticCurveTo(x - 9, y + 18, x, y);
        ctx.fill();
      }
      ctx.fillStyle = ink;
      fitText(ctx, p.print.title, D, 440, 150);
      ctx.fillText(p.print.title, 256, 440);
      ctx.fillStyle = ink2;
      ctx.font = M(30);
      ctx.fillText(p.print.sub, 256, 492);
      break;
    }
    case "code": {
      ctx.fillStyle = ink;
      ctx.font = M(200);
      ctx.fillText("</>", 256, 210);
      fitText(ctx, `${p.print.title} ${p.print.sub}`, D, 460, 130);
      ctx.fillText(`${p.print.title} ${p.print.sub}`, 256, 350);
      ctx.fillStyle = ink2;
      ctx.textAlign = "left";
      ctx.font = M(30);
      ctx.fillText("$ npm run ship", 70, 425);
      ctx.fillText("✓ deployed at 3am", 70, 470);
      ctx.fillStyle = ink;
      ctx.fillRect(330, 400, 18, 32);
      break;
    }
    case "stripes": {
      ctx.save();
      ctx.beginPath();
      ctx.arc(256, 200, 170, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = p.tee;
      for (let i = 0; i < 8; i++) {
        const x = 70 + i * 50;
        ctx.beginPath();
        ctx.moveTo(x - 30, 20);
        ctx.quadraticCurveTo(x + 30, 130, x - 6, 200);
        ctx.quadraticCurveTo(x + 40, 280, x + 6, 390);
        ctx.quadraticCurveTo(x + 10, 260, x - 14, 200);
        ctx.quadraticCurveTo(x + 6, 120, x - 30, 20);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = ink2;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(256, 200, 180, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ink;
      fitText(ctx, p.print.title, D, 470, 110);
      ctx.fillText(p.print.title, 256, 460);
      ctx.fillStyle = ink2;
      ctx.font = B(30);
      ctx.fillText(p.print.sub, 256, 505);
      break;
    }
    case "arch": {
      ctx.strokeStyle = ink;
      for (let i = 0; i < 3; i++) {
        const w = 300 - i * 70, h = 300 - i * 60, x = 256 - w / 2, base = 340;
        ctx.lineWidth = i === 0 ? 10 : 6;
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x, base - h * 0.5);
        ctx.quadraticCurveTo(x, base - h * 0.95, 256, base - h);
        ctx.quadraticCurveTo(x + w, base - h * 0.95, x + w, base - h * 0.5);
        ctx.lineTo(x + w, base);
        ctx.stroke();
      }
      ctx.fillStyle = ink2;
      ctx.beginPath();
      ctx.arc(256, 250, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillRect(60, 340, 392, 8);
      fitText(ctx, p.print.title, D, 440, 120);
      ctx.fillText(p.print.title, 256, 450);
      ctx.font = M(30);
      ctx.fillText(p.print.sub, 256, 500);
      break;
    }
  }
  ctx.restore();
}

/** Returns a transparent canvas containing only the print */
export function makePrintCanvas(p: Product, size: number, f: ArtFonts, img?: CanvasImageSource | null) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  if (img) drawContain(ctx, img, 0, 0, size, size);
  else if (p.print.motif !== "none") drawPrint(ctx, p, size, f);
  return c;
}

/* ------------------------------------------------------------------ */
/* Flat 2D tee (product cards, cart thumbnails)                        */
/* ------------------------------------------------------------------ */
export function drawFlatTee(ctx: CanvasRenderingContext2D, p: Product, W: number, H: number, f: ArtFonts, back = false, imgs: ArtImages = {}) {
  ctx.clearRect(0, 0, W, H);
  const s = Math.min((W * 0.86) / TEE_W, (H * 0.86) / TEE_H);
  const ox = (W - TEE_W * s) / 2;
  const oy = (H - TEE_H * s) / 2;
  const map = (x: number, y: number): [number, number] => [ox + x * s, oy + y * s];

  // drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 30 * (s / 4);
  ctx.shadowOffsetY = 10 * (s / 4);
  ctx.beginPath();
  traceTee(ctx, map);
  ctx.fillStyle = p.tee;
  ctx.fill();
  ctx.restore();

  // fabric shading
  ctx.save();
  ctx.beginPath();
  traceTee(ctx, map);
  ctx.clip();
  const g = ctx.createLinearGradient(ox, 0, ox + TEE_W * s, 0);
  g.addColorStop(0, "rgba(0,0,0,0.22)");
  g.addColorStop(0.22, "rgba(0,0,0,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.08)");
  g.addColorStop(0.78, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // folds
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 2 * (s / 4);
  for (const [x1, y1, x2, y2] of [
    [26, 60, 34, 104],
    [74, 58, 66, 102],
    [22, 36, 30, 44],
    [78, 36, 70, 44],
  ]) {
    ctx.beginPath();
    ctx.moveTo(...map(x1, y1));
    ctx.quadraticCurveTo(...map((x1 + x2) / 2 + 3, (y1 + y2) / 2), ...map(x2, y2));
    ctx.stroke();
  }
  ctx.restore();

  // outline for light tees
  ctx.save();
  ctx.beginPath();
  traceTee(ctx, map);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // neck rib
  ctx.beginPath();
  ctx.moveTo(...map(36, 3));
  ctx.quadraticCurveTo(...map(50, back ? 8 : 16), ...map(64, 3));
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 3 * (s / 4);
  ctx.stroke();
  ctx.restore();

  // print
  const box = PRINT_BOX;
  if (back && imgs.back) {
    const size = box.size * s;
    const [px, py] = map(box.x, box.y - 6);
    drawContain(ctx, imgs.back, px, py, size, size);
  } else if (back) {
    ctx.save();
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.9;
    ctx.font = `italic 800 ${5 * s}px ${f.display}`;
    ctx.textAlign = "center";
    ctx.fillText(f.brand ?? "M3S", ...map(50, 20));
    ctx.restore();
  } else {
    const size = box.size * s;
    const pc = makePrintCanvas(p, Math.ceil(size * 2), f, imgs.front);
    const [px, py] = map(box.x, box.y);
    ctx.drawImage(pc, px, py, size, size);
  }
}

/* ------------------------------------------------------------------ */
/* Sampled outline (for the 3D pillow geometry)                        */
/* ------------------------------------------------------------------ */
export function sampleTeeOutline(stepsPerCurve = 24, neckDip = 16): [number, number][] {
  const pts: [number, number][] = [];
  let px = 0, py = 0;
  const rec: PathTarget = {
    moveTo(x, y) { px = x; py = y; pts.push([x, y]); },
    lineTo(x, y) {
      const n = Math.max(2, Math.ceil(Math.hypot(x - px, y - py) / 1.5));
      for (let i = 1; i <= n; i++) pts.push([px + ((x - px) * i) / n, py + ((y - py) * i) / n]);
      px = x; py = y;
    },
    quadraticCurveTo(cx, cy, x, y) {
      for (let i = 1; i <= stepsPerCurve; i++) {
        const t = i / stepsPerCurve, u = 1 - t;
        pts.push([u * u * px + 2 * u * t * cx + t * t * x, u * u * py + 2 * u * t * cy + t * t * y]);
      }
      px = x; py = y;
    },
  };
  traceTee(rec, (x, y) => [x, y], neckDip);
  return pts;
}

/** Bounding box (tee units) shared by the 3D UVs and the texture canvas */
export const TEX_BOX = { x0: -2, y0: -2, x1: 102, y1: 112 };
export const BACK_NECK_DIP = 7;

/**
 * Full fabric texture for one side of the 3D tee: silhouette (alpha) + colour
 * + print. `side = "back"` is drawn mirrored so it reads correctly from behind.
 */
export function drawTeeTexture(p: Product, side: "front" | "back", width: number, f: ArtFonts, imgs: ArtImages = {}) {
  const { x0, y0, x1, y1 } = TEX_BOX;
  const k = width / (x1 - x0);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.round((y1 - y0) * k);
  const ctx = c.getContext("2d")!;
  if (side === "back") {
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
  }
  const map = (x: number, y: number): [number, number] => [(x - x0) * k, (y - y0) * k];

  // fabric
  ctx.beginPath();
  traceTee(ctx, map, side === "front" ? 16 : BACK_NECK_DIP);
  ctx.closePath();
  ctx.fillStyle = p.tee;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // subtle knit noise
  const noise = ctx.createImageData(c.width, c.height);
  for (let i = 0; i < noise.data.length; i += 4) {
    const v = Math.random() * 255;
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = v;
    noise.data[i + 3] = 10;
  }
  const tmp = document.createElement("canvas");
  tmp.width = c.width; tmp.height = c.height;
  tmp.getContext("2d")!.putImageData(noise, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  // hem + sleeve stitch lines
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 0.35 * k;
  ctx.setLineDash([1.2 * k, 0.8 * k]);
  const line = (ax: number, ay: number, bx: number, by: number) => {
    ctx.beginPath(); ctx.moveTo(...map(ax, ay)); ctx.lineTo(...map(bx, by)); ctx.stroke();
  };
  line(20, 106.5, 80, 106.5);
  line(2.2, 30.5, 13.4, 39.6);
  line(97.8, 30.5, 86.6, 39.6);
  ctx.setLineDash([]);
  // collar rib
  ctx.lineWidth = 2.2 * k;
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.moveTo(...map(36, 3));
  ctx.quadraticCurveTo(...map(50, side === "front" ? 16 : BACK_NECK_DIP), ...map(64, 3));
  ctx.stroke();
  ctx.restore();

  if (side === "front") {
    const s = PRINT_BOX.size * k;
    const pc = makePrintCanvas(p, Math.ceil(s * 1.5), f, imgs.front);
    ctx.drawImage(pc, ...map(PRINT_BOX.x, PRINT_BOX.y), s, s);
  } else if (imgs.back) {
    const s = 60 * k;
    const [bx, by] = map(20, 16);
    drawContain(ctx, imgs.back, bx, by, s, s * 1.25);
  } else {
    drawBackLabel(ctx, p, f, map, k);
  }
  return c;
}

/** Back of the tee: brand mark + spec block (like a can's side label) */
function drawBackLabel(
  ctx: CanvasRenderingContext2D,
  p: Product,
  f: ArtFonts,
  map: (x: number, y: number) => [number, number],
  k: number,
) {
  const [cx] = map(50, 0);
  ctx.textAlign = "center";
  ctx.fillStyle = p.ink;
  ctx.font = `italic 800 ${9 * k}px ${f.display}`;
  ctx.fillText(f.brand ?? "M3S", cx, map(0, 24)[1]);
  ctx.font = `600 ${2.2 * k}px ${f.mono}`;
  ctx.fillStyle = p.ink2;
  ctx.fillText(p.name.toUpperCase(), cx, map(0, 29)[1]);

  const rows: [string, string][] = [
    ["HEAVY COTTON", `${p.gsm} GSM`],
    ["SOFT PRINTS", "50+ WASHES"],
    ["SMALL DROPS", "300 PCS"],
    ["TESTED FIT", p.fit.split(",")[0].toUpperCase()],
  ];
  let y = 40;
  for (const [a, b] of rows) {
    ctx.fillStyle = p.ink;
    ctx.font = `italic 800 ${3.6 * k}px ${f.display}`;
    ctx.fillText(a, cx, map(0, y)[1]);
    ctx.fillStyle = p.ink2;
    ctx.font = `500 ${1.9 * k}px ${f.mono}`;
    ctx.fillText(b, cx, map(0, y + 3.4)[1]);
    y += 11;
  }
  ctx.font = `500 ${1.6 * k}px ${f.mono}`;
  ctx.fillStyle = p.ink2;
  ctx.fillText(`DESIGNED BY ${(f.brand ?? "M3S").toUpperCase()}`, cx, map(0, 96)[1]);
}
