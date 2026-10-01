import { $, $$, motion } from "./core";
import { type Agent, type Pt, type Stage, at, clamp, lerp, soft, stage, traceText } from "./agent-engine";

// While you scroll, the agents keep polishing what comes into view: Muse lays out a selection box,
// GPT highlights a title, Opus circles a detail, Grok types a new line, Gemini washes colour in.
// Everything here only adds decoration on top of content that is already readable.

const NS = "http://www.w3.org/2000/svg";

/* ------------------------------------------------------------------ helpers */

/** the element's first text run, wrapped so a background can follow it across lines */
function textSpan(el: HTMLElement): HTMLElement | null {
  if (el.classList.contains("rf-text")) return el;
  const existing = $(".rf-text", el);
  if (existing) return existing;
  const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  if (!node) return null;
  const span = document.createElement("span");
  span.className = "rf-text";
  node.replaceWith(span);
  span.append(node);
  return span;
}

/** where along the text (over its line boxes) the marker is at progress q */
function alongText(span: HTMLElement, q: number): Pt {
  const rects = [...span.getClientRects()].filter((r) => r.width > 2);
  if (!rects.length) return at(span, q, 0.85);
  const total = rects.reduce((n, r) => n + r.width, 0);
  let rest = clamp(q) * total;
  for (const r of rects) {
    if (rest <= r.width) return { x: r.left + rest, y: r.top + r.height * 0.82 };
    rest -= r.width;
  }
  const r = rects[rects.length - 1];
  return { x: r.right, y: r.top + r.height * 0.82 };
}

/** a hand-drawn loop that overshoots its start, as a path in a 100×100 box */
function scribble(seed: number) {
  const pts: string[] = [];
  const n = 54;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (-105 + t * 395) * (Math.PI / 180);
    const wob = Math.sin(t * 9 + seed) * 1.6;
    const rx = 44 + t * 4 + wob;
    const ry = 40 + t * 3 + wob * 0.7;
    pts.push(`${i ? "L" : "M"}${(50 + rx * Math.cos(a)).toFixed(1)} ${(50 + ry * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join("");
}

/* -------------------------------------------------------------------- beats */

/** Muse: drags a selection box (handles + live "W × H") over an element, then lets it go */
function marquee(a: Agent, el: HTMLElement, layer: HTMLElement) {
  const box = document.createElement("div");
  box.className = "ab-marquee";
  box.innerHTML = '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><span class="dim"></span>';
  const dim = $(".dim", box)!;
  box.style.borderRadius = getComputedStyle(el).borderRadius;
  layer.prepend(box);

  const fit = (q: number) => {
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${Math.max(2, r.width * q)}px`, height: `${Math.max(2, r.height * q)}px` });
    dim.textContent = `${Math.round(r.width * q)} × ${Math.round(r.height * q)}`;
  };
  const r0 = el.getBoundingClientRect();
  a.go(() => at(el, 0, 0), "pen");
  a.work(
    clamp(Math.hypot(r0.width, r0.height) / 420, 0.55, 1.3),
    "pen",
    "laying out",
    (p) => {
      const q = soft(p);
      fit(q);
      return at(el, q, q);
    },
    { enter: () => box.classList.add("is-on"), anchor: el },
  );
  a.work(
    0.4,
    "pen",
    "laying out",
    () => {
      fit(1);
      return at(el, 1, 1);
    },
    {
      exit: () => {
        box.classList.add("is-done");
        setTimeout(() => box.remove(), 800);
      },
      anchor: el,
    },
  );
}

/** GPT: marker sweep behind a piece of text */
function highlight(a: Agent, el: HTMLElement | null) {
  const span = el && textSpan(el);
  if (!span) return;
  span.classList.add("rf-hl");
  span.style.setProperty("--hl", "0");
  a.go(() => alongText(span, 0), "pencil");
  a.work(
    clamp((span.textContent?.length ?? 8) * 0.04, 0.5, 1.1),
    "pencil",
    "highlighting",
    (p) => {
      const q = soft(p);
      span.style.setProperty("--hl", q.toFixed(3));
      return alongText(span, q);
    },
    { exit: () => span.style.setProperty("--hl", "1"), anchor: span },
  );
}

/** Opus: circles something with a loose pencil loop that stays put */
function circle(a: Agent, el: HTMLElement | null, seed = 1) {
  if (!el || !el.offsetParent) return;
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "rf-circle");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", scribble(seed));
  path.setAttribute("pathLength", "1");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.style.strokeDasharray = "1 1";
  path.style.strokeDashoffset = "1";
  svg.append(path);
  el.append(svg);
  const len = path.getTotalLength();
  const pointAt = (q: number): Pt => {
    const pt = path.getPointAtLength(clamp(q) * len);
    const m = path.getScreenCTM();
    return m ? { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f } : at(el, 0.5, 0.5);
  };
  a.go(() => pointAt(0), "pencil");
  a.work(
    0.8,
    "pencil",
    "circling",
    (p) => {
      path.style.strokeDashoffset = String(1 - p);
      return pointAt(p);
    },
    { anchor: el },
  );
}

