import rough from "roughjs";
import { ScrollTrigger, $, $$, motion, cssColor, revealOnScroll, seeded } from "./core";

const NS = "http://www.w3.org/2000/svg";

export function initMindmap() {
  const map = $("[data-mindmap]");
  if (!map) return;
  const svg = $<SVGSVGElement>(".branches", map)!;
  const hub = $("[data-hub]", map)!;
  const groups = $$("[data-group]", map);
  const gen = rough.generator();
  let progress = motion ? 0 : 1;

  const paint = () => $$<SVGPathElement>("path", svg).forEach((p) => (p.style.strokeDashoffset = String(1 - progress)));

  const build = () => {
    svg.replaceChildren();
    if (matchMedia("(max-width: 1000px)").matches) return;
    // layout boxes (offset*), not getBoundingClientRect: groups may be mid-reveal (transformed)
    svg.setAttribute("viewBox", `0 0 ${map.offsetWidth} ${map.offsetHeight}`);
    const h = { width: hub.offsetWidth, height: hub.offsetHeight };
    const hx = hub.offsetLeft + h.width / 2;
    const hy = hub.offsetTop + h.height / 2;
    const rnd = seeded(11);

    groups.forEach((g, i) => {
      const L = g.offsetLeft, T = g.offsetTop, R = L + g.offsetWidth, B = T + g.offsetHeight;
      const tx = Math.min(Math.max(hx, L + 20), R - 20);
      const ty = Math.min(Math.max(hy, T + 12), B - 12);
      const dx = tx - hx, dy = ty - hy;
      const dist = Math.hypot(dx, dy);
      const sx = hx + (dx / dist) * h.width * 0.36;
      const sy = hy + (dy / dist) * h.height * 0.3;
      const bend = (i % 2 ? 1 : -1) * dist * 0.14;
      const mx = (sx + tx) / 2 - (dy / dist) * bend;
      const my = (sy + ty) / 2 + (dx / dist) * bend;
      const color = cssColor(getComputedStyle(g).getPropertyValue("--accent").trim() || "var(--ink)");

      const curve = gen.curve([[sx, sy], [mx, my], [tx, ty]], { seed: 20 + i, roughness: 1.3, strokeWidth: 2, stroke: color });
      const dot = gen.circle(tx, ty, 10, { seed: 40 + i, fill: color, fillStyle: "solid", stroke: color, roughness: 1.4 });
      for (const info of [...gen.toPaths(curve), ...gen.toPaths(dot)]) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", info.d);
        p.setAttribute("stroke", info.stroke);
        p.setAttribute("stroke-width", String(info.strokeWidth + rnd() * 0.3));
        p.setAttribute("fill", info.fill ?? "none");
        p.setAttribute("pathLength", "1");
        p.style.strokeDasharray = "1 1";
        svg.append(p);
      }
    });
    paint();
  };

  build();
  ScrollTrigger.addEventListener("refresh", build);

  if (motion) {
    ScrollTrigger.create({
      trigger: map,
      start: "top 75%",
      end: "center 45%",
      scrub: 0.5,
      onUpdate: (s) => {
        progress = s.progress;
        paint();
      },
    });
  }

  revealOnScroll([hub], { scale: 0.6, rotation: -12, opacity: 0 }, { trigger: map, start: "top 75%", ease: "back.out(1.8)" });
  groups.forEach((g, i) => {
    revealOnScroll([g], { y: 50, opacity: 0, rotation: i % 2 ? 4 : -4 }, { trigger: g, start: "top 88%" });
    const icons = $$("[data-skill]", g);
    revealOnScroll(icons, { scale: 0.3, rotation: -25, opacity: 0 }, {
      trigger: g,
      start: "top 80%",
      stagger: 0.045,
      duration: 0.6,
      ease: "back.out(2.2)",
    });
  });
}
