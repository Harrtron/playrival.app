(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReducedMotion.matches) {
    return;
  }

  const sprites = document.querySelectorAll("[data-frame-prefix]");

  sprites.forEach((sprite) => {
    const prefix = sprite.dataset.framePrefix;
    const extension = sprite.dataset.frameExtension || ".png";
    const totalFrames = Number.parseInt(sprite.dataset.frameCount || "0", 10);
    const frameDelay = Number.parseInt(sprite.dataset.frameDelay || "120", 10);

    if (!prefix || totalFrames < 2) {
      return;
    }

    const frames = Array.from({ length: totalFrames }, (_, index) => {
      const frameNumber = String(index + 1).padStart(2, "0");
      return `${prefix}${frameNumber}${extension}`;
    });

    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    let frameIndex = 0;
    let timerId = null;

    const renderFrame = () => {
      sprite.src = frames[frameIndex];
      frameIndex = (frameIndex + 1) % frames.length;
    };

    const start = () => {
      if (timerId !== null) {
        return;
      }

      timerId = window.setInterval(renderFrame, frameDelay);
    };

    const stop = () => {
      if (timerId === null) {
        return;
      }

      window.clearInterval(timerId);
      timerId = null;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sprite);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else if (sprite.getBoundingClientRect().top < window.innerHeight && sprite.getBoundingClientRect().bottom > 0) {
        start();
      }
    });
  });
})();
