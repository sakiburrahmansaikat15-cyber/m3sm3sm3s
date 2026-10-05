/**
 * Product-page viewer: one pillow tee, drag to rotate, soft float.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Product } from "@/lib/types";
import type { ArtFonts } from "@/lib/tee-art";
import { TeeMesh, makeTeeTextures, type TeeTextures } from "./tee-mesh";
import { ModelObject, loadModel } from "./model-loader";

export class TeeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private tee: (THREE.Object3D & { disposeMaterials(): void }) | null = null;
  private pivot = new THREE.Group();
  private tex: TeeTextures | null = null;
  private disposed = false;
  private raf = 0;
  private last = 0;
  private time = 0;
  private intro = 0;
  private drag = { active: false, x: 0, v: 0.004, rot: -0.6 };
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private visible = true;

  constructor(private host: HTMLElement, product: Product, fonts: ArtFonts, defaultModelUrl = "") {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%;cursor:grab;touch-action:pan-y";
    host.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
    pmrem.dispose();
    const key = new THREE.SpotLight(0xffffff, 60, 30, 0.6, 0.8);
    key.position.set(2, 8, 8);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3);
    rim.position.set(-6, 3, -5);
    this.scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

    this.scene.add(this.pivot);
    void this.build(product, fonts, defaultModelUrl);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(host);
    this.resize();

    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    this.loop();
  }

  private async build(product: Product, fonts: ArtFonts, defaultModelUrl: string) {
    const url = product.modelUrl || defaultModelUrl;
    const model = url ? await loadModel(url) : null;
    if (this.disposed) return;
    if (model) {
      this.tee = new ModelObject(model, { scale: product.modelScale, rotY: product.modelRotY });
    } else {
      this.tex = await makeTeeTextures(product, fonts, 1024);
      if (this.disposed) return;
      this.tee = new TeeMesh(this.tex);
    }
    this.pivot.add(this.tee);
    this.intro = 0;
  }

  /** rotate so the back label faces the camera (or the front) */
  showSide(side: "front" | "back") {
    const target = side === "back" ? Math.PI : 0;
    const turns = Math.round((this.drag.rot - target) / (Math.PI * 2));
    this.drag.rot = target + turns * Math.PI * 2;
    this.drag.v = 0;
  }

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const fit = Math.max(6.4 / 2 / Math.tan((15 * Math.PI) / 180), 5.4 / 2 / Math.tan((15 * Math.PI) / 180) / this.camera.aspect);
    this.camera.position.set(0, 0, fit);
    this.camera.updateProjectionMatrix();
  }

  private onDown = (e: PointerEvent) => {
    this.drag.active = true;
    this.drag.x = e.clientX;
    this.drag.v = 0;
    this.renderer.domElement.style.cursor = "grabbing";
  };
  private onMove = (e: PointerEvent) => {
    if (!this.drag.active) return;
    const dx = e.clientX - this.drag.x;
    this.drag.x = e.clientX;
    this.drag.v = dx * 0.01;
    this.drag.rot += this.drag.v;
  };
  private onUp = () => {
    this.drag.active = false;
    this.renderer.domElement.style.cursor = "grab";
  };

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now() / 1000;
    const dt = this.last ? Math.min(now - this.last, 0.05) : 0.016;
    this.last = now;
    if (!this.visible) return;
    this.time += dt;
    this.intro = Math.min(1, this.intro + dt * 0.8);
    const e = 1 - Math.pow(1 - this.intro, 4);
    if (!this.drag.active) {
      this.drag.v *= 0.95;
      this.drag.rot += this.drag.v;
    }
    this.pivot.rotation.set(0.08 + Math.sin(this.time * 0.8) * 0.03, this.drag.rot * e, -0.06 + Math.sin(this.time * 0.6) * 0.02);
    this.pivot.position.y = Math.sin(this.time * 1.1) * 0.08 - (1 - e) * 1.2;
    this.pivot.scale.setScalar(0.6 + 0.4 * e);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.disposed = true;
    this.tex?.front.dispose();
    this.tex?.back.dispose();
    this.tee?.disposeMaterials();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
