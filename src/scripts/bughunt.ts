import { $, $$, motion } from "./core";

// The bug-hunt card in the contact section. The whole scene is a pure function of time (render(t)),
// plus a few one-shot effects at the hammer hits, so it can loop, pause off screen and rebuild on resize.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const easeIn = (u: number) => u * u * u;
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const SVGNS = "http://www.w3.org/2000/svg";

type Pt = { x: number; y: number };
const PERIOD = 22.4;
const FINAL = 19.8; // what reduced-motion shows

// tokens the lens visits first: id, lens arrival, highlight class, connector colour
const SCAN: [string, number, string, string][] = [
  ["m1", 1.2, "fill-magenta", "#ff2fc4"],
  ["m2", 2.0, "box-yellow", "#f2d84a"],
  ["b1", 2.8, "fill-cyan", "#28d7ff"],
  ["m3", 3.6, "box-green", "#b5e83a"],
  ["b2", 4.4, "box-yellow", "#f2d84a"],
  ["b3", 5.2, "box-cyan", "#28d7ff"],
];
const BOX_OFF = 14.8;

// three bugs: token they sit on, when they appear, tag window, hammer hit (null = survives)
const BUGS = [
  { tok: "b1", show: 5.6, tag: [7.0, 8.7], hit: null },
  { tok: "b2", show: 8.8, tag: [10.0, 11.7], hit: 16.5 },
  { tok: "b3", show: 11.8, tag: [13.0, 14.7], hit: 17.5 },
] as const;

