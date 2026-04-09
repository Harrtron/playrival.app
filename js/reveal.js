(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nav = document.querySelector(".site-nav");
  const hero = document.querySelector(".hero");
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));

  const syncNav = () => {
    if (!nav || !hero) {
      return;
    }

    const heroBottom = hero.getBoundingClientRect().bottom;
    nav.classList.toggle("site-nav--scrolled", heroBottom <= 96);
  };

  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });
  window.addEventListener("resize", syncNav);

  if (prefersReducedMotion.matches || revealEls.length === 0) {
    revealEls.forEach((el) => {
      el.classList.add("is-visible");
      el.style.removeProperty("--reveal-delay");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const { target } = entry;
        const delay = Number.parseInt(target.dataset.revealDelay || "0", 10);
        target.style.setProperty("--reveal-delay", `${Math.max(delay, 0)}ms`);
        target.classList.add("is-visible");
        observer.unobserve(target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealEls.forEach((el) => observer.observe(el));
})();
