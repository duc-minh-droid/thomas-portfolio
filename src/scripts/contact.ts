import { gsap, ScrollTrigger, $, $$, motion, drawIn } from "./core";

export function initContact() {
  const btn = $<HTMLButtonElement>("[data-copy]");
  const label = $("[data-copy-label]");
  const note = $("[data-copied]");
  const plane = $("[data-plane]");

  btn?.addEventListener("click", async () => {
    const email = btn.dataset.copy!;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      location.href = `mailto:${email}`;
      return;
    }
    if (label) label.textContent = "copied ✓";
    if (note) note.textContent = "copied! folding it into a plane…";
    setTimeout(() => {
      if (label) label.textContent = "copy email";
      if (note) note.textContent = "";
    }, 2600);

    if (!plane || !motion) return;
    gsap.killTweensOf(plane);
    gsap
      .timeline()
      .set(plane, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 0.4 })
      .to(plane, { scale: 1, duration: 0.25, ease: "back.out(3)" })
      .to(plane, {
        duration: 1.6,
        ease: "power1.in",
        motionPath: {
          path: [
            { x: 60, y: -30 },
            { x: 170, y: 20 },
            { x: 300, y: -40 },
            { x: 520, y: -220 },
            { x: 900, y: -520 },
          ],
          curviness: 1.5,
          autoRotate: 22,
        },
      })
      .to(plane, { opacity: 0, duration: 0.2 }, "-=0.25");
  });

  // signature writes itself, then the heart
  const sign = $("[data-signoff]");
  if (!sign) return;
  const chars = $$(".signature .char", sign);
  const heart = $(".sig-heart", sign);
  if (!motion) {
    if (heart) drawIn(heart);
    return;
  }
  ScrollTrigger.create({
    trigger: sign,
    start: "top 88%",
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      chars.forEach((c, i) =>
        tl.to(c, { clipPath: "inset(-50% -50% -50% -50%)", duration: 0.16, ease: "none", onComplete: () => void (c.style.clipPath = "none") }, i * 0.13),
      );
      if (heart) tl.add(() => void drawIn(heart, 0.7), ">-0.05");
    },
  });
}
