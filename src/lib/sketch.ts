import rough from "roughjs";
import { doodles, type Part } from "./doodles";

export type SketchPath = { d: string; stroke: string; width: number; fill?: string; cls?: string };

export type SketchOpts = {
  seed?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  hachureGap?: number;
  hachureAngle?: number;
};

const gen = rough.generator();
// sentinel colours let us tell outline strokes from fill strokes in rough's output
const LINE = "#000001";
const FILL = "#000002";

type Drawable = ReturnType<typeof gen.path>;

// Deterministic seed from a string so the same doodle looks the same on every build.
export const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (Math.abs(h) % 2 ** 31) + 1;
};

const toSketch = (drawable: Drawable, stroke: string, fill: string | undefined, cls?: string): SketchPath[] =>
  gen.toPaths(drawable).map((info) => {
    // solid fill → a filled path with no stroke; hachure fill → strokes in the fill colour
    if (info.fill === FILL) return { d: info.d, stroke: "none", width: 0, fill, cls: [cls, "solid"].filter(Boolean).join(" ") };
    const isHachure = info.stroke === FILL;
    return {
      d: info.d,
      stroke: isHachure ? (fill ?? "var(--ink)") : stroke,
      width: info.strokeWidth,
      cls: [cls, isHachure ? "hachure" : ""].filter(Boolean).join(" ") || undefined,
    };
  });

export function sketchParts(parts: Part[], o: SketchOpts = {}): SketchPath[] {
  const sw = o.strokeWidth ?? 2;
  return parts.flatMap((p, i) => {
    const fill = p.fillColor ?? (p.fill ? o.fill : undefined);
    const width = p.sw ?? sw;
    return toSketch(
      gen.path(p.d, {
        seed: (o.seed ?? 1) + i * 7,
        stroke: p.noStroke ? "none" : LINE,
        strokeWidth: width,
        roughness: o.roughness ?? 1.1,
        bowing: o.bowing ?? 1,
        fill: fill ? FILL : undefined,
        fillStyle: p.solid ? "solid" : "hachure",
        fillWeight: width * 0.6,
        hachureGap: o.hachureGap ?? 5.5,
        hachureAngle: o.hachureAngle ?? -41,
      }),
      p.strokeColor ?? o.stroke ?? "var(--ink)",
      fill,
      p.cls,
    );
  });
}

export function sketchDoodle(name: string, o: SketchOpts = {}): SketchPath[] {
  return sketchParts(doodles[name] ?? doodles.star, o);
}

// A rough rectangle in a 0..100 box, stretched to fit its host (non-scaling stroke).
export function sketchBox(o: SketchOpts & { inset?: number } = {}): SketchPath[] {
  const i = o.inset ?? 1.5;
  return toSketch(
    gen.rectangle(i, i, 100 - i * 2, 100 - i * 2, {
      seed: o.seed ?? 1,
      stroke: LINE,
      strokeWidth: o.strokeWidth ?? 1.6,
      roughness: o.roughness ?? 0.9,
      bowing: o.bowing ?? 0.6,
    }),
    o.stroke ?? "var(--ink)",
    undefined,
  );
}

export function sketchCircle(o: SketchOpts = {}): SketchPath[] {
  return toSketch(
    gen.ellipse(50, 50, 90, 88, {
      seed: o.seed ?? 1,
      stroke: LINE,
      strokeWidth: o.strokeWidth ?? 1.8,
      roughness: o.roughness ?? 1.2,
      fill: o.fill ? FILL : undefined,
      fillStyle: "hachure",
      fillWeight: 1,
      hachureGap: o.hachureGap ?? 7,
    }),
    o.stroke ?? "var(--ink)",
    o.fill,
  );
}
