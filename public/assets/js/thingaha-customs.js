/* Scroll-to-top button (no jQuery dependency). */
(function () {
  'use strict';

  function init() {
    var button = document.getElementById('scroll-top-button');
    if (!button) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ticking = false;

    function update() {
      button.classList.toggle('is-visible', window.scrollY > 300);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    button.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var top = document.getElementById('top') || document.body;
      if (top.tabIndex < 0) top.setAttribute('tabindex', '-1');
      top.focus({ preventScroll: true });
    });

    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
