/**
 * Mobile: hamburger toggles left drawer; overlay and Escape close.
 * Desktop: sidebar stays fixed on the right; toggle is hidden.
 */
(function () {
  function init() {
    var toggle = document.getElementById('nav-mobile-toggle');
    var nav = document.getElementById('vspd-sidebar-nav');
    var overlay = document.getElementById('nav-overlay');
    if (!toggle || !nav || !overlay) return;

    var mqDesktop = window.matchMedia('(min-width: 1025px)');

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      overlay.classList.toggle('is-visible', open);
      document.body.classList.toggle('nav-mobile-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    overlay.addEventListener('click', function () {
      setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width: 1024px)').matches) {
        setOpen(false);
      }
    });
    window.addEventListener('resize', function () {
      if (mqDesktop.matches) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
