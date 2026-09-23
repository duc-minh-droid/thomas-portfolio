import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export { gsap, ScrollTrigger };

export const root = document.documentElement;
export const motion = root.classList.contains("motion");
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

export const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  scope.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<T>(sel)];

/** resolve `var(--x)` to a real colour (SVG attributes / rough-notation need literals) */
export const cssColor = (c: string) => {
  const m = c.match(/var\((--[\w-]+)\)/);
  return m ? getComputedStyle(root).getPropertyValue(m[1]).trim() || "#25221f" : c;
};

/** ink a doodle's strokes in (paths use pathLength=1) */
export const drawIn = (el: Element, duration = 0.9, delay = 0) => {
  const lines = el.querySelectorAll("path:not(.solid)");
  const fills = el.querySelectorAll("path.solid");
  if (!lines.length && !fills.length) return;
  if (!motion) return gsap.set(lines, { strokeDashoffset: 0 });
  // solid fills (character colours) wash in behind the pencil lines
  if (fills.length) gsap.to(fills, { opacity: 1, duration: duration * 0.7, delay: delay + duration * 0.35, ease: "power1.out" });
  return gsap.to(lines, {
    strokeDashoffset: 0,
    duration,
    delay,
    ease: "power2.inOut",
    stagger: { each: Math.min(0.04, duration / Math.max(lines.length, 1)) },
  });
};

/** hide now, animate in when scrolled to; clears transforms afterwards so CSS hovers work */
export const revealOnScroll = (
  targets: HTMLElement[],
  from: gsap.TweenVars,
  opts: { trigger?: Element; start?: string; stagger?: number; duration?: number; ease?: string; onStart?: () => void } = {},
) => {
  if (!motion || !targets.length) return;
  gsap.set(targets, { ...from, transition: "none" });
  ScrollTrigger.create({
    trigger: opts.trigger ?? targets[0],
    start: opts.start ?? "top 85%",
    once: true,
    onEnter: () => {
      opts.onStart?.();
      gsap.to(targets, {
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: opts.duration ?? 0.9,
        ease: opts.ease ?? "expo.out",
        stagger: opts.stagger ?? 0.1,
        clearProps: "transform,transition,opacity",
      });
    },
  });
};

export const safe = (name: string, fn: () => void) => {
  try {
    fn();
  } catch (err) {
    console.error(`[motion:${name}]`, err);
    root.classList.remove("motion");
  }
};

export const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** smooth path through points (Catmull-Rom → cubic Bézier) */
export const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};
