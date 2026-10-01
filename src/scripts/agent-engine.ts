import { $, $$ } from "./core";

// Shared machinery for the agent cursors: a persistent stage (five agents on one clock),
// a per-glyph text tracer and a stroke drawer. hero build = agents.ts, scroll refinements = refine.ts.

export type Pt = { x: number; y: number };
export type Tool = "pointer" | "pencil" | "brush" | "pen" | "caret";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const soft = (t: number) => lerp(t, inOut(t), 0.55);
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const at = (el: Element, fx: number, fy: number): Pt => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width * fx, y: r.top + r.height * fy };
};
const offscreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom < 0 || r.top > innerHeight;
};

/* ------------------------------------------------------------------ agents */

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
  /** if this element is off screen when the step comes up, finish it instantly */
  anchor?: Element;
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

const IDLE_LEAVE = 1.4;

export class Agent {
  segs: Seg[] = [];
  /** end of the last scheduled step on the stage clock */
  time = 0;
  pos: Pt = { x: -200, y: -200 };
  i = 0;
  private away = true;
  private action: HTMLElement;

  constructor(readonly el: HTMLElement) {
    this.action = $(".agent-action", el)!;
  }

  /** don't start the next step before `t` (seconds on the stage clock) */
  until(t: number) {
    this.time = Math.max(this.time, t);
    return this;
  }

  /** fly to a point; from off screen the cursor flies in from the nearest edge */
  go(to: () => Pt, tool: Tool, dur?: number) {
    const spawn = this.away;
    const d = dur ?? (spawn ? dist(edgeOf(to()), to()) / 900 + 0.25 : 0.45);
    this.segs.push({ kind: "move", start: this.time, end: this.time + d, tool, to, spawn });
    this.time += d;
    this.away = false;
    return this;
  }

  work(
    dur: number,
    tool: Tool,
    action: string,
    update: (p: number) => Pt | null | void,
    hooks: { enter?: () => void; exit?: () => void; anchor?: Element } = {},
  ) {
    this.segs.push({ kind: "work", start: this.time, end: this.time + dur, tool, action, update, ...hooks });
    this.time += dur;
    this.away = false;
    return this;
  }

  leave() {
    this.segs.push({ kind: "leave", start: this.time, end: this.time + 0.55, tool: "pointer" });
    this.time += 0.55;
    this.away = true;
  }

  get idle() {
    return this.i >= this.segs.length && !this.el.classList.contains("is-visible");
  }

  step(t: number) {
    while (this.i < this.segs.length) {
      const s = this.segs[this.i];
      if (t < s.start) return;
      if (!s.on) this.begin(s);
      const p = t >= s.end || (s.anchor && offscreen(s.anchor)) ? 1 : clamp((t - s.start) / Math.max(1e-3, s.end - s.start));
      this.run(s, p);
      if (p < 1) return;
      this.finish(s);
      this.i++;
    }
    // nothing queued: wander off after a moment
    if (!this.away && t > this.time + IDLE_LEAVE) {
      this.time = t;
      this.leave();
    }
  }

  /** complete everything scheduled before index `n` right now (skip) */
  flush(n: number) {
    while (this.i < n && this.i < this.segs.length) {
      const s = this.segs[this.i];
      if (!s.on) this.begin(s);
      this.run(s, 1);
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
}

/* ------------------------------------------------------------------- stage */

export interface Stage {
  agents: Record<"opus" | "gemini" | "gpt" | "grok" | "muse", Agent>;
  layer: HTMLElement;
  now(): number;
  /** wake the loop after scheduling more steps */
  kick(): void;
  /** called every frame while set; return true to be removed */
  watch(fn: (t: number) => boolean | void): void;
}

let shared: Stage | null = null;
const clock0 = performance.now();

export function stage(): Stage | null {
  if (shared) return shared;
  const layer = $(".agent-layer");
  if (!layer) return null;
  const map: Record<string, Agent> = {};
  $$(".agent-cursor", layer).forEach((el) => (map[el.dataset.agent!] = new Agent(el)));
  const all = Object.values(map);
  const watchers: Array<(t: number) => boolean | void> = [];
  let raf = 0;

  const now = () => (performance.now() - clock0) / 1000;
  const tick = () => {
    raf = 0;
    const t = now();
    let busy = watchers.length > 0;
    for (const a of all) {
      a.step(t);
      if (!a.idle) busy = true;
    }
    for (let k = watchers.length - 1; k >= 0; k--) if (watchers[k](t)) watchers.splice(k, 1);
    if (busy) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  shared = {
    agents: map as Stage["agents"],
    layer: layer as HTMLElement,
    now,
    kick,
    watch: (fn) => {
      watchers.push(fn);
      kick();
    },
  };
  return shared;
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
export function traceText(els: HTMLElement[], o: { caret?: boolean; perWord: number; perLetter: number; gap?: number }) {
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
    el.append(svg);
    // screen → element-local, so ancestor transforms (tilted cards, mid-reveal) don't skew the glyphs
    const inv = svg.getScreenCTM()?.inverse();
    const local = (x: number, y: number) => (inv ? { x: inv.a * x + inv.c * y + inv.e, y: inv.b * x + inv.d * y + inv.f } : { x, y });
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
          const { x: left, y: top } = local(r.left, r.top);
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
      } else if (node instanceof HTMLElement && !node.classList.contains("ab-lines")) {
        node.childNodes.forEach(visit);
      }
    };
    [...el.childNodes].forEach(visit);
    flush();
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
export function strokes(root: Element) {
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
      const [x0, x1] = row % 2 ? [r.right, r.left] : [r.left, r.right];
      return { x: lerp(x0, x1, f), y: lerp(r.top, r.bottom, (row + 0.5) / rows) };
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
