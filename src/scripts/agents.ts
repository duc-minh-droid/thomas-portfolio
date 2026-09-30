import { $, $$ } from "./core";

// Five agents "build" the hero while you watch: Muse lays out the nav and buttons, GPT outlines the name,
// Grok types the copy, Opus frames and sketches the band, Gemini paints it in.

type Pt = { x: number; y: number };
type Tool = "pointer" | "pencil" | "brush" | "pen" | "caret";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const soft = (t: number) => lerp(t, inOut(t), 0.55);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const at = (el: Element, fx: number, fy: number): Pt => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width * fx, y: r.top + r.height * fy };
};

/* ------------------------------------------------------------------ engine */

interface Seg {
  kind: "move" | "work" | "leave";
  start: number;
  end: number;
  tool: Tool;
  action?: string;
  to?: () => Pt;
  spawn?: boolean;
  update?: (p: number) => Pt | null | void;
  enter?: () => void;
  exit?: () => void;
  on?: boolean;
  from?: Pt;
}

/** nearest point just outside the viewport, so a cursor can fly in */
const edgeOf = (p: Pt): Pt => {
  const m = 50;
  const dl = p.x, dr = innerWidth - p.x, dt = p.y, db = innerHeight - p.y;
  const min = Math.min(dl, dr, dt, db);
  if (min === dt) return { x: p.x, y: -m };
  if (min === dl) return { x: -m, y: p.y };
  if (min === dr) return { x: innerWidth + m, y: p.y };
  return { x: p.x, y: innerHeight + m };
};

class Agent {
  segs: Seg[] = [];
  time = 0;
  pos: Pt = { x: -200, y: -200 };
  private i = 0;
  private action: HTMLElement;

  constructor(readonly el: HTMLElement) {
    this.action = $(".agent-action", el)!;
  }

  /** don't start the next step before `t` (seconds on the build clock) */
  until(t: number) {
    this.time = Math.max(this.time, t);
    return this;
  }

  /** fly to a point; the very first move flies in from the nearest screen edge */
  go(to: () => Pt, tool: Tool, dur?: number) {
    const first = this.segs.length === 0;
    const d = dur ?? (first ? dist(edgeOf(to()), to()) / 900 + 0.25 : 0.45);
    this.segs.push({ kind: "move", start: this.time, end: this.time + d, tool, to, spawn: first });
    this.time += d;
    return this;
  }

  work(dur: number, tool: Tool, action: string, update: (p: number) => Pt | null | void, hooks: { enter?: () => void; exit?: () => void } = {}) {
    this.segs.push({ kind: "work", start: this.time, end: this.time + dur, tool, action, update, ...hooks });
    this.time += dur;
    return this;
  }

  leave() {
    this.segs.push({ kind: "leave", start: this.time, end: this.time + 0.55, tool: "pointer" });
    this.time += 0.55;
  }

  get done() {
    return this.i >= this.segs.length;
  }

  step(t: number) {
    while (this.i < this.segs.length) {
      const s = this.segs[this.i];
      if (t < s.start) return;
      if (!s.on) this.begin(s);
      const p = t >= s.end ? 1 : clamp((t - s.start) / Math.max(1e-3, s.end - s.start));
      this.run(s, p);
      if (p < 1) return;
      this.finish(s);
      this.i++;
    }
  }

  private begin(s: Seg) {
    s.on = true;
    this.el.dataset.tool = s.tool;
    if (s.kind === "move") s.from = s.spawn ? edgeOf(s.to!()) : { ...this.pos };
    if (s.kind === "leave") s.from = { ...this.pos };
    if (s.kind === "move" && s.spawn) {
      this.pos = s.from!;
      this.apply();
    }
    this.el.classList.add("is-visible");
    if (s.kind === "work") {
      this.action.textContent = s.action ?? "";
      this.el.classList.add("is-working");
    }
    s.enter?.();
  }

