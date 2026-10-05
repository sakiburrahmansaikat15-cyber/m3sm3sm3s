"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProducts, useSettings } from "@/components/providers/SiteData";
import { applyPoseOverrides, poseFor, stage } from "./stage-state";

gsap.registerPlugin(ScrollTrigger);

/**
 * One scrubbed tween per section: pose(prev) → pose(this) while the section
 * scrolls from 85% of the viewport to the top. Sections declare their pose
 * with `data-pose` and their admin id with `data-section`.
 */
export default function Choreography() {
  const settings = useSettings();
  const products = useProducts();

  useEffect(() => {
    applyPoseOverrides(settings.poses);
    const secs = gsap.utils.toArray<HTMLElement>("[data-pose]");
    if (!secs.length) return;
    Object.assign(stage.pose, poseFor(secs[0].dataset.pose!));
    stage.section = secs[0].dataset.section ?? "carousel";
    const N = Math.max(1, products.length);

    let timer: ReturnType<typeof setInterval> | undefined;
    const ctx = gsap.context(() => {
      secs.forEach((sec, i) => {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => {
            if (self.isActive && sec.dataset.section && stage.section !== sec.dataset.section) {
              stage.section = sec.dataset.section;
              stage.emit();
            }
          },
        });
        if (i === 0) return;
        gsap.fromTo(stage.pose, { ...poseFor(secs[i - 1].dataset.pose!) }, {
          ...poseFor(sec.dataset.pose!),
          ease: "power1.inOut",
          immediateRender: false,
          scrollTrigger: { trigger: sec, start: "top 85%", end: "top 5%", scrub: 1.1 },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-benefit]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => {
            if (self.isActive) {
              stage.benefit = Number(el.dataset.benefit);
              stage.emit();
            }
          },
        });
      });

      const arg = document.querySelector<HTMLElement>('[data-pose="argument"]');
      if (arg)
        ScrollTrigger.create({
          trigger: arg,
          start: "top 40%",
          end: "bottom 60%",
          onToggle: (self) => {
            stage.cycle = self.isActive;
            clearInterval(timer);
            if (self.isActive) {
              stage.cycleIndex = ((stage.active % N) + N) % N;
              timer = setInterval(() => {
                stage.cycleIndex = (stage.cycleIndex + 1) % N;
                stage.emit();
              }, Math.max(600, settings.argument.intervalMs));
            }
            stage.emit();
          },
        });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll(".rv"),
          { yPercent: 60, opacity: 0, filter: "blur(8px)" },
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.08,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 30%", toggleActions: "play reverse play reverse" },
          },
        );
      });
    });

    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      clearTimeout(t);
      clearInterval(timer);
      ctx.revert();
      stage.cycle = false;
    };
  }, [settings, products.length]);

  return null;
}
