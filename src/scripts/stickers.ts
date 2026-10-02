import { gsap, ScrollTrigger, $, $$, motion } from "./core";

// stickers get slapped on as they scroll into view (a drop, a squash, a settle)
export function initStickers() {
  if (!motion) return;
  $$(".sticker-slot").forEach((slot, i) => {
    const art = $(".sticker-art", slot);
    if (!art) return;
    ScrollTrigger.create({
      trigger: slot,
      start: "top 92%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          art,
          { opacity: 0, scale: 1.9, y: -46, rotation: i % 2 ? 14 : -14 },
          { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.55, ease: "back.out(2.4)", clearProps: "transform" },
        );
      },
    });
  });
}