  private run(s: Seg, p: number) {
    if (s.kind === "move") {
      const to = s.to!();
      const q = soft(p);
      const arc = Math.min(14, dist(s.from!, to) * 0.06);
      this.pos = { x: lerp(s.from!.x, to.x, q), y: lerp(s.from!.y, to.y, q) - Math.sin(p * Math.PI) * arc };
    } else if (s.kind === "leave") {
      const q = soft(p);
      this.pos = { x: s.from!.x + 70 * q, y: s.from!.y - 55 * q };
    } else {
      const r = s.update?.(p);
      if (r) this.pos = r;
    }
    this.apply();
  }

  private finish(s: Seg) {
    this.el.classList.remove("is-working");
    s.exit?.();
    if (s.kind === "leave") this.el.classList.remove("is-visible");
  }

  private apply() {
    this.el.style.transform = `translate3d(${this.pos.x.toFixed(1)}px, ${this.pos.y.toFixed(1)}px, 0)`;
  }

  hide() {
    this.el.classList.remove("is-visible", "is-working");
  }
}

/* ------------------------------------------------------------ text tracer */

let canvasCtx: CanvasRenderingContext2D | null = null;
const ascentOf = (cs: CSSStyleDeclaration) => {
  canvasCtx ??= document.createElement("canvas").getContext("2d");
  if (!canvasCtx) return parseFloat(cs.fontSize) * 0.8;
  canvasCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return canvasCtx.measureText("Hg").fontBoundingBoxAscent;
};

const SVGNS = "http://www.w3.org/2000/svg";

interface Glyph { node: SVGTextElement; left: number; start: number; trace: number; len: number }
interface Word { glyphs: Glyph[]; svg: SVGSVGElement; l: number; r: number; top: number; bot: number; size: number }

/**
 * Turns the text of `els` into per-glyph SVG outlines that draw themselves, then fill in.
 * play(p) returns where the tool should be.
 */
