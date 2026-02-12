/**
 * main.js — Shared logic for VSPD × CERN Open Data site.
 * - Sets active state on nav link for current page (deterministic, no backend).
 */

(function () {
  'use strict';

  var path = window.location.pathname || '';
  var page = path.split('/').pop() || 'index.html';
  if (page === '') page = 'index.html';

  var links = document.querySelectorAll('.site-header .nav-link');
  links.forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();
