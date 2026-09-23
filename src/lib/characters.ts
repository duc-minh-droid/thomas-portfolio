// Thomas and his band, drawn on a 120×120 canvas and roughened at build time.
//
// Parts carry a `slot`:
//   face — the default expression (swapped out when an `expr` is given)
//   acc  — the default accessory  (swapped out when `acc` is given)
//   inst — instruments / playing arms (dropped in the "mini" variant)
// Parts with a `cls` are animated from CSS (see BandStage.astro).
// Expressions and accessories are generated from each character's anchors, so any
// character can wear any of them.

import { circ, ell, rrect, type Part } from "./doodles";

const INK = "var(--ink)";
const SKIN = "#f3d3b3";
const PAPER = "#fffdf8";
const CYAN = "#9be7ff";
const PINK = "#f5a3a3";

type Pt = [number, number];
type SPart = Part & { slot?: "face" | "acc" | "inst" };

export type Anchors = {
  eyes: [Pt, Pt];
  eyeR: number;
  mouth: Pt;
  /** top of the head (where hats sit) and head width */
  top: Pt;
  topW: number;
  /** where held props go */
  hand: Pt;
  /** colour expressions are drawn in */
  face: string;
};

export type Character = { id: string; name: string; anchors: Anchors; parts: SPart[] };