function traceText(els: HTMLElement[], o: { caret?: boolean; perWord: number; perLetter: number; gap?: number }) {
  const words: Word[] = [];
  const svgs: SVGSVGElement[] = [];
  const range = document.createRange();
  const gap = o.gap ?? 0.06;

  for (const el of els) {
    el.classList.add("ab-drawing");
    const prevRotate = el.style.rotate;
    el.style.rotate = "none"; // measure unrotated; the overlay rotates with the element
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "ab-lines");
    svg.setAttribute("aria-hidden", "true");
    const box = el.getBoundingClientRect();
    const ascents = new Map<Element, number>();
    let cur: Word | null = null;
    const flush = () => {
      if (cur?.glyphs.length) words.push(cur);
      cur = null;
    };

    const visit = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement!;
        const cs = getComputedStyle(parent);
        const size = parseFloat(cs.fontSize);
        if (!ascents.has(parent)) ascents.set(parent, ascentOf(cs));
        const ascent = ascents.get(parent)!;
        const text = node.textContent ?? "";
        for (let k = 0; k < text.length; k++) {
          const ch = text[k];
          if (!ch.trim()) { flush(); continue; }
          range.setStart(node, k);
          range.setEnd(node, k + 1);
          const r = range.getBoundingClientRect();
          if (!r.width) continue;
          const left = r.left - box.left;
          const top = r.top - box.top;
          if (cur && Math.abs(top - cur.top) > size * 0.6) flush();
          const t = document.createElementNS(SVGNS, "text");
          t.textContent = ch;
          t.setAttribute("x", left.toFixed(2));
          t.setAttribute("y", (top + ascent).toFixed(2));
          const len = Math.ceil(size * 9);
          Object.assign(t.style, {
            visibility: "hidden",
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            fontStyle: cs.fontStyle,
            fill: cs.color,
            fillOpacity: "0",
            stroke: cs.color,
            strokeWidth: `${Math.min(1.8, Math.max(0.6, size * 0.03)).toFixed(2)}px`,
            strokeDasharray: `${len} ${len}`,
            strokeDashoffset: `${len}`,
          });
          svg.append(t);
          const g: Glyph = { node: t, left, start: 0, trace: 0, len };
          cur ??= { glyphs: [], svg, l: left, r: left, top, bot: top + r.height, size };
          cur.glyphs.push(g);
          cur.r = Math.max(cur.r, left + r.width);
          cur.bot = Math.max(cur.bot, top + r.height);
        }
      } else if (node instanceof HTMLElement) {
        node.childNodes.forEach(visit);
      }
    };
    el.childNodes.forEach(visit);
    flush();
    el.append(svg);
    el.style.rotate = prevRotate;
    svgs.push(svg);
  }

  const screen = (w: Word, x: number, y: number): Pt => {
    const m = w.svg.getScreenCTM();
    return m ? { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f } : { x, y };
  };
  const startPt = (w: Word) => screen(w, w.l, (w.top + w.bot) / 2);
  const endPt = (w: Word) => screen(w, w.r, (w.top + w.bot) / 2);

  // sequential schedule: word, travel, word, ...
  type Entry = { kind: "word"; w: Word; s: number; e: number } | { kind: "travel"; a: Word; b: Word; s: number; e: number; flat: boolean };
  const entries: Entry[] = [];
  let clock = 0;
  words.forEach((w, n) => {
    const prev = words[n - 1];
    if (prev) {
      const a = endPt(prev), b = startPt(w);
      const flat = Math.abs(a.y - b.y) < 8 && b.x >= a.x - 4;
      const d = flat ? gap : 0.4 + dist(a, b) / 620;
      entries.push({ kind: "travel", a: prev, b: w, s: clock, e: clock + d, flat });
      clock += d;
    }
    const dur = o.perWord + w.glyphs.length * o.perLetter * clamp(w.size / 20, 0.55, 2.6);
    const trace = Math.max(0.16, dur * 0.55);
    const width = Math.max(1, w.r - w.l);
    w.glyphs.forEach((g) => {
      g.start = clock + ((g.left - w.l) / width) * dur * 0.7;
      g.trace = trace;
    });
    entries.push({ kind: "word", w, s: clock, e: clock + dur });
    clock += dur;
  });
  const total = Math.max(0.1, clock + 0.35);

  const paint = (g: Glyph, t: number) => {
    const n = clamp((t - g.start) / g.trace);
    const f = clamp((t - g.start - g.trace * 0.75) / 0.3);
    const st = g.node.style;
    st.visibility = n > 0 ? "visible" : "hidden";
    st.strokeDasharray = n >= 1 ? "none" : `${g.len} ${g.len}`;
    st.strokeDashoffset = (g.len * (1 - n)).toFixed(1);
    st.fillOpacity = f.toFixed(3);
  };

  return {
    duration: total,
    els,
    start: () => (words[0] ? startPt(words[0]) : { x: 0, y: 0 }),
    play(p: number): Pt | null {
      const t = clamp(p) * total;
      let out: Pt | null = null;
      for (const e of entries) {
        if (e.kind === "word") e.w.glyphs.forEach((g) => paint(g, t));
        if (out || t > e.e) continue;
        const q = clamp((t - e.s) / Math.max(1e-3, e.e - e.s));
        if (e.kind === "travel") {
          const a = endPt(e.a), b = startPt(e.b);
          const k = o.caret && e.flat ? q : soft(q);
          const hop = o.caret ? 0 : Math.min(10, dist(a, b) * 0.05);
          out = { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - Math.sin(q * Math.PI) * hop };
        } else {
          const w = e.w;
          const h = w.bot - w.top;
          const my = (w.top + w.bot) / 2;
          out = o.caret
            ? screen(w, lerp(w.l, w.r, q), my)
            : screen(w, lerp(w.l, w.r, lerp(q, soft(q), 0.5)), my + Math.sin(q * Math.PI * Math.max(2, w.glyphs.length)) * h * 0.16);
        }
      }
      return out ?? (words.length ? endPt(words[words.length - 1]) : null);
    },
    done() {
      svgs.forEach((s) => s.remove());
      els.forEach((el) => el.classList.remove("ab-drawing"));
    },
  };
}

/* --------------------------------------------------------- stroke drawing */

