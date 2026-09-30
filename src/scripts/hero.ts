import { gsap, ScrollTrigger, $, $$, motion, finePointer, drawIn } from "./core";
import { buildHero } from "./agents";

const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);

export async function initHero() {
  const hero = $("#top");
  if (!hero) return;
  const underline = $(".name-underline", hero)!;
  const deskDraws = $$("[data-hero-draw]", hero);

  if (!motion) {
    deskDraws.concat(underline).forEach((el) => drawIn(el));
    return;
  }

  await fontsReady();

  // agents build the section: nav, name, copy, band, stickers, buttons (see agents.ts)
  buildHero(hero);

  // mouse parallax on the desk (depth-weighted)
  const items = $$<HTMLElement>("[data-depth]", hero);
  if (finePointer) {
    const setters = items.map((el) => ({
      d: Number(el.dataset.depth) || 0.5,
      x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
    }));
    let active = true;
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onToggle: (s) => (active = s.isActive || s.progress === 0) });
    window.addEventListener(
      "pointermove",
      (e) => {
        if (!active) return;
        const dx = e.clientX / innerWidth - 0.5;
        const dy = e.clientY / innerHeight - 0.5;
        setters.forEach((s) => {
          s.x(-dx * s.d * 34);
          s.y(-dy * s.d * 34);
        });
      },
      { passive: true },
    );
  }

  // scrolling away: layers drift up at different speeds
  items.forEach((el) => {
    gsap.to(el, {
      // gentle: the band should drift, not leave the stage
      yPercent: -(Number(el.dataset.depth) || 0.5) * 14,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  });
}
