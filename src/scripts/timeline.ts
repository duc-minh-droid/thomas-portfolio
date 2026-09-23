import { gsap, ScrollTrigger, $, $$, motion, seeded, smoothPath, revealOnScroll } from "./core";

// Tip of the spine pencil: 64px doodle rotated -45deg → tip points straight down.
const TIP = { x: 32, y: 67 };

export function initTimeline() {
  const tl = $("[data-timeline]");
  if (!tl) return;
  const svg = $<SVGSVGElement>(".spine", tl)!;
  const ghost = $<SVGPathElement>(".spine-ghost", svg)!;
  const inks = $$<SVGPathElement>(".spine-ink, .spine-ink-2", svg);
  const pencil = $(".spine-pencil", tl)!;
  const stamps = $$(".spine-stamp", tl);
  let stampYs: number[] = [];
  let len = 1;
  let progress = motion ? 0 : 1;

  const build = () => {
    const w = tl.clientWidth;
    const h = tl.clientHeight;
    const mobile = matchMedia("(max-width: 860px)").matches;
    const x0 = mobile ? 20 : w / 2;
    const rnd = seeded(7);
    const pts: [number, number][] = [];
    const end = h - 70;
    for (let y = 0; y <= end; y += 110) pts.push([x0 + Math.sin(y / 170) * (mobile ? 3 : 9) + (rnd() - 0.5) * 8, y]);
    pts.push([x0, end]);
    const d = smoothPath(pts);
    const d2 = smoothPath(pts.map(([x, y], i) => [x + 1.6 + Math.sin(i * 2.1) * 1.4, y + 2]));

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    ghost.setAttribute("d", d);
    inks[0].setAttribute("d", d);
    inks[1].setAttribute("d", d2);
    inks.forEach((p) => {
      p.setAttribute("pathLength", "1");
      p.style.strokeDasharray = "1 1";
    });
    len = ghost.getTotalLength();

    stampYs = stamps.map((s) => s.offsetTop + (s.offsetParent as HTMLElement).offsetTop);
    render();
  };

  const render = () => {
    inks.forEach((p) => (p.style.strokeDashoffset = String(1 - progress)));
    const pt = ghost.getPointAtLength(progress * len);
    gsap.set(pencil, { x: pt.x - TIP.x, y: pt.y - TIP.y, opacity: motion && progress > 0.002 && progress < 0.998 ? 1 : 0 });
    stamps.forEach((s, i) => s.classList.toggle("inked", !motion || stampYs[i] < pt.y + 24));
  };

  build();
  ScrollTrigger.addEventListener("refresh", build);

  if (motion) {
    ScrollTrigger.create({
      trigger: tl,
      start: "top 62%",
      end: "bottom 80%",
      scrub: 0.6,
      onUpdate: (self) => {
        progress = self.progress;
        render();
      },
    });
  }

  // cards slide in from their side, settle with a little rotation
  $$("[data-item]", tl).forEach((item) => {
    const left = item.classList.contains("left");
    const card = $("[data-card]", item)!;
    const aside = $(".aside", item);
    revealOnScroll([card], { x: left ? -60 : 60, y: 50, rotation: left ? -7 : 7, opacity: 0 }, { trigger: item, start: "top 80%", duration: 1.1 });
    if (aside) revealOnScroll([aside], { y: 40, opacity: 0 }, { trigger: item, start: "top 70%", duration: 1.2 });
  });
}