/** the doodle paths of one svg (pathLength=1, dashed) drawn in document order, then the solid fills painted in */
function strokes(root: Element) {
  const frames = $$(".frame", root);
  const groups = (frames.length ? frames : [root]).map((g) => $$<SVGPathElement>("path:not(.solid)", g));
  const main = groups[0];
  const solids = $$<SVGPathElement>("path.solid", root);
  const lens = main.map((p) => Math.max(0.01, p.getTotalLength()));
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const win = lens.map((l) => {
    const a = acc / total;
    acc += l;
    return [a, acc / total] as const;
  });
  const onScreen = (p: SVGPathElement, len: number): Pt => {
    const pt = p.getPointAtLength(len);
    const m = p.getScreenCTM();
    return m ? { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f } : at(root, 0.5, 0.5);
  };
  let last: Pt | null = null;

  return {
    start: () => (main[0] ? onScreen(main[0], 0) : at(root, 0.5, 0.5)),
    draw(p: number): Pt {
      main.forEach((path, i) => {
        const [a, b] = win[i];
        const q = clamp((p - a) / Math.max(1e-4, b - a));
        groups.forEach((g) => g[i] && (g[i].style.strokeDashoffset = String(1 - q)));
        if (q > 0 && (q < 1 || i === main.length - 1)) last = onScreen(path, q * lens[i]);
      });
      return last ?? at(root, 0.5, 0.5);
    },
    paint(p: number): Pt {
      const n = Math.max(1, solids.length);
      solids.forEach((s, i) => (s.style.opacity = String(clamp((p - (i / n) * 0.6) / 0.4))));
      const r = root.getBoundingClientRect();
      const rows = 4;
      const q = clamp(p) * rows;
      const row = Math.min(rows - 1, Math.floor(q));
      const f = q - row;
      return { x: lerp(...(row % 2 ? [r.right, r.left] : [r.left, r.right]) as [number, number], f), y: lerp(r.top, r.bottom, (row + 0.5) / rows) };
    },
    paintStart: () => {
      const r = root.getBoundingClientRect();
      return { x: r.left, y: lerp(r.top, r.bottom, 0.125) };
    },
    finish() {
      groups.forEach((g) => g.forEach((p) => (p.style.strokeDashoffset = "0")));
      solids.forEach((s) => (s.style.opacity = "1"));
    },
  };
}

/* ------------------------------------------------------------- choreography */

