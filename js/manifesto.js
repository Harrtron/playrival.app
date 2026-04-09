(function () {
  'use strict';

  var article = document.querySelector('.manifesto');
  if (!article) return;

  // Gate all JS-driven animations behind this class (progressive enhancement)
  article.classList.add('manifesto--animated');

  // ── Generic fade-up reveals ─────────────────────────────
  var revealEls = article.querySelectorAll('[data-m-reveal]');
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  revealEls.forEach(function (el) { revealObs.observe(el); });

  // ── Divider line grow ───────────────────────────────────
  var dividers = article.querySelectorAll('.manifesto__divider');
  var dividerObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      dividerObs.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  dividers.forEach(function (el) { dividerObs.observe(el); });

  // ── Mission slam ────────────────────────────────────────
  var mission = article.querySelector('.manifesto__mission');
  if (mission) {
    var missionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        missionObs.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    missionObs.observe(mission);
  }

  // ── Stats stagger ───────────────────────────────────────
  var statsBox = article.querySelector('.manifesto__stats');
  if (statsBox) {
    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('manifesto__stats--visible');
        statsObs.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    statsObs.observe(statsBox);
  }

  // ── Counter animation ───────────────────────────────────
  function runCounter(el) {
    var target = parseInt(el.dataset.countTarget, 10);
    var suffix = el.dataset.countSuffix || '';
    var duration = 1400;
    var start = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function tick(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(ease(progress) * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.add('count-done');
      }
    }
    requestAnimationFrame(tick);
  }

  var counters = article.querySelectorAll('[data-count-target]');
  if (counters.length) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        counterObs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObs.observe(el); });
  }
}());
