import { gsap, ScrollTrigger, $, $$, motion, finePointer, drawIn } from "./core";

// Pencil tip inside the 86px hero pencil doodle (viewBox -6..106, tip at 6,94).
const TIP = { x: (12 / 112) * 86, y: (100 / 112) * 86 };

const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);

export async function initHero() {
  const hero = $("#top");
  if (!hero) return;
  const name = $(".hero-name", hero)!;
  const chars = $$(".char", name);
  const pencil = $(".hero-pencil", name)!;
  const underline = $(".name-underline", name)!;
  const hides = $$("[data-hero-hide]");
  const deskDraws = $$("[data-hero-draw]", hero);
  const notes = $$("[data-hero-note]", hero);

  if (!motion) {
    deskDraws.concat(underline).forEach((el) => drawIn(el));
    return;
  }

  await fontsReady();

  const box = name.getBoundingClientRect();
  const rel = (r: DOMRect) => ({ l: r.left - box.left, t: r.top - box.top, w: r.width, h: r.height });

  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power2.out" } });

  // topbar + "hi, I'm"
  tl.to($(".topbar"), { opacity: 1, duration: 0.5 }, 0);
  tl.fromTo($(".hello", hero), { opacity: 0, y: 10, rotate: -10 }, { opacity: 1, y: 0, rotate: 0, duration: 0.5 }, 0.05);

  // the pencil writes the name, letter by letter
  const first = rel(chars[0].getBoundingClientRect());
  gsap.set(pencil, { x: first.l - TIP.x, y: first.t + first.h * 0.6 - TIP.y, opacity: 0, rotate: -8 });
  tl.to(pencil, { opacity: 1, duration: 0.2 }, 0.2);

  let at = 0.3;
  chars.forEach((c) => {
    const r = rel(c.getBoundingClientRect());
    const dur = 0.055 + r.w / 900;
    const midY = r.t + r.h * 0.62 - TIP.y;
    // wide margins so flourishes/overhangs aren't cropped; drop the mask entirely once written
    tl.to(c, { clipPath: "inset(-50% -50% -50% -50%)", duration: dur, ease: "none", onComplete: () => void (c.style.clipPath = "none") }, at);
    tl.to(
      pencil,
      {
        x: r.l + r.w - TIP.x,
        keyframes: { y: [midY + 14, midY - 22, midY + 16, midY], easeEach: "sine.inOut" },
        rotate: gsap.utils.random(-14, -2),
        duration: dur,
        ease: "none",
      },
      at,
    );
    at += dur * 0.9;
  });

  // swoop down, underline, flick away
  const ul = rel(underline.getBoundingClientRect());
  tl.to(pencil, { x: ul.l - TIP.x, y: ul.t + ul.h * 0.5 - TIP.y, rotate: -20, duration: 0.22, ease: "power2.inOut" }, at);
  at += 0.2;
  tl.add(() => void drawIn(underline, 0.5), at);
  tl.to(pencil, { x: ul.l + ul.w - TIP.x, y: ul.t + ul.h * 0.2 - TIP.y, duration: 0.5, ease: "power1.inOut" }, at);
  tl.to(pencil, { x: "+=140", y: "-=160", rotate: 25, opacity: 0, duration: 0.55, ease: "power2.in" }, at + 0.5);

  // the desk draws itself in parallel
  deskDraws.forEach((el, i) => tl.add(() => void drawIn(el, 0.9), 0.35 + i * 0.1));
  if (notes.length) tl.fromTo(
    notes,
    { opacity: 0, scale: 1.35, y: -18 },
    { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2.2)", stagger: 0.12, clearProps: "scale,y" },
    1.1,
  );

  // copy + stickers
  const copy = hides.filter((el) => !el.classList.contains("hello") && !el.classList.contains("topbar"));
  tl.fromTo(copy, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, clearProps: "y" }, at - 0.1);
  const burst = $(".sticker-burst", hero);
  if (burst) tl.fromTo(burst, { scale: 0.3, rotate: -60 }, { scale: 1, rotate: -10, duration: 0.7, ease: "back.out(2.4)" }, at + 0.1);

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