export function buildHero(hero: HTMLElement) {
  const layer = $(".agent-layer");
  if (!layer) return;
  const root = document.documentElement;

  const agents: Record<string, Agent> = {};
  $$(".agent-cursor", layer).forEach((el) => (agents[el.dataset.agent!] = new Agent(el)));
  const { opus, gemini, gpt, grok, muse } = agents;

  const hello = $(".hello", hero)!;
  const nameLines = $$(".hero-name .line", hero);
  const chars = $$(".hero-name .char", hero);
  const underline = $(".name-underline", hero)!;
  const role = $(".role", hero)!;
  const meta = $(".meta", hero)!;
  const hint = $(".scroll-hint", hero)!;
  const stickers = $$(".sticker-burst, .sticker-label", hero);
  const ctaBtns = $$(".ctas .btn-sketch", hero);
  const navItems = [$(".topbar .logo"), $(".pad-toggle"), $(".cv-btn"), ...$$(".tab")].filter(Boolean) as HTMLElement[];
  const stage = $("[data-band]", hero)!;

  // containers that only hold hidden children become visible up front
  [$(".stickers", hero), $(".ctas", hero)].forEach((el) => el && (el.style.opacity = "1"));

  // --- tracers (measure now, draw later)
  const W = { perWord: 0.3, perLetter: 0.05 };
  const helloT = traceText([hello], W);
  const nameT = traceText(nameLines, W);
  const roleT = traceText([role], { caret: true, perWord: 0.07, perLetter: 0.012 });
  const metaT = traceText([meta], { caret: true, perWord: 0.07, perLetter: 0.012 });

  // --- GPT: outlines "hi, I'm", the name, then underlines it
  gpt.until(0.45).go(helloT.start, "pencil");
  gpt.work(helloT.duration, "pencil", "outlining", helloT.play, {
    enter: () => (hello.style.opacity = "1"),
    exit: () => helloT.done(),
  });
  gpt.go(nameT.start, "pencil", 0.35);
  gpt.work(nameT.duration, "pencil", "outlining", nameT.play, {
    enter: () => chars.forEach((c) => (c.style.clipPath = "none")),
    exit: () => nameT.done(),
  });
  // the underline is stretched (non-scaling strokes), so reveal it with a wipe instead of dashes
  underline.style.visibility = "hidden";
  const ulPath = $$<SVGPathElement>("path", underline);
  gpt.go(() => at(underline, 0, 0.5), "pencil", 0.25);
  gpt.work(
    0.55,
    "pencil",
    "underlining",
    (p) => {
      const q = soft(p);
      underline.style.clipPath = `inset(-50% ${((1 - q) * 100).toFixed(1)}% -50% -50%)`;
      return at(underline, q, 0.5 - Math.sin(q * Math.PI * 2) * 0.12);
    },
    {
      enter: () => {
        ulPath.forEach((path) => {
          path.style.strokeDasharray = "none";
          path.style.strokeDashoffset = "0";
        });
        underline.style.clipPath = "inset(-50% 100% -50% -50%)";
        underline.style.visibility = "visible";
      },
      exit: () => underline.style.removeProperty("clip-path"),
    },
  );
  const gptDone = gpt.time;
  gpt.leave();

  // --- Grok: types the role line, then the location line
  grok.until(gptDone - 0.3).go(roleT.start, "caret");
  grok.work(roleT.duration, "caret", "typing", roleT.play, {
    enter: () => (role.style.opacity = "1"),
    exit: () => roleT.done(),
  });
  const roleDone = grok.time;
  grok.go(metaT.start, "caret", 0.4);
  grok.work(metaT.duration, "caret", "typing", metaT.play, {
    enter: () => (meta.style.opacity = "1"),
    exit: () => {
      metaT.done();
      hint.style.opacity = "1";
    },
  });
  grok.leave();

  // --- Opus: frames the stage, then sketches each figure; Gemini paints behind
  const frame = document.createElement("div");
  frame.className = "ab-frame";
  const dim = document.createElement("span");
  dim.className = "ab-dim";
  frame.append(dim);
  stage.append(frame);

  const figs = [$(".floor", stage), $(".conductor [data-hero-draw]", stage), ...$$(".musician [data-hero-draw]", stage)]
    .filter((el): el is HTMLElement => !!el)
    .map((el) => ({ el, s: strokes(el) }));

  const frameStart = () => at(stage, 0, 0);
  const frameDur = Math.max(1.1, Math.hypot(stage.offsetWidth, stage.offsetHeight) / 420);
  opus.until(1.0).go(frameStart, "pencil");
  opus.work(frameDur, "pencil", "framing", (p) => {
    const q = soft(p);
    const w = Math.max(2, stage.offsetWidth * q);
    const h = Math.max(2, stage.offsetHeight * q);
    frame.style.width = `${w}px`;
    frame.style.height = `${h}px`;
    dim.textContent = `${Math.round(w)} × ${Math.round(h)}`;
    const r = frame.getBoundingClientRect();
    return { x: r.right, y: r.bottom };
  }, { enter: () => frame.classList.add("is-on") });
  const figDone: number[] = [];
  figs.forEach(({ s }, i) => {
    opus.go(s.start, "pencil", 0.3);
    opus.work(i === 0 ? 0.8 : 0.6, "pencil", "sketching", (p) => s.draw(p), { exit: () => s.finish() });
    figDone.push(opus.time);
  });
  opus.work(0.001, "pencil", "sketching", () => frame.classList.add("is-done"));
  opus.leave();

  // --- Gemini: paints each figure once Opus has inked it, then the stickers
  figs.forEach(({ el, s }, i) => {
    gemini.until(figDone[i] - 0.25).go(s.paintStart, "brush", 0.3);
    gemini.work(0.6, "brush", "painting", (p) => s.paint(p), {
      exit: () => el.closest(".musician")?.classList.add("ab-on"),
    });
  });
  gemini.until(Math.max(gemini.time, roleDone));
  const wash = (el: HTMLElement) => ({
    enter: () => {
      el.style.clipPath = "inset(-20% 100% -20% -20%)";
      el.classList.add("ab-on");
    },
    exit: () => el.style.removeProperty("clip-path"),
  });
  stickers.forEach((el) => {
    const y = (p: number) => at(el, 0, 0.5).y + Math.sin(p * Math.PI * 4) * 4;
    gemini.go(() => at(el, 0, 0.5), "brush", 0.4);
    gemini.work(
      0.65,
      "brush",
      "painting",
      (p) => {
        const q = soft(p);
        el.style.clipPath = `inset(-20% ${((1 - q) * 100).toFixed(1)}% -20% -20%)`;
        return { x: lerp(at(el, 0, 0).x - 10, at(el, 1, 0).x + 10, q), y: y(p) };
      },
      wash(el),
    );
  });
  gemini.leave();

  // --- Muse: lays out the nav, then the buttons (after the copy lands)
  const shapes: HTMLElement[] = [];
  const box = (el: HTMLElement) => {
    const s = document.createElement("div");
    s.className = "ab-shape";
    s.style.borderRadius = getComputedStyle(el).borderRadius;
    layer.prepend(s);
    shapes.push(s);
    return s;
  };
  const build = (el: HTMLElement, action: string) => {
    const s = box(el);
    const r0 = el.getBoundingClientRect();
    muse.work(Math.max(0.3, Math.hypot(r0.width, r0.height) / 260), "pen", action, (p) => {
      const q = soft(p);
      const r = el.getBoundingClientRect();
      Object.assign(s.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${Math.max(2, r.width * q)}px`, height: `${Math.max(2, r.height * q)}px` });
      return at(el, q, q);
    }, {
      enter: () => s.classList.add("is-drawing"),
      exit: () => {
        el.classList.add("ab-on");
        s.classList.add("is-done");
      },
    });
  };
  muse.until(0.2).go(() => at(navItems[0], 0, 0), "pen");
  navItems.forEach((el, i) => {
    if (i) muse.go(() => at(el, 0, 0), "pen", 0.28);
    build(el, "building nav");
  });
  muse.until(roleDone - 0.4);
  ctaBtns.forEach((el, i) => {
    muse.go(() => at(el, 0, 0), "pen", i ? 0.3 : 0.6);
    build(el, "building ui");
  });
  muse.leave();

  // --- run
  let t0 = 0;
  let raf = 0;
  let over = false;
  const all = Object.values(agents);

  const cleanup = () => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    [helloT, nameT, roleT, metaT].forEach((t) => t.done());
    chars.forEach((c) => (c.style.clipPath = "none"));
    [hello, role, meta, hint].forEach((el) => (el.style.opacity = "1"));
    underline.style.visibility = "visible";
    underline.style.removeProperty("clip-path");
    $$<SVGPathElement>("path", underline).forEach((path) => {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
    });
    $$(".musician", stage).forEach((m) => m.classList.add("ab-on"));
    figs.forEach(({ s }) => s.finish());
    stickers.forEach((el) => el.style.removeProperty("clip-path"));
    shapes.forEach((s) => s.remove());
    frame.remove();
    all.forEach((a) => a.hide());
    root.classList.add("ab-built");
    root.classList.remove("ab-busy");
    removeEventListener("pointerdown", skip);
    removeEventListener("keydown", skip);
  };
  const skip = (e: Event) => {
    if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey || e.altKey || e.key === "Shift")) return;
    all.forEach((a) => a.step(Infinity));
    cleanup();
  };

  const tick = (now: number) => {
    if (over) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    all.forEach((a) => a.step(t));
    if (all.every((a) => a.done)) return cleanup();
    raf = requestAnimationFrame(tick);
  };

  root.classList.add("ab-busy");
  addEventListener("pointerdown", skip, { passive: true });
  addEventListener("keydown", skip);
  raf = requestAnimationFrame(tick);
}
