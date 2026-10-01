import { $, $$ } from "./core";
import { at, lerp, soft, stage as getStage, strokes, traceText } from "./agent-engine";

// Hero build: five agents lay out the nav and buttons, outline the name, type the copy,
// frame and sketch the band, then paint it in. (Scroll refinements live in refine.ts.)

/* ------------------------------------------------------------- choreography */

export function buildHero(hero: HTMLElement) {
  const st = getStage();
  if (!st) return;
  const { layer, agents } = st;
  const root = document.documentElement;
  const { opus, gemini, gpt, grok, muse } = agents;
  const B = st.now(); // the build's zero on the shared clock

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
  gpt.until(B + 0.45).go(helloT.start, "pencil");
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
  opus.until(B + 1.0).go(frameStart, "pencil");
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
  muse.until(B + 0.2).go(() => at(navItems[0], 0, 0), "pen");
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

  // --- run (agents stay on the stage afterwards; refine.ts reuses them while you scroll)
  let over = false;
  const all = Object.values(agents);
  const heroSteps = new Map(all.map((a) => [a, a.segs.length]));

  const cleanup = () => {
    if (over) return;
    over = true;
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
    root.classList.add("ab-built");
    root.classList.remove("ab-busy");
    removeEventListener("pointerdown", skip);
    removeEventListener("keydown", skip);
  };
  const skip = (e: Event) => {
    if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey || e.altKey || e.key === "Shift")) return;
    all.forEach((a) => a.flush(heroSteps.get(a)!));
    cleanup();
  };

  root.classList.add("ab-busy");
  addEventListener("pointerdown", skip, { passive: true });
  addEventListener("keydown", skip);
  st.watch(() => {
    if (over) return true;
    if (all.every((a) => a.i >= heroSteps.get(a)!)) {
      cleanup();
      return true;
    }
  });
}
