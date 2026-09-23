import { gsap, $, $$, motion } from "./core";

const TEMPOS = [
  { word: "andante", beat: "0.55s" },
  { word: "presto!", beat: "0.3s" },
  { word: "fermata…", beat: "" },
];

// The band starts once the hero has drawn it in, and only plays while on screen.
export function initBand() {
  const stage = $("[data-band]");
  if (!stage) return;
  const conductor = $<HTMLButtonElement>("[data-conductor]", stage)!;
  const bubble = $("[data-tempo]", stage)!;
  let started = false;
  let visible = true;
  let tempo = 0;
  let hide = 0;

  const sync = () => stage.classList.toggle("playing", motion && started && visible);

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    sync();
  }).observe(stage);

  if (motion)
    setTimeout(() => {
      started = true;
      sync();
    }, 2200);

  conductor.addEventListener("click", () => {
    tempo = (tempo + 1) % TEMPOS.length;
    const t = TEMPOS[tempo];
    bubble.textContent = t.word;
    bubble.classList.add("show");
    clearTimeout(hide);
    hide = window.setTimeout(() => bubble.classList.remove("show"), 1600);
    stage.classList.toggle("paused", !t.beat);
    if (t.beat) stage.style.setProperty("--beat", t.beat);
    if (motion) gsap.fromTo(bubble, { scale: 0.6, rotate: -18 }, { scale: 1, rotate: -6, duration: 0.45, ease: "back.out(3)" });
  });

  // touch devices have no hover: tap a musician for a two-second solo
  $$("[data-musician]", stage).forEach((m) =>
    m.addEventListener("click", () => {
      m.classList.add("solo-on");
      setTimeout(() => m.classList.remove("solo-on"), 2000);
    }),
  );
}
