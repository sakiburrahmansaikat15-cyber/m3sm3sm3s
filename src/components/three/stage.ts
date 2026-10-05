/**
 * Homepage 3D stage — one fixed full-screen canvas behind every section.
 * Reads `stage.pose` (tweened by GSAP ScrollTriggers) each frame.
 *
 *  - hero        : the selected design (close-ups, back label, argument, last)
 *  - ring items  : N products on a curved arc (carousel) that morph into a
 *                  diagonal line (full range) via `pose.wave`
 *  - podiums     : ceiling + floor discs framing the carousel
 *
 * Each product renders either the procedural pillow tee (with its coded or
 * uploaded print) or an uploaded .glb model (product → site default).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Product } from "@/lib/types";
import type { ArtFonts } from "@/lib/tee-art";
import { stage } from "@/components/home/stage-state";
import { TeeMesh, makeTeeTextures, type TeeTextures } from "./tee-mesh";
import { ModelObject, loadModel } from "./model-loader";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);

type Shadeable = THREE.Object3D & { setShade(v: number): void; disposeMaterials(): void };

export type StageOptions = { ringCount: number; defaultModelUrl: string; showPodiums: boolean };

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private textures: TeeTextures[] = [];
  private heroPivot = new THREE.Group();
  private heroes: Shadeable[] = [];
  private ring: Shadeable[] = [];
  private ringRot = 0;
  private podTop = new THREE.Group();
  private podBottom = new THREE.Group();
  private raf = 0;
  private last = 0;
  private time = 0;
  private pointer = new THREE.Vector2();
  private tilt = new THREE.Vector2();
  private heroProduct = -1;
  private spin = 0;
  private ro: ResizeObserver;
  private frames = 0;
  private ready = false;
  private disposed = false;

  constructor(
    private host: HTMLElement,
    private products: Product[],
    private fonts: ArtFonts,
    private opts: StageOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    const key = new THREE.SpotLight(0xffffff, 60, 30, 0.6, 0.8);
    key.position.set(0, 9, 8);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(-6, 3, -5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(5, -2, 6);
    this.scene.add(key, key.target, rim, fill, new THREE.AmbientLight(0xffffff, 0.12));
    this.scene.add(this.heroPivot);

    if (opts.showPodiums) this.buildPodiums();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.loop();
    void this.init();
  }

  /** Build every product object (textures + optional GLB models). */
  private async init() {
    const N = this.products.length;
    if (!N) return this.markReady();
    const makers: (() => Shadeable)[] = await Promise.all(
      this.products.map(async (p, i) => {
        const url = p.modelUrl || this.opts.defaultModelUrl;
        const model = url ? await loadModel(url) : null;
        if (model) return () => new ModelObject(model, { scale: p.modelScale, rotY: p.modelRotY });
        const tex = await makeTeeTextures(p, this.fonts);
        this.textures[i] = tex;
        return () => new TeeMesh(tex);
      }),
    );
    if (this.disposed) return;

    this.heroes = makers.map((make) => {
      const o = make();
      o.visible = false;
      this.heroPivot.add(o);
      return o;
    });
    const count = Math.max(N, Math.min(24, Math.round(this.opts.ringCount / N) * N || N));
    for (let i = 0; i < count; i++) {
      const o = makers[i % N]();
      this.ring.push(o);
      this.scene.add(o);
    }
    this.markReady();
  }

  private markReady() {
    this.ready = true;
  }

  /* ---------------- podiums ---------------- */
  private buildPodiums() {
    const metal = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.9, roughness: 0.28 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xdadada, metalness: 1, roughness: 0.15 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const make = (g: THREE.Group, flip: boolean) => {
      const s = flip ? -1 : 1;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.34, 72), metal);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.035, 12, 96), chrome);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = 0.17 * s;
      const step = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.18, 72), metal);
      step.position.y = 0.26 * s;
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.014, 8, 96), glow);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.y = 0.36 * s;
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 96), glow);
      ring2.rotation.x = Math.PI / 2;
      ring2.position.y = 0.36 * s;
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.7, 0.3, 72), metal);
      lower.position.y = -0.32 * s;
      g.add(base, lip, step, ring1, ring2, lower);
    };
    make(this.podBottom, false);
    make(this.podTop, true);
    this.podTop.scale.setScalar(0.85);
    this.scene.add(this.podTop, this.podBottom);
  }

  /* ---------------- sizing ---------------- */
  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const z = w / h < 1 ? Math.min(24, 13 / Math.max(0.45, (w / h) * 1.25)) : 13;
    this.camera.position.set(0, 0, z);
    this.camera.updateProjectionMatrix();
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  /* ---------------- frame ---------------- */
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now() / 1000;
    const dt = this.last ? Math.min(now - this.last, 0.05) : 0.016;
    this.last = now;
    this.time += dt;
    const t = this.time;
    const P = stage.pose;
    const N = this.products.length || 1;

    this.tilt.x += (this.pointer.x - this.tilt.x) * Math.min(1, dt * 2.5);
    this.tilt.y += (this.pointer.y - this.tilt.y) * Math.min(1, dt * 2.5);

    if (this.ready && this.heroes.length) {
      // ---- which design does the hero wear?
      const want = stage.cycle ? stage.cycleIndex % N : ((stage.active % N) + N) % N;
      if (want !== this.heroProduct) {
        if (this.heroProduct !== -1 && stage.cycle) this.spin += Math.PI * 2;
        this.heroes.forEach((h, i) => (h.visible = i === want));
        this.heroProduct = want;
      }
      this.spin *= Math.pow(0.02, dt);

      // ---- hero
      const hs = P.hs * smooth(Math.min(1, Math.max(0, P.hero)));
      this.heroPivot.visible = hs > 0.002;
      this.heroPivot.position.set(P.hx + this.tilt.x * 0.08, P.hy + Math.sin(t * 1.1) * 0.06, P.hz);
      this.heroPivot.rotation.set(P.hrx + this.tilt.y * 0.08, P.hry + this.spin + this.tilt.x * 0.25, P.hrz + Math.sin(t * 0.7) * 0.02);
      this.heroPivot.scale.setScalar(Math.max(0.0001, hs));

      // ---- ring / range
      const RING = this.ring.length;
      this.ringRot += (stage.ringTarget - this.ringRot) * Math.min(1, dt * 5);
      const ringVis = smooth(Math.min(1, Math.max(0, P.ring)));
      const w = smooth(Math.min(1, Math.max(0, P.wave)));
      const step = (Math.PI * 2) / Math.max(RING, 8);
      const radius = 6.2 * Math.max(1, RING / 12);
      for (let i = 0; i < RING; i++) {
        const m = this.ring[i];
        let rel = i - this.ringRot;
        rel = ((((rel + RING / 2) % RING) + RING) % RING) - RING / 2;
        const th = rel * step;
        const ax = Math.sin(th) * radius;
        const az = (Math.cos(th) - 1) * 4.2;
        const ay = -0.1 + Math.abs(Math.sin(th)) * 0.4 + Math.sin(t * 0.9 + i) * 0.05;
        const arY = th * 0.9 + Math.sin(i * 1.7) * 0.4;
        const arZ = Math.sin(i * 2.3) * 0.35 + (Math.abs(rel) < 0.5 ? -0.2 : 0);
        const front = Math.max(0, Math.cos(th));
        const k = i - (RING - 1) / 2;
        const spread = 15.6 / Math.max(RING, 1);
        const wx = k * spread;
        const wy = -0.2 + k * spread * 0.22 + Math.sin(k * 0.5) * 0.35;
        const wz = -1.2 + Math.cos(k * 0.35) * 1.2;

        m.position.set(lerp(ax, wx, w), lerp(ay, wy, w) + P.ringLift * 7, lerp(az, wz, w));
        m.rotation.set(lerp(0.08, 0.12, w), lerp(arY, -0.45 + k * 0.02, w), lerp(arZ, -0.22, w));
        const s = lerp(lerp(0.62, 1, Math.pow(front, 3)), 0.6, w) * ringVis;
        const hideFront = Math.abs(rel) < 0.5 ? 1 - Math.min(1, P.hero * 3) : 1;
        m.scale.setScalar(Math.max(0.0001, s * hideFront));
        m.visible = s * hideFront > 0.003;
        m.setShade(lerp(lerp(0.18, 1, Math.pow(front, 4)), 1, w));
      }
    }

    // ---- podiums
    const pv = smooth(Math.min(1, Math.max(0, P.podium)));
    this.podTop.visible = this.podBottom.visible = pv > 0.01;
    this.podBottom.position.set(0, -2.95 - (1 - pv) * 5, -0.4);
    const portrait = this.camera.aspect < 1;
    this.podTop.position.set(0, (portrait ? 5.6 : 4.05) + (1 - pv) * 5, -1.6);
    this.podBottom.rotation.set(0.2, t * 0.2, 0);
    this.podTop.rotation.set(-0.5, -t * 0.2, 0);

    this.renderer.render(this.scene, this.camera);
    if (this.ready && ++this.frames === 2) {
      (window as unknown as { __m3sStageReady?: boolean }).__m3sStageReady = true;
      window.dispatchEvent(new Event("m3s:stage-ready"));
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    window.removeEventListener("pointermove", this.onPointer);
    this.textures.forEach((x) => {
      x?.front.dispose();
      x?.back.dispose();
    });
    [...this.heroes, ...this.ring].forEach((m) => m.disposeMaterials());
    [this.podTop, this.podBottom].forEach((g) =>
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      }),
    );
    (window as unknown as { __m3sStageReady?: boolean }).__m3sStageReady = false;
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