export function initBugHunt() {
  const root = $<HTMLElement>("[data-bughunt]");
  if (!root) return;
  const stage = $<HTMLElement>(".bh-stage", root)!;
  const world = $<HTMLElement>(".bh-world", stage)!;
  const lens = $<HTMLElement>(".bh-lens", stage)!;
  const view = $<HTMLElement>(".bh-lens-view", lens)!;
  const lines = $<SVGSVGElement>(".bh-lines", stage)!;
  const tags = $$<HTMLElement>(".bh-tag", stage);
  const hammer = $<HTMLElement>(".bh-hammer", stage)!;
  const fx = $<HTMLElement>(".bh-fx", stage)!;
  const rows = $$<HTMLElement>(".rv-row", root);
  const title = $<HTMLElement>("[data-rv-title]", root)!;
  const sub = $<HTMLElement>("[data-rv-sub]", root)!;

  // the lens shows a live scaled copy of the world; tokens and bugs are driven in both
  const mirror = world.cloneNode(true) as HTMLElement;
  mirror.setAttribute("aria-hidden", "true");
  view.append(mirror);
  const both = (sel: string) => [$<HTMLElement>(sel, world), $<HTMLElement>(sel, mirror)].filter(Boolean) as HTMLElement[];
  const tok = Object.fromEntries(SCAN.map(([id]) => [id, both(`[data-m="${id}"]`)]));
  const bugEls = BUGS.map((_, i) => both(`.bug[data-bug="${i + 1}"]`));
  const connectors = SCAN.map(([, , , color], i) => {
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("pathLength", "1");
    p.style.stroke = color;
    p.style.strokeDasharray = "1 1";
    p.style.strokeDashoffset = "1";
    p.dataset.i = String(i);
    lines.append(p);
    return p;
  });

  // ---------------------------------------------------------------- metrics
  let em = 12;
  let W = 0;
  let H = 0;
  const centers: Record<string, Pt> = {};
  const measure = () => {
    em = parseFloat(getComputedStyle(world).fontSize) || 12;
    W = world.offsetWidth;
    H = world.offsetHeight;
    mirror.style.width = `${W}px`;
    mirror.style.height = `${H}px`;
    for (const [id] of SCAN) {
      const el = tok[id][0];
      centers[id] = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
    }
    hammer.style.width = `${em * 11}px`;
  };
  const bugPos = (i: number): Pt => centers[BUGS[i].tok];

  // ------------------------------------------------------------------ lens
  const D_SCAN = () => em * 7;
  const D_ZOOM = () => em * 14;
  type Way = { t: number; at: () => Pt; d: () => number; m: number };
  const tokWay = (id: string, t: number): Way => ({ t, at: () => centers[id], d: D_SCAN, m: 1.5 });
  const bugWay = (i: number, t: number): Way => ({ t, at: () => bugPos(i), d: D_ZOOM, m: 2.1 });
  const ways: Way[] = [
    { t: 0, at: () => ({ x: W + em * 6, y: -em * 3 }), d: D_SCAN, m: 1.2 },
    tokWay("m1", 1.2),
    tokWay("m2", 2.0),
    tokWay("b1", 2.8),
    tokWay("m3", 3.6),
    tokWay("b2", 4.4),
    tokWay("b3", 5.2),
    bugWay(0, 6.3),
    bugWay(0, 8.4),
    bugWay(1, 9.4),
    bugWay(1, 11.4),
    bugWay(2, 12.4),
    bugWay(2, 14.4),
    { t: 15.3, at: () => ({ x: W + em * 7, y: H * 0.35 }), d: D_SCAN, m: 1.2 },
  ];
  const lensAt = (t: number) => {
    let k = 0;
    while (k < ways.length - 2 && t > ways[k + 1].t) k++;
    const a = ways[k];
    const b = ways[k + 1];
    const u = ease(ramp(t, a.t, b.t));
    const pa = a.at();
    const pb = b.at();
    const drift = Math.sin(t * 1.9) * em * 0.12;
    return {
      x: lerp(pa.x, pb.x, u) + drift,
      y: lerp(pa.y, pb.y, u) + Math.cos(t * 1.5) * em * 0.1,
      d: lerp(a.d(), b.d(), u),
      m: lerp(a.m, b.m, u),
    };
  };

  // ---------------------------------------------------------------- hammer
  // keyframes for the head: position + swing angle (85° raised → 35° strike). easing: strikes snap in.
  type Key = { t: number; x: () => number; y: () => number; a: number; snap?: boolean };
  const above = (i: number, dy: number, dx = 0) => ({ x: () => bugPos(i).x + dx, y: () => bugPos(i).y + dy });
  const keys: Key[] = [
    { t: 15.4, ...above(1, -em * 9, em * 7), a: 90 },
    { t: 16.2, ...above(1, -em * 3.4), a: 85 },
    { t: 16.5, ...above(1, 0), a: 35, snap: true },
    { t: 16.85, ...above(1, -em * 2), a: 62 },
    { t: 17.15, ...above(2, -em * 3.4), a: 85 },
    { t: 17.5, ...above(2, 0), a: 35, snap: true },
    { t: 17.85, ...above(2, -em * 2), a: 62 },
    { t: 18.7, ...above(2, -em * 9, em * 8), a: 90 },
  ];
  const poseAt = (t: number) => {
    let k = 0;
    while (k < keys.length - 2 && t > keys[k + 1].t) k++;
    const a = keys[k];
    const b = keys[k + 1];
    const raw = ramp(t, a.t, b.t);
    const u = b.snap ? easeIn(raw) : ease(raw);
    return { x: lerp(a.x(), b.x(), u), y: lerp(a.y(), b.y(), u), a: lerp(a.a, b.a, u) };
  };

  // --------------------------------------------------------------- effects
  const burst = (p: Pt, color: string) => {
    const ring = document.createElement("i");
    ring.className = "bh-ring-fx";
    ring.style.left = `${p.x}px`;
    ring.style.top = `${p.y}px`;
    fx.append(ring);
    setTimeout(() => ring.remove(), 800);
    for (let k = 0; k < 9; k++) {
      const dot = document.createElement("i");
      const ang = (k / 9) * Math.PI * 2 + Math.random() * 0.5;
      const len = em * (1.6 + Math.random() * 2.2);
      dot.className = "bh-dot";
      dot.style.left = `${p.x}px`;
      dot.style.top = `${p.y}px`;
      dot.style.background = color;
      dot.style.setProperty("--dx", `${Math.cos(ang) * len}px`);
      dot.style.setProperty("--dy", `${Math.sin(ang) * len}px`);
      fx.append(dot);
      setTimeout(() => dot.remove(), 700);
    }
  };
  const hit = (i: number) => {
    stage.classList.remove("is-glitch");
    void stage.offsetWidth; // restart the animation
    stage.classList.add("is-glitch");
    setTimeout(() => stage.classList.remove("is-glitch"), 450);
    burst(bugPos(i), ["#e5383b", "#f4b73a", "#b9c4d0"][i]);
  };

  // ---------------------------------------------------------------- render
  const cache = { open: -1 };
  const render = (t: number) => {
    const tt = t;

    // highlight boxes on the tokens the lens inspects
    SCAN.forEach(([id, arrive, cls]) => {
      const on = tt >= arrive - 0.25 && tt < BOX_OFF;
      tok[id].forEach((el) => el.classList.toggle(cls, on));
    });

    // lens
    const lensOn = tt > 0.1 && tt < 15.4;
    const L = lensAt(tt);
    const R = L.d / 2;
    lens.style.opacity = lensOn ? String(ramp(tt, 0.1, 0.5) * (1 - ramp(tt, 15.0, 15.4))) : "0";
    lens.style.setProperty("--d", `${L.d.toFixed(1)}px`);
    lens.style.transform = `translate(${(L.x - R).toFixed(1)}px, ${(L.y - R).toFixed(1)}px)`;
    mirror.style.transform = `translate(${(R - L.x * L.m).toFixed(1)}px, ${(R - L.y * L.m).toFixed(1)}px) scale(${L.m.toFixed(3)})`;

    // connectors from inspected tokens to the lens
    SCAN.forEach(([id, arrive], i) => {
      const p = connectors[i];
      const a = centers[id];
      const draw = ramp(tt, arrive - 0.25, arrive + 0.3);
      const fade = 1 - ramp(tt, 12.4, 13.4);
      const dx = L.x - a.x;
      const dy = L.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = (i % 2 ? 1 : -1) * len * 0.16;
      const cx = (a.x + L.x) / 2 - (dy / len) * bend;
      const cy = (a.y + L.y) / 2 + (dx / len) * bend;
      p.setAttribute("d", `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${L.x.toFixed(1)} ${L.y.toFixed(1)}`);
      p.style.strokeDashoffset = String(1 - draw);
      p.style.opacity = String(draw > 0 ? fade * 0.9 : 0);
    });

    // bugs
    BUGS.forEach((b, i) => {
      const base = bugPos(i);
      const pop = ramp(tt, b.show, b.show + 0.5);
      const squash = b.hit ? ramp(tt, b.hit, b.hit + 0.35) : 0;
      const gone = b.hit ? ramp(tt, b.hit + 0.25, b.hit + 0.6) : 0;
      const wobble = squash > 0 ? 0 : 1;
      const x = base.x + Math.sin(tt * 2.1 + i * 2) * em * 0.28 * wobble;
      const y = base.y + Math.cos(tt * 1.7 + i) * em * 0.2 * wobble + squash * em * 0.2;
      const r = Math.sin(tt * 3.1 + i * 2.3) * 16 * wobble;
      const s = (0.35 + 0.65 * ease(pop)) * (1 + (i === 0 ? Math.sin(tt * 4) * 0.03 : 0));
      const t3 = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${(s * (1 + 0.7 * squash)).toFixed(3)}, ${(s * (1 - 0.82 * squash)).toFixed(3)})`;
      bugEls[i].forEach((el) => {
        el.style.transform = t3;
        el.style.opacity = String(pop * (1 - gone));
      });
    });

    // tags next to the lens
    tags.forEach((el, i) => {
      const [a, b] = BUGS[i].tag;
      const o = ramp(tt, a, a + 0.3) * (1 - ramp(tt, b, b + 0.4));
      const p = bugPos(i);
      const zr = D_ZOOM() / 2;
      const left = Math.max(4, Math.min(p.x + zr * 0.78, W - el.offsetWidth - 6));
      const top = Math.max(4, Math.min(p.y - zr * 0.95, H - el.offsetHeight - 6));
      el.style.opacity = String(o);
      el.style.transform = `translate(${left.toFixed(1)}px, ${(top + (1 - o) * 6).toFixed(1)}px) scale(${(0.9 + 0.1 * o).toFixed(3)})`;
    });

    // hammer
    const hOn = tt >= keys[0].t - 0.1 && tt <= keys[keys.length - 1].t + 0.2;
    if (hOn) {
      const P = poseAt(clamp(tt, keys[0].t, keys[keys.length - 1].t));
      const w = hammer.offsetWidth;
      const h = (w * 54) / 150;
      const reach = w * 0.74; // pivot (handle end) → head centre
      const rad = (P.a * Math.PI) / 180;
      const px = P.x + reach * Math.cos(rad);
      const py = P.y + reach * Math.sin(rad);
      hammer.style.transform = `translate(${(px - w).toFixed(1)}px, ${(py - h / 2).toFixed(1)}px) rotate(${P.a.toFixed(1)}deg)`;
      hammer.style.opacity = String(ramp(tt, keys[0].t - 0.1, keys[0].t + 0.2) * (1 - ramp(tt, 18.4, 18.8)));
    } else {
      hammer.style.opacity = "0";
    }

    // review panel
    BUGS.forEach((b, i) => {
      rows[i].classList.toggle("on", tt >= b.tag[0]);
      rows[i].classList.toggle("done", !!b.hit && tt >= b.hit + 0.3);
    });
    const found = BUGS.filter((b) => tt >= b.tag[0]).length;
    const resolved = BUGS.filter((b) => b.hit && tt >= b.hit + 0.3).length;
    const open = found - resolved;
    const key = found * 10 + resolved + (tt >= 18.4 ? 100 : 0);
    if (key !== cache.open) {
      cache.open = key;
      sub.textContent = found === 0 ? "scanning…" : resolved ? `${resolved} resolved · ${open} open` : `${open} open`;
      title.textContent = tt >= 18.4 ? "Loop fix holds; one risk stands" : "Reviewing the latest changes";
    }

    // loop seam: fade the stage out and back in
    stage.style.opacity = String(tt < 0.5 ? ramp(tt, 0, 0.5) : 1 - ramp(tt, 21.2, 22.0));
  };

  // ------------------------------------------------------------------ run
  measure();
  document.fonts?.ready.then(() => {
    measure();
    if (!motion) render(FINAL);
  });
  new ResizeObserver(() => {
    measure();
    if (!motion) render(FINAL);
  }).observe(stage);

  if (!motion) {
    render(FINAL);
    stage.style.opacity = "1";
    $("[data-rerun]", root)?.remove();
    return;
  }

  let t = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let frozen = false;
  const fired = new Set<number>();
  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const prev = t;
    t += dt;
    if (t >= PERIOD) {
      t -= PERIOD;
      fired.clear();
    }
    BUGS.forEach((b, i) => {
      if (b.hit && prev < b.hit && t >= b.hit && !fired.has(i)) {
        fired.add(i);
        hit(i);
      }
    });
    render(t);
    raf = requestAnimationFrame(frame);
  };
  const run = (on: boolean) => {
    if (frozen) return;
    visible = on;
    if (on && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  render(0);
  // dev-only: scrub the scene while checking it by eye
  if (import.meta.env.DEV) {
    (window as unknown as { __bh: unknown }).__bh = {
      seek: (s: number) => {
        frozen = true;
        visible = false;
        t = s;
        render(s);
      },
    };
  }
  new IntersectionObserver((e) => run(e[0].isIntersecting), { threshold: 0.25 }).observe(root);

  $("[data-rerun]", root)?.addEventListener("click", () => {
    t = 0;
    fired.clear();
    last = 0;
    render(0);
  });
}
