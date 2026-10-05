"use client";

/**
 * Tiny synthesized soundscape (no audio files): a soft ambient pad and a
 * click for UI interactions. Off by default — browsers need a user gesture.
 */
class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private pad: OscillatorNode[] = [];
  on = false;
  private subs = new Set<(on: boolean) => void>();

  subscribe(fn: (on: boolean) => void) {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }

  toggle() {
    this.on ? this.stop() : this.start();
    this.subs.forEach((f) => f(this.on));
  }

  private start() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx ??= new AC();
    const ctx = this.ctx;
    void ctx.resume();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.connect(this.master);
    this.master.connect(ctx.destination);
    this.pad = [55, 82.4, 110.2, 164.8].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.03;
      const lg = ctx.createGain();
      lg.gain.value = 0.12;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(filter);
      o.start();
      return o;
    });
    this.on = true;
  }

  private stop() {
    if (!this.ctx || !this.master) return;
    const m = this.master;
    m.gain.cancelScheduledValues(this.ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    const pad = this.pad;
    setTimeout(() => pad.forEach((o) => o.stop()), 500);
    this.pad = [];
    this.on = false;
  }

  click(pitch = 1) {
    if (!this.on || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(900 * pitch, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(300 * pitch, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  }
}

export const sound = typeof window !== "undefined" ? new Sound() : (null as unknown as Sound);
