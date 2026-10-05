/**
 * "Pillow" tee mesh — a dense grid shaped by a distance field of the tee
 * outline, so the shirt looks soft and rounded (not a flat extrusion).
 * The silhouette itself comes from the texture alpha (alphaTest), which keeps
 * edges razor sharp. Front and back share the same outline, so they meet at
 * the seam with no side walls.
 */
import * as THREE from "three";
import type { Product } from "@/lib/products";
import { BACK_NECK_DIP, TEX_BOX, TEE_H, TEE_W, drawTeeTexture, loadArtImages, sampleTeeOutline, type ArtFonts } from "@/lib/tee-art";

export const UNIT = 0.04; // tee units → world units

const NX = 104;
const NY = 114;
const PUFF_H = 3.4;
const PUFF_R = 11;
const BEND = 0.0018;

function inside(poly: [number, number][], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function distField(poly: [number, number][], x: number, y: number) {
  let m = Infinity;
  for (let i = 0; i < poly.length; i += 2) {
    const dx = poly[i][0] - x;
    const dy = poly[i][1] - y;
    const d = dx * dx + dy * dy;
    if (d < m) m = d;
  }
  return Math.sqrt(m);
}

function buildSide(side: "front" | "back") {
  const poly = sampleTeeOutline(24, side === "front" ? 16 : BACK_NECK_DIP);
  const { x0, y0, x1, y1 } = TEX_BOX;
  const pos = new Float32Array((NX + 1) * (NY + 1) * 3);
  const uv = new Float32Array((NX + 1) * (NY + 1) * 2);
  let pi = 0;
  let ui = 0;
  for (let j = 0; j <= NY; j++) {
    const y = y0 + ((y1 - y0) * j) / NY;
    for (let i = 0; i <= NX; i++) {
      const x = x0 + ((x1 - x0) * i) / NX;
      const bend = -BEND * (x - TEE_W / 2) ** 2 - 0.0006 * (y - 20) ** 2 * 0.2;
      let z = bend;
      if (inside(poly, x, y)) {
        const p = Math.min(distField(poly, x, y) / PUFF_R, 1);
        const puff = PUFF_H * (1 - (1 - p) ** 2.2);
        // soft folds: vertical drape + diagonal creases toward the armpits
        const drape = 0.35 * Math.sin(x * 0.21 + Math.sin(y * 0.05) * 2) * Math.min(1, (y - 30) / 40) * p;
        const crease =
          0.5 * Math.exp(-(((x - 26) - (y - 40) * 0.35) ** 2) / 6) * p * (y > 34 && y < 70 ? 1 : 0) +
          0.5 * Math.exp(-(((x - 74) + (y - 40) * 0.35) ** 2) / 6) * p * (y > 34 && y < 70 ? 1 : 0);
        z = side === "front" ? bend + puff + drape - crease : bend - puff * 0.85 + drape * 0.6;
      }
      pos[pi++] = (x - TEE_W / 2) * UNIT;
      pos[pi++] = -(y - TEE_H / 2) * UNIT;
      pos[pi++] = z * UNIT;
      uv[ui++] = (x - x0) / (x1 - x0);
      uv[ui++] = 1 - (y - y0) / (y1 - y0);
    }
  }
  const idx: number[] = [];
  const row = NX + 1;
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
      if (side === "front") idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

let cachedGeo: { front: THREE.BufferGeometry; back: THREE.BufferGeometry } | null = null;
export function getTeeGeometry() {
  if (!cachedGeo) cachedGeo = { front: buildSide("front"), back: buildSide("back") };
  return cachedGeo;
}

export type TeeTextures = { front: THREE.CanvasTexture; back: THREE.CanvasTexture };

export async function makeTeeTextures(p: Product, fonts: ArtFonts, width = 768): Promise<TeeTextures> {
  const imgs = await loadArtImages(p);
  const mk = (side: "front" | "back") => {
    const t = new THREE.CanvasTexture(drawTeeTexture(p, side, width, fonts, imgs));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { front: mk("front"), back: mk("back") };
}

let knit: THREE.CanvasTexture | null = null;
function knitBump() {
  if (knit) return knit;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const v = 128 + Math.sin((x / 128) * Math.PI * 64) * 24 + (Math.random() - 0.5) * 40;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  knit = new THREE.CanvasTexture(c);
  knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
  knit.repeat.set(10, 10);
  return knit;
}

function fabricMaterial(map: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({
    map,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.88,
    metalness: 0,
    sheen: 0.5,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color("#ffffff").multiplyScalar(0.25),
    bumpMap: knitBump(),
    bumpScale: 0.35,
  });
}

/** A tee = group(front mesh, back mesh). `setTextures` swaps the design. */
export class TeeMesh extends THREE.Group {
  front: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  back: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  constructor(tex: TeeTextures) {
    super();
    const g = getTeeGeometry();
    this.front = new THREE.Mesh(g.front, fabricMaterial(tex.front));
    this.back = new THREE.Mesh(g.back, fabricMaterial(tex.back));
    this.add(this.front, this.back);
  }
  setTextures(tex: TeeTextures) {
    if (this.front.material.map === tex.front) return;
    this.front.material.map = tex.front;
    this.back.material.map = tex.back;
    this.front.material.needsUpdate = true;
    this.back.material.needsUpdate = true;
  }
  /** multiply colour (1 = full brightness) */
  setShade(v: number) {
    this.front.material.color.setScalar(v);
    this.back.material.color.setScalar(v);
  }
  disposeMaterials() {
    this.front.material.dispose();
    this.back.material.dispose();
  }
}