/** Gemini: brushes a tint onto each element in turn */
function wash(a: Agent, els: HTMLElement[]) {
  els.slice(0, 6).forEach((el, i) => {
    a.go(() => at(el, 0, 0.5), "brush", i ? 0.2 : undefined);
    a.work(
      0.36,
      "brush",
      "painting",
      (p) => {
        if (p > 0.35) el.classList.add("rf-washed");
        const r = el.getBoundingClientRect();
        return { x: lerp(r.left - 6, r.right + 6, soft(p)), y: r.top + r.height / 2 + Math.sin(p * Math.PI * 3) * 3 };
      },
      { anchor: el },
    );
  });
}

/** Grok: types a line that was blank until now */
function typeLine(a: Agent, el: HTMLElement | null) {
  if (!el) return;
  const t = traceText([el], { caret: true, perWord: 0.07, perLetter: 0.012 });
  a.go(t.start, "caret");
  a.work(t.duration, "caret", "typing", t.play, {
    enter: () => el.classList.add("rf-on"),
    exit: () => t.done(),
    anchor: el,
  });
}

/* -------------------------------------------------------------------- units */

type Run = (el: HTMLElement, s: Stage, n: number) => void;

const units: [string, Run][] = [
  [
    ".st",
    (el, { agents: g, layer }, n) => {
      const title = $(".st-text", el);
      if (!title) return;
      g.muse.until(n);
      marquee(g.muse, title, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, title);
    },
  ],
  [
    "[data-item]",
    (el, { agents: g, layer }, n) => {
      const card = $("[data-card]", el);
      g.muse.until(n);
      if (card) marquee(g.muse, card, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $(".title-text", el));
      g.opus.until(n + 1.4);
      circle(g.opus, $(".spine-stamp .stamp", el), $$("[data-item]").indexOf(el));
      g.grok.until(n + 1.8);
      typeLine(g.grok, $(".rf-type", el));
      g.gemini.until(n + 2.3);
      wash(g.gemini, $$(".tag-pill", el));
    },
  ],
  [
    "[data-job]",
    (el, { agents: g, layer }, n) => {
      g.muse.until(n);
      marquee(g.muse, el, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $(".company", el));
      g.opus.until(n + 1.4);
      circle(g.opus, $(".dates .stamp", el), 3);
      g.gemini.until(n + 2);
      wash(g.gemini, $$(".dates .stamp", el));
    },
  ],
  [
    "[data-group]",
    (el, { agents: g, layer }, n) => {
      g.muse.until(n);
      marquee(g.muse, el, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $(".group-title", el));
      const names = $$(".skill-name", el);
      g.opus.until(n + 1.4);
      circle(g.opus, names[names.length - 1] ?? null, names.length);
      g.gemini.until(n + 1.9);
      wash(g.gemini, $$(".skill-sticker", el));
    },
  ],
  [
    "[data-hub]",
    (el, { agents: g, layer }, n) => {
      g.muse.until(n);
      marquee(g.muse, el, layer);
      g.opus.until(n + 1.2);
      circle(g.opus, $(".hub-inner p", el), 5);
    },
  ],
  [
    ".club",
    (el, { agents: g, layer }, n) => {
      g.muse.until(n);
      marquee(g.muse, el, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $("h3", el));
      g.opus.until(n + 1.4);
      circle(g.opus, $(".club-role", el), 7);
      g.gemini.until(n + 2);
      wash(g.gemini, $$(".club-tag", el));
    },
  ],
  [
    "[data-report]",
    (el, { agents: g, layer }, n) => {
      g.muse.until(n);
      marquee(g.muse, el, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $(".report-title", el));
      g.opus.until(n + 1.4);
      circle(g.opus, $(".grade .result", el), 2);
    },
  ],
  [
    ".contact-grid",
    (el, { agents: g, layer }, n) => {
      const actions = $(".actions", el);
      g.muse.until(n);
      if (actions) marquee(g.muse, actions, layer);
      g.gpt.until(n + 0.9);
      highlight(g.gpt, $(".email", el));
      const socials = $$(".social", el);
      g.opus.until(n + 1.4);
      circle(g.opus, socials[socials.length - 1] ?? null, 4);
      g.gemini.until(n + 2);
      wash(g.gemini, socials);
    },
  ],
];

/* --------------------------------------------------------------------- init */

export function initRefine() {
  if (!motion) return;
  const s = stage();
  if (!s) return;

  const pending = new Map<HTMLElement, Run>();
  units.forEach(([sel, run]) =>
    $$(sel).forEach((el) => {
      if (!el.closest("#hobby")) pending.set(el, run);
    }),
  );

  // lines that start blank stay readable even if you jump past their card
  const settle = (el: HTMLElement) => $$(".rf-type", el).forEach((x) => x.classList.add("rf-on"));

  const io = new IntersectionObserver(
    (entries) => {
      let queued = false;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        const run = pending.get(el);
        if (!run) continue;
        pending.delete(el);
        io.unobserve(el);
        run(el, s, s.now() + 0.45);
        queued = true;
      }
      if (queued) s.kick();
    },
    { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
  );
  pending.forEach((_, el) => io.observe(el));

  let ticking = false;
  const sweep = () => {
    ticking = false;
    pending.forEach((_, el) => {
      if (el.getBoundingClientRect().bottom < 0) {
        pending.delete(el);
        io.unobserve(el);
        settle(el);
      }
    });
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(sweep);
      }
    },
    { passive: true },
  );
  sweep();
}
