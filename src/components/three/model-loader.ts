/**
 * Uploaded .glb support. Models are centred and scaled to the same footprint
 * as the procedural tee (≈4 × 4.4 world units) so they drop into every pose.
 * Draco + Meshopt compressed files are supported (decoders in /public/draco).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

let loader: GLTFLoader | null = null;
function getLoader() {
  if (loader) return loader;
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

const cache = new Map<string, Promise<THREE.Group | null>>();

/** Load once per URL; returns the normalised template scene (clone before use). */
export function loadModel(url: string): Promise<THREE.Group | null> {
  if (!url) return Promise.resolve(null);
  let p = cache.get(url);
  if (!p) {
    p = getLoader()
      .loadAsync(url)
      .then((gltf) => {
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const k = Math.min(4 / (size.x || 1), 4.4 / (size.y || 1));
        root.position.sub(center);
        const wrap = new THREE.Group();
        wrap.add(root);
        wrap.scale.setScalar(k);
        const holder = new THREE.Group();
        holder.add(wrap);
        return holder;
      })
      .catch((e) => {
        console.warn("[M3S] could not load model", url, e);
        return null;
      });
    cache.set(url, p);
  }
  return p;
}

/** A cloned model with its own materials so it can be dimmed independently. */
export class ModelObject extends THREE.Group {
  private mats: { m: THREE.Material & { color?: THREE.Color }; base: THREE.Color | null }[] = [];

  constructor(template: THREE.Group, opts: { scale?: number; rotY?: number } = {}) {
    super();
    const inner = template.clone(true);
    inner.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const cloned = arr.map((m) => {
        const c = m.clone() as THREE.Material & { color?: THREE.Color };
        this.mats.push({ m: c, base: c.color ? c.color.clone() : null });
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
    });
    inner.scale.multiplyScalar(opts.scale ?? 1);
    inner.rotation.y = THREE.MathUtils.degToRad(opts.rotY ?? 0);
    this.add(inner);
  }

  setShade(v: number) {
    for (const { m, base } of this.mats) if (m.color && base) m.color.copy(base).multiplyScalar(v);
  }

  disposeMaterials() {
    this.mats.forEach(({ m }) => m.dispose());
  }
}
