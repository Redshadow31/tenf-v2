"use client";

import { useEffect } from "react";

function animateCounter(element: HTMLElement) {
  if (element.dataset.animated === "true") return;

  const target = Number(element.dataset.counterTarget || "0");
  const prefix = element.dataset.counterPrefix || "";
  const suffix = element.dataset.counterSuffix || "";
  const duration = 1200;
  const start = performance.now();

  element.dataset.animated = "true";

  const format = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${prefix}${format(value)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

export default function AboutPageEnhancer() {
  useEffect(() => {
    document.documentElement.classList.add("about-js-enabled");

    const revealElements = Array.from(document.querySelectorAll<HTMLElement>(".about-reveal"));
    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animateCounter(entry.target as HTMLElement);
          counterObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.45, rootMargin: "0px 0px -30px 0px" }
    );

    const counters = Array.from(document.querySelectorAll<HTMLElement>(".about-counter"));
    counters.forEach((counter) => counterObserver.observe(counter));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      document.documentElement.classList.remove("about-js-enabled");
    };
  }, []);

  return null;
}
