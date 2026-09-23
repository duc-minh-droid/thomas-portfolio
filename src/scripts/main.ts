import Lenis from "lenis";
import { annotate } from "rough-notation";
import { gsap, ScrollTrigger, $, $$, root, motion, drawIn, revealOnScroll, cssColor, safe } from "./core";
import { initHero } from "./hero";
import { initTimeline } from "./timeline";
import { initMindmap } from "./mindmap";
import { initPad } from "./pad";
import { initContact } from "./contact";
import { initBand } from "./band";
import { initClaude } from "./claude";

let lenis: Lenis | null = null;

safe("scroll", () => {
  if (motion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href")!;
    const target = hash === "#top" ? $("#top") : $(hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: hash === "#top" ? 0 : -10, duration: 1.5 });
    else target.scrollIntoView({ behavior: motion ? "smooth" : "auto" });
    history.replaceState(null, "", hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
});

// line boil only runs for doodles on screen
safe("boil", () => {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.target.classList.toggle("in-view", en.isIntersecting)),
    { rootMargin: "80px" },
  );
  $$(".boil").forEach((el) => io.observe(el));
});

// doodles ink themselves in on scroll
safe("draw", () => {
  $$("[data-draw]")
    .filter((el) => !el.closest("#top"))
    .forEach((el) => {
      if (!motion) return void drawIn(el);
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => void drawIn(el, 1.1) });
    });
});

// generic fade-ups, section-by-section
safe("reveal", () => {
  if (!motion) return;
  const els = $$("[data-reveal]");
  gsap.set(els, { opacity: 0, y: 26 });
  ScrollTrigger.batch(els, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.09, clearProps: "y" }),
  });

  const jobs = $$("[data-job]");
  revealOnScroll(jobs, { y: 90, rotation: (i) => [-5, 4, -3][i % 3], opacity: 0 }, { trigger: jobs[0], start: "top 85%", stagger: 0.14, duration: 1.1 });

  const clubs = $$("[data-club]");
  revealOnScroll(clubs, { y: -70, rotation: (i) => (i % 2 ? 14 : -14), opacity: 0 }, {
    trigger: clubs[0],
    start: "top 85%",
    stagger: 0.12,
    duration: 1,
    ease: "back.out(1.5)",
  });

  const report = $("[data-report]");
  if (report) {
    revealOnScroll([report], { x: 70, rotation: 8, opacity: 0 }, { start: "top 85%", duration: 1.1 });
    ScrollTrigger.create({
      trigger: report,
      start: "top 70%",
      once: true,
      onEnter: () => $$("[data-stamp]", report).forEach((s, i) => setTimeout(() => s.classList.add("inked"), 500 + i * 350)),
    });
  }
});

// hand-drawn circles/underlines on key numbers
safe("annotate", () => {
  $$("[data-mark]").forEach((el) => {
    const type = el.dataset.mark as "circle" | "underline" | "highlight" | "box";
    const color = type === "highlight" ? "rgba(255, 214, 60, 0.6)" : cssColor(el.dataset.markColor ?? "var(--coral)");
    const a = annotate(el, {
      type,
      color,
      strokeWidth: type === "highlight" ? 1 : 2,
      padding: type === "circle" ? [3, 5] : type === "highlight" ? 1 : 2,
      iterations: 2,
      animate: motion,
      animationDuration: 800,
      multiline: true,
    });
    if (!motion) return a.show();
    // wait for the job card's reveal (1.1s + stagger) so rough-notation measures the settled layout
    ScrollTrigger.create({ trigger: el, start: "top 78%", once: true, onEnter: () => setTimeout(() => a.show(), 1500) });
  });
});

// project recordings: load when near, play only while visible
safe("media", () => {
  const load = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLVideoElement | HTMLImageElement;
        if (el instanceof HTMLImageElement && !motion) return load.unobserve(el);
        el.src = el.dataset.src!;
        load.unobserve(el);
      }),
    { rootMargin: "600px 0px" },
  );
  const play = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        const v = en.target as HTMLVideoElement;
        if (en.isIntersecting && motion) v.play().catch(() => {});
        else v.pause();
      }),
    { threshold: 0.3 },
  );
  $$<HTMLVideoElement | HTMLImageElement>("[data-src]").forEach((el) => {
    load.observe(el);
    if (el instanceof HTMLVideoElement) {
      if (motion) play.observe(el);
      else {
        el.controls = true;
        el.preload = "metadata";
      }
    }
  });
});

// margin + aside doodles drift at their own speed
safe("parallax", () => {
  if (!motion) return;
  $$("[data-speed]")
    .filter((el) => !el.closest("#top"))
    .forEach((el) => {
      const speed = Number(el.dataset.speed) || 0.2;
      gsap.to(el, {
        y: () => -speed * innerHeight * 0.8,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
    });
});

// tabs follow the section you're on; the top bar tucks away while scrolling down
safe("nav", () => {
  const tabs = $$("[data-tab]");
  tabs.forEach((tab) => {
    const section = $(`#${tab.dataset.tab}`);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (s) => {
        tab.classList.toggle("active", s.isActive);
        if (s.isActive) tab.setAttribute("aria-current", "true");
        else tab.removeAttribute("aria-current");
      },
    });
  });
  const bar = $(".topbar");
  if (bar) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (s) => {
        bar.classList.toggle("hidden", s.direction === 1 && s.scroll() > 240);
        bar.classList.toggle("scrolled", s.scroll() > 40);
      },
    });
  }
});

safe("hero", () => void initHero().catch((e) => (console.error(e), root.classList.remove("motion"))));
safe("timeline", initTimeline);
safe("mindmap", initMindmap);
safe("pad", initPad);
safe("contact", initContact);
safe("band", initBand);
safe("claude", initClaude);

root.classList.add("booted");
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
