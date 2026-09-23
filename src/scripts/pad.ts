import { getStroke } from "perfect-freehand";
import { $, root, cssColor } from "./core";

const NS = "http://www.w3.org/2000/svg";
const INKS = ["var(--ink)", "var(--coral)", "var(--blue)", "var(--teal)", "var(--purple)"];

const pathFromStroke = (pts: number[][]) => {
  if (!pts.length) return "";
  const d = pts.reduce(
    (acc: (string | number)[], [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0.toFixed(1), y0.toFixed(1), ((x0 + x1) / 2).toFixed(1), ((y0 + y1) / 2).toFixed(1));
      return acc;
    },
    ["M", ...pts[0].map((n) => n.toFixed(1)), "Q"],
  );
  return d.join(" ") + " Z";
};

// "doodle on me": visitors draw on the page with a pressure-aware pen; strokes fade away.
export function initPad() {
  const pad = $<SVGSVGElement>("[data-pad]");
  const toggle = $<HTMLButtonElement>("[data-pad-toggle]");
  if (!pad || !toggle) return;
  let on = false;
  let ink = 0;
  let current: { el: SVGPathElement; pts: number[][]; pen: boolean } | null = null;

  const set = (v: boolean) => {
    on = v;
    root.classList.toggle("drawing", v);
    toggle.setAttribute("aria-pressed", String(v));
  };
  toggle.addEventListener("click", () => set(!on));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && on) set(false);
    const typing = (e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]");
    if (!typing && (e.key === "d" || e.key === "D") && !e.metaKey && !e.ctrlKey && !e.altKey) set(!on);
  });

  const point = (e: PointerEvent) => {
    const r = pad.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top, e.pressure || 0.5];
  };
  const redraw = () => {
    if (!current) return;
    const outline = getStroke(current.pts, {
      size: 6,
      thinning: 0.62,
      smoothing: 0.55,
      streamline: 0.45,
      simulatePressure: !current.pen,
      start: { taper: 12 },
      end: { taper: 20 },
    });
    current.el.setAttribute("d", pathFromStroke(outline));
  };

  pad.addEventListener("pointerdown", (e) => {
    if (!on) return;
    pad.setPointerCapture(e.pointerId);
    const el = document.createElementNS(NS, "path");
    el.classList.add("pad-stroke");
    el.setAttribute("fill", cssColor(INKS[ink % INKS.length]));
    pad.append(el);
    current = { el, pts: [point(e)], pen: e.pointerType === "pen" };
    redraw();
  });
  pad.addEventListener("pointermove", (e) => {
    if (!current) return;
    current.pts.push(point(e));
    redraw();
  });
  const end = () => {
    if (!current) return;
    const el = current.el;
    current = null;
    ink++;
    setTimeout(() => el.classList.add("fade"), 6000);
    setTimeout(() => el.remove(), 7400);
  };
  pad.addEventListener("pointerup", end);
  pad.addEventListener("pointercancel", end);
}