// fuzzy outline for Muse: an ellipse with little bumps all the way round
const fuzz = (cx: number, cy: number, rx: number, ry: number, bumps = 26, amp = 1.8) => {
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r = 1 + (amp / Math.min(rx, ry)) * Math.sin(a * bumps);
    pts.push(`${i ? "L" : "M"}${(cx + rx * r * Math.cos(a)).toFixed(1)} ${(cy + ry * r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ") + " Z";
};

const keys = () => {
  let d = "";
  for (let t = 0; t < 9; t++) {
    const x = 34 + t * 6.8;
    const y = 96.4 - t * 2.4;
    d += `M${x.toFixed(1)} ${y.toFixed(1)} L${(x - 2.2).toFixed(1)} ${(y - 6.4).toFixed(1)} `;
  }
  return d;
};

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.9} C${x - s * 1.4} ${y} ${x - s * 0.9} ${y - s * 1.1} ${x} ${y - s * 0.3} C${x + s * 0.9} ${y - s * 1.1} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9} Z`;

export const characters: Record<string, Character> = {
  clawd: {
    id: "clawd",
    name: "Clawd",
    anchors: { eyes: [[47, 59.5], [73, 59.5]], eyeR: 3.4, mouth: [60, 71], top: [60, 40], topW: 60, hand: [99, 60], face: INK },
    parts: [
      { d: "M108 70 L108 114 M100 114 L116 114", slot: "inst", sw: 1.8 },
      { d: ell(108, 68, 13, 3.2), fillColor: "var(--mustard)", solid: true, slot: "inst", cls: "cymbal" },
      {
        d: "M30 40 L90 40 L90 54 L98 54 L98 66 L90 66 L90 84 L86 84 L86 100 L80 100 L80 84 L74 84 L74 100 L68 100 L68 84 L52 84 L52 100 L46 100 L46 84 L40 84 L40 100 L34 100 L34 84 L30 84 L30 66 L22 66 L22 54 L30 54 Z",
        fillColor: "#dd7a58",
        solid: true,
      },
      { d: "M30 41 L90 41 L90 48 L30 48 Z", fillColor: "var(--teal)", solid: true, slot: "acc" },
      { d: "M90 44 L101 36 M90 47 L103 50", sw: 2.2, slot: "acc" },
      { d: "M42 50 L52 54 M78 50 L68 54", sw: 3, slot: "face" },
      { d: "M44 56 L50 56 L50 63 L44 63 Z M70 56 L76 56 L76 63 L70 63 Z", fillColor: INK, solid: true, slot: "face" },
      { d: "M54 70 L66 70 L64 75 L56 75 Z", fillColor: INK, solid: true, slot: "face" },
      { d: "M32 92 C32 84 88 84 88 92 L88 106 C88 116 32 116 32 106 Z", fillColor: "var(--coral)", solid: true, slot: "inst" },
      { d: "M32 92 C32 100 88 100 88 92 C88 84 32 84 32 92 Z", fillColor: PAPER, solid: true, slot: "inst" },
      { d: "M34 104 L42 110 L50 104 L58 110 L66 104 L74 110 L82 104 L86 107", slot: "inst", sw: 1.6 },
      { d: "M24 60 L40 88", slot: "inst", cls: "stick-l", sw: 3 },
      { d: "M96 60 L80 88", slot: "inst", cls: "stick-r", sw: 3 },
    ],
  },

  muse: {
    id: "muse",
    name: "Muse",
    anchors: { eyes: [[40, 45], [53, 45]], eyeR: 1.9, mouth: [46.5, 50.5], top: [46, 27], topW: 38, hand: [74, 64], face: INK },
    parts: [
      { d: "M34 100 L34 112 L44 112 L44 100 Z M50 100 L50 112 L60 112 L60 100 Z", fillColor: "#eadfca", solid: true },
      { d: fuzz(47, 66, 26, 40), fillColor: "#eadfca", solid: true, sw: 1.6 },
      { d: rrect(33, 34, 28, 22, 9), fillColor: "#f7e1c8", solid: true },
      { d: "M37 45 Q40 41.5 43 45 M50 45 Q53 41.5 56 45", sw: 2.2, slot: "face" },
      { d: `${circ(37.5, 50.5, 2.6)} ${circ(56, 50.5, 2.6)}`, fillColor: PINK, solid: true, noStroke: true, slot: "face" },
      { d: "M44 50 Q47 53 50 50", sw: 1.8, slot: "face" },
      { d: "M24 31 C24 20 62 17 66 28 C62 33 30 36 24 31 Z", fillColor: "var(--coral)", solid: true, slot: "acc" },
      { d: "M46 21 L47 15", sw: 2.4, slot: "acc" },
      { d: "M23 60 C36 66 57 66 71 60 L71 67 C57 73 36 73 23 67 Z", fillColor: "var(--blue)", solid: true },
      { d: "M58 68 L60 86 L67 84 L64 68 Z", fillColor: "var(--blue)", solid: true },
      { d: "M31 63 L30 69 M41 65 L41 71 M51 65 L51 71", sw: 1.3, strokeColor: PAPER },
      {
        d: "M88 50 C99 50 101 60 96 66 C105 71 106 92 88 100 C70 92 71 71 80 66 C75 60 77 50 88 50 Z",
        fillColor: "#c98a4b",
        solid: true,
        slot: "inst",
      },
      { d: "M88 50 L88 14 M88 14 C84 9 92 6 92 11 M88 100 L88 114", slot: "inst", sw: 2.2 },
      { d: "M86 26 L86 94 M90 26 L90 94", slot: "inst", sw: 0.9 },
      { d: "M82 76 C80 80 84 82 82 86 M94 76 C92 80 96 82 94 86", slot: "inst", sw: 1.3 },
      { d: ell(81, 42, 6, 6.5), fillColor: "#eadfca", solid: true, slot: "inst" },
      { d: "M56 78 L114 64 M58 81 L112 68", slot: "inst", cls: "bow", sw: 1.8 },
      { d: ell(58, 80, 6, 6), fillColor: "#eadfca", solid: true, slot: "inst", cls: "bow" },
    ],
  },

  codex: {
    id: "codex",
    name: "Codex",
    anchors: { eyes: [[51, 42], [70, 42]], eyeR: 2.2, mouth: [60.5, 48.5], top: [61, 17], topW: 40, hand: [75, 80], face: CYAN },
    parts: [
      { d: "M52 92 L52 105 M68 92 L68 105", sw: 5 },
      { d: "M47 62 L73 62 C76 74 76 84 74 94 L46 94 C44 84 44 74 47 62 Z", fillColor: "#3f63d8", solid: true },
      { d: "M54 74 L58 78 L54 82 M61 82 L67 82", strokeColor: CYAN, sw: 2.4 },
      {
        d: "M34 60 C20 60 20 42 32 40 C28 26 44 18 54 26 C58 12 80 12 84 26 C96 22 104 36 96 44 C106 48 102 62 90 60 Z",
        fillColor: "#4a6fe0",
        solid: true,
      },
      { d: rrect(40, 30, 42, 24, 5), fillColor: "#1c2744", solid: true },
      { d: "M48 44 L51 39 L54 44 M67 44 L70 39 L73 44", strokeColor: CYAN, sw: 2.6, slot: "face" },
      { d: "M55 48 Q60.5 52 66 48", strokeColor: CYAN, sw: 2.2, slot: "face" },
      { d: "M50 17 L52 6 L57 12 L61 3 L65 12 L70 6 L72 17 Z", fillColor: "var(--mustard)", solid: true, slot: "acc" },
      { d: "M52 60 L60 64 L52 68 Z M68 60 L60 64 L68 68 Z", fillColor: "var(--coral)", solid: true },
      { d: "M26 90 L94 66 L100 78 L32 102 Z", fillColor: "var(--purple)", solid: true, slot: "inst", cls: "keytar" },
      { d: keys(), slot: "inst", cls: "keytar", sw: 1.4 },
      { d: "M96 70 L116 62 L118 68 L99 76", slot: "inst", cls: "keytar", sw: 2 },
      { d: "M48 70 C42 78 40 84 44 90 M72 70 C80 74 82 78 80 82", slot: "inst", sw: 3, cls: "keytar" },
    ],
  },

  grok: {
    id: "grok",
    name: "Grok",
    anchors: { eyes: [[57.5, 43], [66.5, 41]], eyeR: 2.6, mouth: [62, 55], top: [50, 29], topW: 44, hand: [82, 62], face: PAPER },
    parts: [
      { d: `${ell(40, 90, 7, 3.5)} ${ell(60, 90, 7, 3.5)}`, fillColor: "var(--coral)", solid: true },
      { d: circ(50, 58, 30), fillColor: INK, solid: true },
      { d: circ(77, 64, 9), fillColor: INK, solid: true, slot: "inst", cls: "puff" },
      { d: "M56 38 L59 47 M65 36 L68 45", strokeColor: PAPER, sw: 4.2, cls: "blink", slot: "face" },
      { d: "M36 30 L39 8 L61 6 L64 28 Z", fillColor: "var(--coral)", solid: true, slot: "acc" },
      { d: "M27 31 C27 26 73 24 73 29 C73 34 27 36 27 31 Z", fillColor: "var(--coral)", solid: true, slot: "acc" },
      { d: "M38 23 L62 21", sw: 3, slot: "acc" },
      { d: "M84 62 L104 60 M84 67 L104 65 M88 67 C88 76 101 76 101 66", slot: "inst", cls: "horn", sw: 2 },
      { d: "M90 61 L90 54 M95 61 L95 54 M100 61 L100 54", slot: "inst", cls: "horn", sw: 2 },
      { d: "M104 60 L119 49 L119 77 L104 65 Z", fillColor: "var(--mustard)", solid: true, slot: "inst", cls: "horn" },
    ],
  },

  openclaw: {
    id: "openclaw",
    name: "OpenClaw",
    anchors: { eyes: [[46, 57], [66, 57]], eyeR: 4.5, mouth: [56, 69], top: [56, 31], topW: 52, hand: [89, 62], face: INK },
    parts: [
      { d: "M46 88 L46 104 L40 106 M66 88 L66 104 L72 106", sw: 4 },
      { d: "M44 32 C40 18 32 14 26 18 M68 32 C72 18 80 14 86 18", sw: 2.6, cls: "antennae" },
      { d: `${circ(25, 19, 3.5)} ${circ(87, 19, 3.5)}`, fillColor: "#e0453a", solid: true, cls: "antennae" },
      { d: ell(22, 66, 9, 11), fillColor: "#e0453a", solid: true },
      { d: circ(56, 60, 32), fillColor: "#e0453a", solid: true },
      { d: "M28 44 C40 32 72 32 84 44 L82 50 C70 40 42 40 30 50 Z", fillColor: "var(--blue)", solid: true, slot: "acc" },
      { d: "M84 45 L96 38 M84 47 L97 51", sw: 2.6, slot: "acc" },
      { d: `${circ(46, 57, 5.5)} ${circ(66, 57, 5.5)}`, fillColor: INK, solid: true, slot: "face" },
      { d: `${circ(47.5, 55.5, 2)} ${circ(67.5, 55.5, 2)}`, fillColor: "#37d6c5", solid: true, noStroke: true, slot: "face" },
      { d: "M44 67 Q56 82 68 67 Z", fillColor: INK, solid: true, slot: "face" },
      { d: "M52 74 Q56 70 60 74 Q56 78 52 74 Z", fillColor: PINK, solid: true, noStroke: true, slot: "face" },
      {
        d: "M40 82 C30 80 26 92 32 98 C30 108 46 112 54 104 C62 108 72 100 68 92 C74 84 64 76 56 82 C52 78 44 78 40 82 Z",
        fillColor: "var(--mustard)",
        solid: true,
        slot: "inst",
      },
      { d: circ(51, 93, 4), fillColor: INK, solid: true, slot: "inst" },
      { d: "M58 86 L100 60", slot: "inst", sw: 4.5 },
      { d: "M100 60 L108 54 L111 58 L103 64 Z", fillColor: INK, solid: true, slot: "inst" },
      { d: "M46 96 L101 61", slot: "inst", sw: 0.8 },
      { d: "M86 70 C80 80 70 88 63 94", slot: "inst", cls: "strum", sw: 3 },
      { d: circ(61, 95, 5), fillColor: "#e0453a", solid: true, slot: "inst", cls: "strum" },
    ],
  },

  thomas: {
    id: "thomas",
    name: "Thomas",
    anchors: { eyes: [[54, 34], [67, 34]], eyeR: 1.4, mouth: [60.5, 42], top: [60, 16], topW: 32, hand: [93, 41], face: INK },
    parts: [
      { d: "M30 104 L90 104 L87 120 L33 120 Z", fillColor: "var(--mustard)", solid: true, slot: "inst" },
      { d: "M52 109 L68 109 M60 109 L60 117", slot: "inst", sw: 2.4 },
      { d: "M50 88 L50 104 M70 88 L70 104", sw: 5 },
      { d: "M44 50 C40 60 40 76 42 90 L78 90 C80 76 80 60 76 50 Z", fillColor: "var(--teal)", solid: true },
      { d: "M55 52 L54 62 M65 52 L66 62 M50 78 L70 78", sw: 1.6 },
      { d: "M45 56 L30 68 L24 62", sw: 3.4, cls: "wave" },
      { d: circ(23, 61, 4), fillColor: SKIN, solid: true, cls: "wave" },
      { d: circ(60, 32, 15), fillColor: SKIN, solid: true },
      {
        d: "M45 30 C44 14 58 12 64 16 C70 14 78 20 75 30 C70 24 62 26 56 22 C52 26 48 26 45 30 Z",
        fillColor: INK,
        solid: true,
      },
      { d: "M56 16 L53 9 M63 15 L65 8", sw: 2 },
      { d: `${circ(54, 34, 1.4)} ${circ(67, 34, 1.4)}`, fillColor: INK, solid: true, noStroke: true, slot: "face" },
      { d: `${circ(54, 34, 5)} ${circ(67, 34, 5)} M59 34 L62 34 M49 33 L46 32 M72 33 L75 32`, sw: 1.8 },
      { d: "M55 41 Q60.5 45 66 41", sw: 1.8, slot: "face" },
      { d: "M43 32 C42 12 78 12 77 32", strokeColor: "var(--coral)", sw: 3.2 },
      { d: `${rrect(38, 27, 8, 13, 3)} ${rrect(74, 27, 8, 13, 3)}`, fillColor: "var(--coral)", solid: true },
      { d: "M75 56 L92 42", sw: 3.4, cls: "baton" },
      { d: circ(93, 41, 4), fillColor: SKIN, solid: true, cls: "baton" },
      { d: "M93 41 L110 18", sw: 1.8, cls: "baton" },
    ],
  },
};

export const band = ["clawd", "muse", "codex", "grok", "openclaw"] as const;
export type CharId = keyof typeof characters;

// ---------------------------------------------------------------- expressions

export type Expr = "happy" | "wink" | "surprised" | "sleepy" | "love" | "cool" | "grin" | "determined";

export function expression(a: Anchors, e: Expr): Part[] {
  const [[lx, ly], [rx, ry]] = a.eyes;
  const [mx, my] = a.mouth;
  const r = a.eyeR;
  const w = Math.max(3, (rx - lx) * 0.28);
  const k = r * 1.4;
  const c = a.face;
  const dots = (s = 1) => ({ d: `${circ(lx, ly, r * s)} ${circ(rx, ry, r * s)}`, fillColor: c, solid: true, noStroke: true });
  const smile = { d: `M${mx - w} ${my} Q${mx} ${my + w * 0.9} ${mx + w} ${my}`, strokeColor: c, sw: 2 };
  switch (e) {
    case "happy":
      return [dots(0.85), smile];
    case "wink":
      return [
        { d: circ(lx, ly, r * 0.85), fillColor: c, solid: true, noStroke: true },
        { d: `M${rx - k} ${ry + 1} Q${rx} ${ry - k} ${rx + k} ${ry + 1}`, strokeColor: c, sw: 2.2 },
        smile,
      ];
    case "surprised":
      return [
        { d: `${circ(lx, ly, r * 1.25)} ${circ(rx, ry, r * 1.25)}`, strokeColor: c, sw: 1.8 },
        dots(0.45),
        { d: ell(mx, my + 1, w * 0.35, w * 0.45), fillColor: c, solid: true, noStroke: true },
      ];
    case "sleepy":
      return [
        { d: `M${lx - k} ${ly} Q${lx} ${ly + k * 0.9} ${lx + k} ${ly} M${rx - k} ${ry} Q${rx} ${ry + k * 0.9} ${rx + k} ${ry}`, strokeColor: c, sw: 2 },
        { d: `M${mx - w * 0.3} ${my + 1} L${mx + w * 0.3} ${my + 1}`, strokeColor: c, sw: 1.8 },
      ];
    case "love":
      return [
        { d: `${heart(lx, ly, r * 1.3)} ${heart(rx, ry, r * 1.3)}`, fillColor: "var(--coral)", solid: true, noStroke: true },
        smile,
      ];
    case "cool": {
      const g = r * 1.9;
      return [
        {
          d: `${rrect(lx - g, ly - g * 0.7, g * 2, g * 1.4, 2)} ${rrect(rx - g, ry - g * 0.7, g * 2, g * 1.4, 2)} M${lx + g} ${ly} L${rx - g} ${ry}`,
          fillColor: c === INK ? INK : "var(--mustard)",
          solid: true,
          sw: 1.6,
        },
        { d: `M${mx - w} ${my + 1} Q${mx} ${my + w * 0.5} ${mx + w} ${my - w * 0.3}`, strokeColor: c, sw: 2 },
      ];
    }
    case "grin":
      return [
        dots(0.9),
        { d: `M${mx - w * 1.2} ${my - 1} L${mx + w * 1.2} ${my - 1} Q${mx} ${my + w * 1.5} ${mx - w * 1.2} ${my - 1} Z`, fillColor: c, solid: true },
      ];
    case "determined":
      return [
        dots(0.8),
        { d: `M${lx - k} ${ly - k * 1.3} L${lx + k} ${ly - k * 0.7} M${rx + k} ${ry - k * 1.3} L${rx - k} ${ry - k * 0.7}`, strokeColor: c, sw: 2.4 },
        { d: `M${mx - w * 0.6} ${my + 1} L${mx + w * 0.6} ${my + 1}`, strokeColor: c, sw: 2.2 },
      ];
  }
}

// ---------------------------------------------------------------- accessories

export type Acc =
  | "party" | "grad" | "hardhat" | "crown" | "headset" | "glasses" | "bow" | "flower"
  | "zzz" | "heart" | "sweat" | "coffee" | "magnifier" | "balloon" | "wrench" | "flag" | "note";

export function accessory(a: Anchors, kind: Acc): Part[] {
  const [tx, ty] = a.top;
  const tw = a.topW;
  const [hx, hy] = a.hand;
  const [[lx, ly], [rx, ry]] = a.eyes;
  switch (kind) {
    case "party":
      return [
        { d: `M${tx - tw * 0.22} ${ty + 2} L${tx} ${ty - 24} L${tx + tw * 0.22} ${ty + 2} Z`, fillColor: "var(--purple)", solid: true },
        { d: `M${tx - tw * 0.13} ${ty - 6} L${tx + tw * 0.13} ${ty - 10} M${tx - tw * 0.07} ${ty - 15} L${tx + tw * 0.07} ${ty - 17}`, strokeColor: PAPER, sw: 1.6 },
        { d: circ(tx, ty - 26, 3.4), fillColor: "var(--mustard)", solid: true },
      ];
    case "grad":
      return [
        { d: `M${tx - tw * 0.26} ${ty - 3} L${tx - tw * 0.26} ${ty + 4} Q${tx} ${ty + 9} ${tx + tw * 0.26} ${ty + 4} L${tx + tw * 0.26} ${ty - 3}`, fillColor: INK, solid: true },
        { d: `M${tx - tw * 0.48} ${ty - 5} L${tx} ${ty - 14} L${tx + tw * 0.48} ${ty - 5} L${tx} ${ty + 3} Z`, fillColor: INK, solid: true },
        { d: `M${tx} ${ty - 5} L${tx + tw * 0.4} ${ty - 2} L${tx + tw * 0.4} ${ty + 9}`, strokeColor: "var(--mustard)", sw: 2 },
      ];
    case "hardhat":
      return [
        { d: `M${tx - tw * 0.36} ${ty + 3} C${tx - tw * 0.36} ${ty - 19} ${tx + tw * 0.36} ${ty - 19} ${tx + tw * 0.36} ${ty + 3} Z`, fillColor: "var(--mustard)", solid: true },
        { d: `M${tx - tw * 0.5} ${ty + 3} L${tx + tw * 0.5} ${ty + 3} M${tx} ${ty - 13} L${tx} ${ty + 2}`, sw: 2.6 },
      ];
    case "crown":
      return [
        { d: `M${tx - 12} ${ty + 1} L${tx - 11} ${ty - 11} L${tx - 5} ${ty - 5} L${tx} ${ty - 14} L${tx + 5} ${ty - 5} L${tx + 11} ${ty - 11} L${tx + 12} ${ty + 1} Z`, fillColor: "var(--mustard)", solid: true },
      ];
    case "headset":
      return [
        { d: `M${tx - tw * 0.5} ${ty + 16} C${tx - tw * 0.52} ${ty - 12} ${tx + tw * 0.52} ${ty - 12} ${tx + tw * 0.5} ${ty + 16}`, sw: 2.6 },
        { d: `${rrect(tx - tw * 0.5 - 4, ty + 10, 8, 13, 3)} ${rrect(tx + tw * 0.5 - 4, ty + 10, 8, 13, 3)}`, fillColor: "var(--coral)", solid: true },
        { d: `M${tx - tw * 0.5} ${ty + 22} Q${tx - tw * 0.45} ${ty + 34} ${tx - tw * 0.18} ${ty + 34}`, sw: 1.8 },
        { d: circ(tx - tw * 0.16, ty + 34, 2.4), fillColor: INK, solid: true },
      ];
    case "glasses": {
      const g = a.eyeR * 2;
      return [{ d: `${circ(lx, ly, g)} ${circ(rx, ry, g)} M${lx + g} ${ly} L${rx - g} ${ry}`, strokeColor: a.face, sw: 1.8 }];
    }
    case "bow": {
      const x = tx + tw * 0.32;
      return [
        { d: `M${x} ${ty + 1} L${x - 9} ${ty - 6} L${x - 9} ${ty + 8} Z M${x} ${ty + 1} L${x + 9} ${ty - 6} L${x + 9} ${ty + 8} Z`, fillColor: PINK, solid: true },
        { d: circ(x, ty + 1, 2.6), fillColor: "var(--coral)", solid: true },
      ];
    }
    case "flower": {
      const x = tx + tw * 0.34;
      const y = ty - 1;
      return [
        { d: [0, 1, 2, 3, 4].map((i) => circ(x + 5 * Math.cos((i * 2 * Math.PI) / 5), y + 5 * Math.sin((i * 2 * Math.PI) / 5), 3.6)).join(" "), fillColor: PAPER, solid: true, sw: 1.4 },
        { d: circ(x, y, 3), fillColor: "var(--mustard)", solid: true },
      ];
    }
    case "zzz": {
      const x = tx + tw * 0.45;
      const y = ty - 4;
      const z = (x0: number, y0: number, s: number) => `M${x0} ${y0} L${x0 + s} ${y0} L${x0} ${y0 + s} L${x0 + s} ${y0 + s}`;
      return [{ d: `${z(x, y, 6)} ${z(x + 8, y - 9, 5)} ${z(x + 15, y - 16, 4)}`, strokeColor: "var(--blue)", sw: 1.8, cls: "zzz" }];
    }
    case "heart":
      return [{ d: heart(tx + tw * 0.42, ty - 10, 5), fillColor: "var(--coral)", solid: true, cls: "float-heart" }];
    case "sweat": {
      const x = tx + tw * 0.5;
      const y = ty + 10;
      return [{ d: `M${x} ${y} C${x - 4} ${y + 6} ${x - 4} ${y + 10} ${x} ${y + 10} C${x + 4} ${y + 10} ${x + 4} ${y + 6} ${x} ${y} Z`, fillColor: CYAN, solid: true, sw: 1.2 }];
    }
    case "coffee":
      return [
        { d: rrect(hx - 5, hy - 6, 12, 14, 2), fillColor: "var(--coral)", solid: true },
        { d: `M${hx + 7} ${hy - 2} C${hx + 12} ${hy - 2} ${hx + 12} ${hy + 5} ${hx + 7} ${hy + 5}`, sw: 1.8 },
        { d: `M${hx - 1} ${hy - 9} C${hx - 3} ${hy - 13} ${hx + 1} ${hy - 15} ${hx - 1} ${hy - 19} M${hx + 4} ${hy - 9} C${hx + 2} ${hy - 13} ${hx + 6} ${hy - 15} ${hx + 4} ${hy - 19}`, sw: 1.4, cls: "steam" },
      ];
    case "magnifier":
      return [
        { d: `M${hx} ${hy + 2} L${hx + 6} ${hy - 5}`, sw: 3.2 },
        { d: circ(hx + 11, hy - 10, 7.5), fillColor: "#cfe6ff", solid: true, sw: 2 },
      ];
    case "balloon":
      return [
        { d: `M${hx} ${hy} C${hx + 5} ${hy - 10} ${hx - 4} ${hy - 18} ${hx + 2} ${hy - 28}`, sw: 1.2 },
        { d: ell(hx + 2, hy - 39, 9, 11), fillColor: "var(--coral)", solid: true, cls: "balloon" },
      ];
    case "wrench":
      return [
        { d: `M${hx} ${hy + 2} L${hx + 13} ${hy - 12}`, sw: 3.6 },
        { d: `M${hx + 11} ${hy - 18} A5 5 0 1 0 ${hx + 19} ${hy - 10}`, sw: 3 },
      ];
    case "flag":
      return [
        { d: `M${hx} ${hy + 4} L${hx} ${hy - 28}`, sw: 2 },
        { d: `M${hx} ${hy - 28} L${hx + 17} ${hy - 22} L${hx} ${hy - 16} Z`, fillColor: "var(--teal)", solid: true },
      ];
    case "note":
      return [
        { d: `M${hx + 8} ${hy - 6} L${hx + 8} ${hy - 22} C${hx + 13} ${hy - 19} ${hx + 15} ${hy - 16} ${hx + 13} ${hy - 11}`, sw: 1.8, cls: "float-heart" },
        { d: ell(hx + 5, hy - 5, 4, 3), fillColor: INK, solid: true, cls: "float-heart" },
      ];
  }
}

/** assemble the parts for one appearance of a character */
export function buildParts(id: CharId, o: { mini?: boolean; expr?: Expr; acc?: Acc[] } = {}): Part[] {
  const c = characters[id];
  let parts: SPart[] = c.parts;
  if (o.mini) parts = parts.filter((p) => p.slot !== "inst");
  if (o.expr) parts = parts.filter((p) => p.slot !== "face");
  const hats = ["party", "grad", "hardhat", "crown", "headset"];
  if (o.acc?.some((x) => hats.includes(x))) parts = parts.filter((p) => p.slot !== "acc");
  return [
    ...parts,
    ...(o.expr ? expression(c.anchors, o.expr) : []),
    ...(o.acc ?? []).flatMap((x) => accessory(c.anchors, x)),
  ];
}
