// Hand-authored doodle shapes in a 100×100 box. Rough.js turns them into
// pencil sketches at build time (see sketch.ts). `fill: true` parts get a
// hachure fill in the doodle's fill colour; `cls` lets CSS/JS target a part.

export type Part = {
  d: string;
  /** hachure-fill with the doodle's fill colour */
  fill?: boolean;
  cls?: string;
  /** per-part colours (characters); fillColor implies a fill */
  fillColor?: string;
  strokeColor?: string;
  /** solid fill instead of hachure */
  solid?: boolean;
  noStroke?: boolean;
  sw?: number;
};

export const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
export const rect = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
const star = (cx: number, cy: number, R: number, r: number, n = 5, rot = -Math.PI / 2) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = rot + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    return `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + " Z";
const gear = (cx: number, cy: number, R: number, r: number, teeth = 8) =>
  Array.from({ length: teeth * 4 }, (_, i) => {
    const a = (i * Math.PI * 2) / (teeth * 4);
    const rad = i % 4 < 2 ? R : r;
    return `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + " Z";
const spiral = (cx: number, cy: number, turns = 3.2, maxR = 42) => {
  const pts: string[] = [];
  const steps = Math.round(turns * 28);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const rad = t * maxR;
    pts.push(`${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const doodles: Record<string, Part[]> = {
  star: [{ d: star(50, 52, 42, 18), fill: true }],
  sparkle: [{ d: "M50 8 Q54 46 92 50 Q54 54 50 92 Q46 54 8 50 Q46 46 50 8 Z", fill: true }],
  burst: [{ d: star(50, 50, 49, 41, 16), fill: true }],
  spiral: [{ d: spiral(50, 50) }],
  arrow: [{ d: "M8 34 C34 8 70 14 86 56" }, { d: "M70 50 L87 60 L92 41" }],
  arrowCurl: [
    { d: "M8 84 C30 94 52 72 42 56 C34 44 18 56 28 66 C44 80 76 62 88 28" },
    { d: "M74 32 L89 26 L92 42" },
  ],
  arrowDown: [{ d: "M50 8 C44 34 56 58 50 88" }, { d: "M34 72 L50 90 L66 72" }],
  squiggle: [{ d: "M4 50 C14 28 24 72 34 50 C44 28 54 72 64 50 C74 28 84 72 96 50" }],
  underline: [{ d: "M2 55 C28 47 70 50 98 44" }, { d: "M8 64 C40 57 70 60 94 56" }],
  check: [{ d: "M14 54 L40 78 L88 20" }],
  heart: [{ d: "M50 84 C20 64 8 44 20 28 C30 16 46 20 50 34 C54 20 70 16 80 28 C92 44 80 64 50 84 Z", fill: true }],
  smiley: [
    { d: circ(50, 50, 40) },
    { d: "M36 38 L36 46 M64 38 L64 46" },
    { d: "M30 60 C40 76 60 76 70 60" },
  ],
  lightbulb: [
    { d: "M35 62 C20 50 22 18 50 16 C78 18 80 50 65 62 L64 72 L36 72 Z", fill: true },
    { d: "M38 79 L62 79 M41 86 L59 86" },
    { d: "M44 60 L47 44 L50 52 L53 44 L56 60" },
    { d: "M50 2 L50 8 M20 12 L25 17 M80 12 L75 17 M8 38 L14 38 M92 38 L86 38", cls: "rays" },
  ],
  brain: [
    { d: "M50 20 C40 10 22 16 24 30 C12 34 12 52 22 58 C18 70 32 80 44 74 C48 80 50 80 50 80 Z", fill: true },
    { d: "M50 20 C60 10 78 16 76 30 C88 34 88 52 78 58 C82 70 68 80 56 74 C52 80 50 80 50 80 L50 20" },
    { d: "M32 36 C38 34 40 42 36 46 M68 36 C62 34 60 42 64 46 M30 58 C36 54 42 60 44 56 M70 58 C64 54 58 60 56 56" },
  ],
  gear: [{ d: gear(50, 50, 42, 32, 9), fill: true }, { d: circ(50, 50, 13) }],
  rocket: [
    { d: "M50 6 C67 21 69 50 62 70 L38 70 C31 50 33 21 50 6 Z", fill: true },
    { d: circ(50, 35, 7) },
    { d: "M38 55 L23 74 L38 70 M62 55 L77 74 L62 70" },
    { d: "M42 74 Q50 98 58 74", cls: "flame" },
  ],
  plane: [
    { d: "M6 46 L94 12 L60 88 L46 58 Z", fill: true },
    { d: "M46 58 L94 12 M46 58 L43 80 L56 67" },
  ],
  coffee: [
    { d: "M22 40 L29 84 C31 91 61 91 63 84 L70 40 Z", fill: true },
    { d: "M69 50 C88 48 88 72 65 72" },
    { d: "M12 92 C30 98 64 98 82 92" },
    { d: "M36 32 C30 24 42 18 36 8 M50 32 C44 24 56 18 50 8", cls: "steam" },
  ],
  plant: [
    { d: "M30 64 L36 93 L64 93 L70 64 Z", fill: true },
    { d: "M25 64 L75 64" },
    { d: "M50 64 C50 50 50 40 50 24" },
    { d: "M50 48 C36 46 24 36 26 22 C42 24 50 34 50 48 Z M50 38 C62 34 74 22 72 10 C58 12 50 22 50 38 Z", cls: "leaf" },
  ],
  laptop: [
    { d: rect(18, 18, 64, 44), fill: true },
    { d: "M8 70 L92 70 L85 80 L15 80 Z" },
    { d: "M27 30 L45 30 M27 39 L58 39 M33 48 L51 48" },
  ],
  magnifier: [{ d: circ(42, 42, 25), fill: true }, { d: "M60 60 L88 88 M64 58 L90 84" }],
  cloud: [{ d: "M26 72 C8 72 8 48 26 48 C24 28 50 22 58 38 C66 26 88 30 85 50 C98 52 96 72 80 72 Z", fill: true }],
  bolt: [{ d: "M58 4 L22 56 L47 56 L39 96 L80 40 L54 40 L63 4 Z", fill: true }],
  chart: [
    { d: "M12 10 L12 88 L92 88" },
    { d: `${rect(22, 58, 13, 30)} ${rect(43, 40, 13, 48)} ${rect(64, 24, 13, 64)}`, fill: true },
    { d: "M18 48 L40 32 L58 38 L86 10" },
  ],
  grid: [
    { d: rect(12, 12, 76, 76) },
    { d: "M12 37 L88 37 M12 62 L88 62 M37 12 L37 88 M62 12 L62 88" },
    { d: rect(12, 12, 25, 25), fill: true },
  ],
  database: [
    { d: "M20 24 C20 10 80 10 80 24 C80 38 20 38 20 24 Z", fill: true },
    { d: "M20 24 L20 76 C20 90 80 90 80 76 L80 24" },
    { d: "M20 42 C20 56 80 56 80 42 M20 60 C20 74 80 74 80 60" },
  ],
  nodes: [
    { d: "M50 18 L20 78 M50 18 L80 78 M50 18 L50 56 M20 78 L50 56 L80 78" },
    { d: `${circ(50, 16, 10)} ${circ(18, 80, 10)} ${circ(82, 80, 10)} ${circ(50, 56, 8)}`, fill: true },
  ],
  eye: [
    { d: "M6 50 C28 18 72 18 94 50 C72 82 28 82 6 50 Z" },
    { d: circ(50, 50, 15), fill: true },
    { d: circ(50, 50, 5) },
  ],
  book: [
    { d: "M50 24 C38 15 20 15 8 22 L8 82 C20 75 38 75 50 84 Z", fill: true },
    { d: "M50 24 C62 15 80 15 92 22 L92 82 C80 75 62 75 50 84 L50 24" },
    { d: "M60 36 L82 32 M60 46 L82 42 M60 56 L78 53" },
  ],
  cube: [
    { d: "M50 8 L88 28 L88 72 L50 92 L12 72 L12 28 Z" },
    { d: "M12 28 L50 48 L88 28 L50 8 Z", fill: true },
    { d: "M50 48 L50 92" },
  ],
  card: [
    { d: rect(24, 6, 52, 88) },
    { d: rect(31, 13, 38, 74) },
    { d: star(50, 48, 14, 6), fill: true },
    { d: "M40 76 L60 76 M44 24 C48 20 52 20 56 24" },
  ],
  flag: [
    { d: "M22 94 L22 8" },
    { d: "M22 10 C42 2 56 22 82 12 L82 46 C56 56 42 36 22 44 Z", fill: true },
  ],
  trophy: [
    { d: "M30 12 L70 12 C70 44 62 56 50 58 C38 56 30 44 30 12 Z", fill: true },
    { d: "M30 20 C12 20 14 42 32 40 M70 20 C88 20 86 42 68 40" },
    { d: "M50 58 L50 74 M34 88 L66 88 L62 74 L38 74 Z" },
  ],
  envelope: [
    { d: rect(8, 22, 84, 58), fill: true },
    { d: "M8 22 L50 56 L92 22" },
    { d: "M8 80 L40 50 M92 80 L60 50" },
  ],
  pencil: [
    { d: "M14 74 L62 26 L74 38 L26 86 Z", fill: true },
    { d: "M14 74 L6 94 L26 86" },
    { d: "M62 26 L70 18 L82 30 L74 38" },
  ],
  castle: [
    {
      d: "M10 92 L10 38 L16 38 L16 31 L22 31 L22 38 L28 38 L28 31 L34 31 L34 38 L34 54 L66 54 L66 38 L66 31 L72 31 L72 38 L78 38 L78 31 L84 31 L84 38 L90 38 L90 92 Z",
      fill: true,
    },
    { d: "M34 54 L34 46 L41 46 L41 52 L47 52 L47 46 L53 46 L53 52 L59 52 L59 46 L66 46 L66 54" },
    { d: "M42 92 L42 76 C42 64 58 64 58 76 L58 92" },
    { d: "M22 31 L22 12 L34 17 L22 22" },
    { d: "M21 50 L21 60 M79 50 L79 60" },
  ],
  cursor: [
    { d: "M24 10 L24 80 L40 64 L52 90 L63 85 L51 60 L74 60 Z", fill: true },
    { d: "M74 16 L82 8 M80 30 L92 28 M66 8 L66 2" },
  ],
  mic: [
    { d: "M38 16 C38 3 62 3 62 16 L62 48 C62 61 38 61 38 48 Z", fill: true },
    { d: "M27 42 C27 72 73 72 73 42" },
    { d: "M50 66 L50 84 M34 88 L66 88" },
    { d: "M8 30 C4 38 4 46 8 54 M92 30 C96 38 96 46 92 54", cls: "waves" },
  ],
  camera: [
    { d: rect(10, 30, 80, 54), fill: true },
    { d: "M32 30 L39 17 L61 17 L68 30" },
    { d: `${circ(50, 57, 17)} ${circ(50, 57, 7)}` },
    { d: rect(72, 37, 10, 7) },
  ],
  lock: [
    { d: "M32 46 L32 32 C32 9 68 9 68 32 L68 46" },
    { d: rect(20, 46, 60, 46), fill: true },
    { d: `${circ(50, 64, 5)} M50 69 L50 80` },
  ],
  chat: [
    { d: "M12 14 L58 14 C66 14 66 48 58 48 L32 48 L18 62 L21 48 L12 48 C4 48 4 14 12 14 Z", fill: true },
    { d: "M46 56 L88 56 C96 56 96 84 88 84 L82 84 L85 96 L72 84 L46 84 C38 84 38 56 46 56 Z" },
    { d: "M60 70 L61 70 M69 70 L70 70 M78 70 L79 70" },
  ],
  zip: [
    { d: "M22 6 L64 6 L80 22 L80 94 L22 94 Z" },
    { d: "M64 6 L64 22 L80 22" },
    { d: "M46 10 L54 14 L46 18 L54 22 L46 26 L54 30 L46 34 L54 38 L46 42 L54 46" },
    { d: rect(42, 50, 16, 22), fill: true },
  ],
  clock: [
    { d: circ(50, 50, 40), fill: true },
    { d: "M50 50 L50 22 M50 50 L70 60", cls: "hands" },
    { d: "M50 14 L50 18 M86 50 L82 50 M50 86 L50 82 M14 50 L18 50" },
  ],
  blocks: [
    { d: `${rect(10, 18, 24, 24)} ${rect(64, 18, 26, 24)} ${rect(10, 50, 52, 24)}` },
    { d: `${rect(38, 18, 22, 24)} ${rect(66, 50, 24, 24)}`, fill: true },
    { d: "M22 94 L22 80 M16 86 L22 80 L28 86" },
  ],
  candles: [
    { d: "M22 12 L22 88 M50 8 L50 72 M78 28 L78 94" },
    { d: `${rect(14, 30, 16, 36)} ${rect(70, 44, 16, 34)}` },
    { d: rect(42, 20, 16, 30), fill: true },
  ],
  braces: [
    { d: "M38 10 C24 10 30 30 28 42 C26 48 20 50 14 50 C20 50 26 52 28 58 C30 70 24 90 38 90" },
    { d: "M62 10 C76 10 70 30 72 42 C74 48 80 50 86 50 C80 50 74 52 72 58 C70 70 76 90 62 90" },
    { d: "M44 50 L45 50 M56 50 L57 50" },
  ],
  shield: [
    { d: "M50 6 L86 19 C86 56 73 79 50 94 C27 79 14 56 14 19 Z", fill: true },
    { d: "M33 50 L46 63 L69 35" },
  ],
  clapper: [
    { d: rect(12, 42, 76, 48), fill: true },
    { d: "M12 42 L84 22 L88 33 L16 53" },
    { d: "M30 37 L36 47 M50 31 L56 42 M70 26 L76 36" },
  ],
  code: [{ d: "M32 24 L10 50 L32 76 M68 24 L90 50 L68 76" }, { d: "M58 16 L42 84" }],
  arrows: [
    { d: "M12 34 L82 34 M68 22 L84 34 L68 46" },
    { d: "M88 66 L18 66 M32 54 L16 66 L32 78" },
  ],
  theater: [
    { d: "M10 20 C28 14 48 14 60 20 C62 50 52 70 35 72 C18 70 8 50 10 20 Z", fill: true },
    { d: "M22 34 L29 34 M41 34 L48 34 M24 50 C30 58 40 58 46 50" },
    { d: "M42 40 C58 34 76 34 90 40 C92 68 82 88 66 90 C50 88 40 68 42 40 Z" },
    { d: "M54 54 L61 54 M72 54 L79 54 M57 76 C63 68 71 68 77 76" },
  ],
  flow: [
    { d: `${circ(16, 50, 11)} ${circ(84, 50, 11)}` },
    { d: rect(40, 38, 22, 24), fill: true },
    { d: "M27 50 L39 50 M34 45 L39 50 L34 55 M62 50 L72 50 M67 45 L72 50 L67 55" },
  ],
  pin: [{ d: circ(50, 30, 17), fill: true }, { d: "M50 47 L50 92 M36 47 L64 47" }],
  paperclip: [
    { d: "M40 20 L40 76 C40 94 66 94 66 76 L66 14 C66 0 48 0 48 14 L48 70 C48 78 58 78 58 70 L58 24" },
  ],
  gradcap: [
    { d: "M6 38 L50 18 L94 38 L50 58 Z", fill: true },
    { d: "M24 47 L24 70 C40 82 60 82 76 70 L76 47" },
    { d: "M88 41 L88 68 M84 72 L88 66 L92 72" },
  ],
  x: [{ d: "M20 20 L80 80 M80 20 L20 80" }],
  server: [
    { d: `${rect(16, 8, 68, 24)} ${rect(16, 64, 68, 24)}`, fill: true },
    { d: rect(16, 36, 68, 24) },
    { d: "M24 20 L50 20 M24 48 L50 48 M24 76 L50 76" },
    { d: "M50 88 L50 97 M28 97 L72 97" },
  ],
  plug: [
    { d: "M28 40 L72 40 L72 60 C72 76 28 76 28 60 Z", fill: true },
    { d: "M40 40 L40 18 M60 40 L60 18" },
    { d: "M50 74 C50 86 60 90 64 98" },
  ],
  ff: [{ d: "M8 20 L48 50 L8 80 Z M48 20 L88 50 L48 80 Z", fill: true }],
  pause: [{ d: `${rect(22, 16, 18, 68)} ${rect(60, 16, 18, 68)}`, fill: true }],
  moon: [
    { d: "M62 8 C32 12 18 44 30 68 C42 92 76 94 92 72 C66 78 44 58 48 34 C50 22 55 14 62 8 Z", fill: true },
    { d: "M78 18 L80 25 L87 27 L80 29 L78 36 L76 29 L69 27 L76 25 Z" },
  ],
  terminal: [
    { d: rect(6, 14, 88, 72) },
    { d: "M6 28 L94 28" },
    { d: "M20 44 L33 55 L20 66 M40 68 L60 68" },
    { d: `${circ(14, 21, 2.6)} ${circ(22, 21, 2.6)} ${circ(30, 21, 2.6)}`, fill: true },
  ],
  note: [{ d: "M50 74 L50 18 C64 26 72 34 66 50" }, { d: ell(40, 76, 11, 8), fill: true }],
  notes: [
    { d: "M36 76 L36 22 L78 12 L78 66 M36 34 L78 24" },
    { d: `${ell(27, 78, 10, 7)} ${ell(69, 68, 10, 7)}`, fill: true },
  ],
};

export type DoodleName = keyof typeof doodles;
