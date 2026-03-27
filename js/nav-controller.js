'use strict';

(function initGlobalNavController() {
  if (
    !document ||
    typeof document.addEventListener !== 'function' ||
    typeof document.querySelector !== 'function'
  ) {
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    function ensureFooterActions() {
      var footerText = document.querySelector('footer .footer-text');
      if (!footerText) return;
      if (footerText.querySelector('.footer-socials')) return;

      var aboutNavLink = null;
      var navCandidates = Array.prototype.slice.call(document.querySelectorAll('.main-nav .nav-link[href]'));
      navCandidates.forEach(function (link) {
        if (aboutNavLink) return;
        var text = (link.textContent || '').trim().toLowerCase();
        if (text === 'about' || text === 'home') {
          aboutNavLink = link;
        }
      });
      if (!aboutNavLink && navCandidates.length) aboutNavLink = navCandidates[0];
      var rootPrefix = (aboutNavLink && aboutNavLink.getAttribute('href')) || './';

      var socials = document.createElement('span');
      socials.className = 'footer-socials';
      socials.innerHTML =
        '<a class="contact-social-link contact-social-link--github footer-social-link" href="https://github.com/rndrssn" target="_blank" rel="noopener" aria-label="GitHub profile"><span class="contact-social-icon" aria-hidden="true"></span></a>' +
        '<a class="contact-social-link contact-social-link--linkedin footer-social-link" href="https://linkedin.com/in/robertandersson" target="_blank" rel="noopener" aria-label="LinkedIn profile"><span class="contact-social-icon" aria-hidden="true"></span></a>' +
        '<a class="contact-social-link contact-social-link--cv footer-social-link footer-social-link--cv" href="' + rootPrefix + 'modules/experience-skill-graph/cv/" aria-label="CV">CV</a>';

      footerText.appendChild(document.createTextNode(' \u00B7 '));
      footerText.appendChild(socials);
    }

    ensureFooterActions();

    var navToggle = document.querySelector('.nav-mobile-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (!navToggle || !navLinks) return;

    function isOpen() {
      return navLinks.classList.contains('is-open');
    }

    function setExpanded(open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openMenu() {
      navLinks.classList.add('is-open');
      setExpanded(true);
    }

    function closeMenu() {
      if (!isOpen()) return;
      navLinks.classList.remove('is-open');
      setExpanded(false);
    }

    function toggleMenu() {
      if (isOpen()) closeMenu();
      else openMenu();
    }

    navToggle.addEventListener('click', toggleMenu);

    document.addEventListener('pointerdown', function (event) {
      if (!isOpen()) return;
      var target = event.target;
      if (navLinks.contains(target) || navToggle.contains(target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMenu();
    });

    navLinks.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest('.nav-link')) closeMenu();
    });
  });
})();
