(() => {
  'use strict';

  const galaxy = document.querySelector('[data-rival-galaxy]');
  if (!galaxy) return;

  const nodes = Array.from(galaxy.querySelectorAll('[data-galaxy-node]'));
  const dots = Array.from(galaxy.querySelectorAll('[data-galaxy-dot]'));
  const prevBtn = galaxy.querySelector('[data-galaxy-prev]');
  const nextBtn = galaxy.querySelector('[data-galaxy-next]');
  const copyEyebrow = galaxy.querySelector('[data-galaxy-copy-eyebrow]');
  const copyTitle = galaxy.querySelector('[data-galaxy-copy-title]');
  const copyTease = galaxy.querySelector('[data-galaxy-copy-tease]');

  if (nodes.length === 0) return;

  const total = nodes.length;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeIndex = 0;
  let timer = null;

  const getOrbitSize = () => {
    const width = galaxy.getBoundingClientRect().width || window.innerWidth;
    return {
      x: Math.min(Math.max(width * 0.31, 210), 410),
      y: Math.min(Math.max(width * 0.105, 72), 140),
    };
  };

  const getNodeState = (index) => {
    if (index === activeIndex) {
      return { x: 0, y: 0, scale: 1, opacity: 1, z: 50, blur: 0, rotate: 0 };
    }

    const { x: orbitX, y: orbitY } = getOrbitSize();
    const relative = (index - activeIndex + total) % total;
    const angleStep = (Math.PI * 2) / total;
    const angle = (relative * angleStep) - Math.PI / 2;
    const frontDepth = (Math.sin(angle) + 1) / 2;
    const sideDistance = Math.abs(Math.cos(angle));

    return {
      x: Math.cos(angle) * orbitX,
      y: Math.sin(angle) * orbitY + 58,
      scale: 0.32 + frontDepth * 0.28 + sideDistance * 0.05,
      opacity: 0.18 + frontDepth * 0.42,
      z: Math.round(10 + frontDepth * 28),
      blur: 1.6 - frontDepth * 1.15,
      rotate: Math.cos(angle) * -10,
    };
  };

  const updateCopy = () => {
    const activeNode = nodes[activeIndex];
    if (!activeNode || !copyEyebrow || !copyTitle || !copyTease) return;

    copyEyebrow.textContent = activeNode.dataset.galaxyLabel || activeNode.getAttribute('aria-label') || '';
    copyTitle.textContent = activeNode.dataset.galaxyTitle || '';
    copyTease.textContent = activeNode.dataset.galaxyTease || '';
  };

  const render = (instant) => {
    nodes.forEach((node, i) => {
      const p = getNodeState(i);
      const isActive = i === activeIndex;

      if (instant) {
        node.style.transition = 'none';
        // Re-enable transitions next frame
        requestAnimationFrame(() => { node.style.transition = ''; });
      }

      node.style.setProperty('--gx', p.x + 'px');
      node.style.setProperty('--gy', p.y + 'px');
      node.style.setProperty('--gs', p.scale);
      node.style.setProperty('--go', p.opacity);
      node.style.setProperty('--gz', p.z);
      node.style.setProperty('--gblur', p.blur + 'px');
      node.style.setProperty('--grotate', p.rotate + 'deg');
      node.classList.toggle('galaxy-node--active', isActive);
      node.setAttribute('aria-hidden', !isActive ? 'true' : 'false');
      node.setAttribute('tabindex', !isActive ? '-1' : '0');
    });

    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === activeIndex);
      d.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });

    updateCopy();
  };

  const goTo = (index) => {
    activeIndex = ((index % total) + total) % total;
    render();
  };

  const advance = (dir) => goTo(activeIndex + dir);

  const startTimer = () => {
    if (prefersReducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => advance(1), 5000);
  };

  const resetTimer = () => { clearInterval(timer); startTimer(); };

  // Click an inactive node to bring it forward
  nodes.forEach((node, i) => {
    node.addEventListener('click', () => {
      if (i !== activeIndex) { goTo(i); resetTimer(); }
    });
    node.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && i !== activeIndex) {
        e.preventDefault();
        goTo(i);
        resetTimer();
      }
    });
  });

  // Dot nav
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
  });

  // Prev / next
  if (prevBtn) prevBtn.addEventListener('click', () => { advance(-1); resetTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { advance(1); resetTimer(); });

  // Arrow keys on the galaxy container
  galaxy.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { advance(1); resetTimer(); }
    if (e.key === 'ArrowLeft')  { advance(-1); resetTimer(); }
  });

  // Pause on hover / focus
  galaxy.addEventListener('mouseenter', () => clearInterval(timer));
  galaxy.addEventListener('focusin',    () => clearInterval(timer));
  galaxy.addEventListener('mouseleave', startTimer);
  galaxy.addEventListener('focusout', (e) => {
    if (!galaxy.contains(e.relatedTarget)) startTimer();
  });

  // Touch swipe
  let touchStartX = 0;
  galaxy.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  galaxy.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); resetTimer(); }
  }, { passive: true });

  window.addEventListener('resize', () => render(true));

  render(true);
  startTimer();
})();
