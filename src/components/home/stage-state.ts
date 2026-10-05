/**
 * Shared, mutable choreography state for the homepage.
 * GSAP ScrollTriggers tween `stage.pose`; the three.js stage and the fixed
 * backdrop read it every frame. Poses come from defaults + admin overrides
 * (Admin → Sections → 3D poses).
 */
import { defaultPoses } from "@/lib/defaults";
import type { Pose, PoseKey } from "@/lib/types";

export type { Pose };

export const POSES: Record<string, Pose> = { ...defaultPoses };

/** Merge admin overrides into POSES (called once on the homepage). */
export function applyPoseOverrides(over: Partial<Record<PoseKey, Partial<Pose>>>) {
  for (const k of Object.keys(defaultPoses) as PoseKey[]) {
    POSES[k] = { ...defaultPoses[k], ...(over[k] ?? {}) };
  }
}

/** Benefit sections beyond the 4 designed poses reuse them in a loop. */
export function poseFor(key: string): Pose {
  if (POSES[key]) return POSES[key];
  const m = key.match(/^benefit(\d+)$/);
  if (m) return POSES[`benefit${Number(m[1]) % 4}`];
  return POSES.carousel;
}

export const stage = {
  pose: { ...defaultPoses.carousel } as Pose,
  active: 0, // product selected in the carousel
  ringTarget: 0,
  cycle: false,
  cycleIndex: 0,
  benefit: 0,
  section: "carousel",
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach((l) => l());
  },
};
