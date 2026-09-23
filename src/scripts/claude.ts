import { gsap, ScrollTrigger, $, $$ } from "./core";

const VERBS = ["Doodling", "Orchestrating", "Percolating", "Sketching", "Noodling", "Inking"];
// when each usage-limit segment fills
const SEG_STEPS = [2, 5, 7, 10, 11];

// A scripted Claude Code session. Desktop: the stage pins and scrolling scrubs the
// session (so it rewinds too). Smaller screens: it plays once when reached.
// Reduced motion: it jumps straight to the finished state.
export function initClaude() {
  const stage = $("[data-cc]");
  if (!stage) return;
  const q = <T extends Element = HTMLElement>(s: string) => $<T>(s, stage)!;
  const lines = $$("[data-step]", stage);
  const [m0, m1, m2] = $$(".mode", stage);
  const fill = q("[data-ctx-fill]");
  const ctxText = q("[data-ctx]");
  const ctxLeft = q("[data-ctx-left]");
  const tokensTotal = q("[data-tokens-total]");
  const tokens = q("[data-tokens]");
  const secs = q("[data-secs]");
  const verb = q("[data-verb]");

  const st = { ctx: 2, secs: 0 };
  const render = () => {
    const c = Math.max(0, Math.min(100, st.ctx));
    fill.style.transform = `scaleX(${c / 100})`;
    fill.classList.toggle("hot", c > 80);
    ctxText.textContent = String(Math.round(c));
    ctxLeft.textContent = String(Math.max(0, Math.round(100 - c)));
    const k = ((c / 100) * 200).toFixed(1) + "k";
    tokensTotal.textContent = k;
    tokens.textContent = k;
    secs.textContent = String(Math.round(st.secs));
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  const on = (el: Element | null, at: number, v = "1") => el && tl.set(el, { attr: { "data-on": v } }, at);

  gsap.set(lines, { display: "none" });
  for (let s = 1; s <= 11; s++) {
    const ls = lines.filter((l) => Number(l.dataset.step) === s);
    if (!ls.length) continue;
    tl.set(ls, { display: "block" }, s);
    tl.fromTo(ls, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, stagger: 0.12, ease: "steps(18)" }, s);
  }

  // shift+tab: default → plan → auto
  tl.to(m0, { opacity: 0, duration: 0.1 }, 2).to(m1, { opacity: 1, duration: 0.1 }, 2);
  tl.to(m1, { opacity: 0, duration: 0.1 }, 3).to(m2, { opacity: 1, duration: 0.1 }, 3);
  on(q("[data-cc-plan]"), 2);
  on(q("[data-cc-plan]"), 3, "0");
  on(q("[data-cc-auto]"), 3);

  // skill loads, MCP servers light up with their tool calls
  on(q('[data-skill-card="animate"]'), 4);
  on(q('[data-skill-card="animate"]'), 5, "0");
  on(q('[data-srv="playwright"]'), 6);
  on(q('[data-srv="playwright"]'), 7, "0");
  on(q('[data-srv="figma"]'), 7);
  on(q('[data-srv="figma"]'), 8, "0");

  // the context window fills… then auto-compacts
  [
    [1, 6], [2, 18], [4, 30], [5, 52], [6, 68], [7, 82], [8, 93], [10, 31], [11, 36],
  ].forEach(([at, v]) => tl.to(st, { ctx: v, duration: 0.6, ease: "power1.inOut", onUpdate: render }, at));
  tl.to(st, { secs: 42, duration: 1, onUpdate: render }, 8);
  tl.to(st, { ctx: 24, duration: 0.7, ease: "back.out(2.2)", onUpdate: render }, 9);
  on(q("[data-squish]"), 9);
  on(q("[data-squish]"), 10.4, "0");

  // usage limit ticks up; the session ends at the limit
  $$("[data-seg]", stage).forEach((seg, i) => on(seg, SEG_STEPS[i]));
  on(q("[data-moon]"), 11);
  tl.to({}, { duration: 0.8 }, 11.2);

  render();

  // matchMedia only calls back when at least one condition matches, so list the small-screen case too
  gsap.matchMedia().add(
    { desktop: "(min-width: 1101px)", small: "(max-width: 1100px)", reduce: "(prefers-reduced-motion: reduce)" },
    (ctx) => {
      const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
      if (reduce) {
        tl.progress(1);
        return;
      }
      const trigger = desktop
        ? ScrollTrigger.create({ trigger: stage, start: "top top", end: "+=2600", pin: true, scrub: 0.7, animation: tl, refreshPriority: 1 })
        : ScrollTrigger.create({ trigger: stage, start: "top 70%", once: true, onEnter: () => void tl.timeScale(1.5).play() });
      return () => trigger.kill();
    },
  );

  // whimsical spinner verbs, only while the section is on screen
  let timer = 0;
  let i = 0;
  new IntersectionObserver(([en]) => {
    clearInterval(timer);
    if (en.isIntersecting) timer = window.setInterval(() => (verb.textContent = VERBS[++i % VERBS.length]), 1100);
  }).observe(stage);
}
