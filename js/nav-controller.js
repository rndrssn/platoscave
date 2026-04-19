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
    var DEFAULT_MODULE_MENU_ITEMS = [
      { number: '00', title: 'Modules Overview', slug: '', path: '', status: 'live' },
      { number: '01', title: 'Emergence Primer', slug: 'emergence-primer', path: 'emergence-primer/', status: 'coming-soon' },
      { number: '02', title: 'Complexity Maturity Diagnostic', slug: 'maturity', path: 'maturity/', status: 'coming-soon' },
      { number: '03', title: 'Garbage Can Model', slug: 'garbage-can', path: 'garbage-can/', status: 'live' },
      { number: '04', title: 'Management Mix', slug: 'mix-mapper', path: 'mix-mapper/', status: 'live' },
      { number: '05', title: 'CV & Skills', slug: 'experience-skill-graph', path: 'experience-skill-graph/', status: 'live' },
      { number: '06', title: 'The Descent', slug: 'the-descent', path: 'the-descent/', status: 'live' }
    ];
    var NAV_SWATCH_ALLOWLIST = [
      'white',
      'oxblood-glass',
      'slate-signal',
      'midnight-ink',
      'rust-ember',
    ];

    function applyConfiguredNavSwatch() {
      var root = document && document.documentElement;
      if (!root || typeof root.setAttribute !== 'function' || typeof root.removeAttribute !== 'function') {
        return;
      }

      var configured = '';
      if (window && typeof window.PLATOSCAVE_NAV_SWATCH !== 'undefined' && window.PLATOSCAVE_NAV_SWATCH !== null) {
        configured = String(window.PLATOSCAVE_NAV_SWATCH).trim();
      }

      if (!configured || configured === 'default' || configured === 'base') {
        root.removeAttribute('data-nav-swatch');
        return;
      }

      if (NAV_SWATCH_ALLOWLIST.indexOf(configured) === -1) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('Unknown PLATOSCAVE_NAV_SWATCH:', configured, '- using default nav swatch');
        }
        root.removeAttribute('data-nav-swatch');
        return;
      }

      root.setAttribute('data-nav-swatch', configured);
    }

    function normalizeModuleStatus(status) {
      return status === 'live' ? 'live' : 'coming-soon';
    }

    function getModuleMenuItems() {
      var fromWindow =
        window &&
        Array.isArray(window.PLATOSCAVE_MODULE_MENU_ITEMS) &&
        window.PLATOSCAVE_MODULE_MENU_ITEMS.length
          ? window.PLATOSCAVE_MODULE_MENU_ITEMS
          : null;
      var source = fromWindow || DEFAULT_MODULE_MENU_ITEMS;
      return source.map(function (item) {
        return {
          number: (item && item.number) || '',
          title: (item && item.title) || '',
          slug: (item && item.slug) || '',
          path: (item && item.path) || '',
          status: normalizeModuleStatus(item && item.status)
        };
      });
    }

    function getNavCandidates() {
      if (typeof document.querySelectorAll !== 'function') return [];
      return Array.prototype.slice.call(document.querySelectorAll('.main-nav .nav-link[href]'));
    }

    function detectRootPrefix() {
      var aboutNavLink = null;
      var navCandidates = getNavCandidates();
      navCandidates.forEach(function (link) {
        if (aboutNavLink) return;
        var text = (link.textContent || '').trim().toLowerCase();
        if (text === 'about' || text === 'home' || text === 'identity') {
          aboutNavLink = link;
        }
      });
      if (!aboutNavLink && navCandidates.length) aboutNavLink = navCandidates[0];
      return (aboutNavLink && aboutNavLink.getAttribute('href')) || './';
    }

    function ensureFooterActions() {
      var footerText = document.querySelector('footer .footer-text');
      if (!footerText) return;
      if (footerText.querySelector('.footer-socials')) return;

      var rootPrefix = detectRootPrefix();

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
    applyConfiguredNavSwatch();

    var navToggle = document.querySelector('.nav-mobile-toggle');
    var navLinks = document.querySelector('.nav-links');
    var modulesToggleButton = null;
    var modulesHead = null;
    var modulesSubmenu = null;
    var modulesAutoExpand = false;
    var prefetchedMenuRoutes = Object.create(null);
    var menuRoutesPrefetchTriggered = false;

    if (!navToggle || !navLinks) return;

    function joinHref(base, tail) {
      var start = base || './';
      if (!tail) return start;
      return start.charAt(start.length - 1) === '/' ? (start + tail) : (start + '/' + tail);
    }

    function normalizePathname(pathname) {
      if (!pathname) return '';
      return pathname
        .replace(/index\.html$/i, '')
        .replace(/\/+$/, '/')
        .toLowerCase();
    }

    function setModulesExpanded(open) {
      if (!modulesToggleButton || !modulesSubmenu) return;
      positionModulesSubmenu();
      modulesSubmenu.hidden = !open;
      modulesToggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      modulesToggleButton.setAttribute('aria-label', open ? 'Collapse modules list' : 'Expand modules list');
      modulesToggleButton.textContent = open ? '-' : '+';
      if (open) modulesToggleButton.classList.add('is-expanded');
      else modulesToggleButton.classList.remove('is-expanded');
    }

    function positionModulesSubmenu() {
      if (!modulesToggleButton || !modulesSubmenu || !navLinks) return;
      var anchorLeft = modulesToggleButton.offsetLeft + 6;
      modulesSubmenu.style.setProperty('--modules-submenu-left', String(anchorLeft) + 'px');
    }

    function initModulesBentoSection(rootPrefix) {
      if (
        typeof navLinks.querySelectorAll !== 'function' ||
        typeof document.createElement !== 'function'
      ) {
        return;
      }

      var candidates = Array.prototype.slice.call(navLinks.querySelectorAll('.nav-link[href]'));
      var modulesLink = null;
      candidates.forEach(function (link) {
        if (modulesLink) return;
        var text = (link.textContent || '').trim().toLowerCase();
        var href = (link.getAttribute('href') || '').toLowerCase();
        if (text === 'modules' || href === './' || href.indexOf('modules/') !== -1) {
          if (text === 'modules' || href.indexOf('modules/') !== -1) {
            modulesLink = link;
          }
        }
      });

      if (!modulesLink || !modulesLink.parentNode) return;

      var modulesHref = modulesLink.getAttribute('href') || joinHref(rootPrefix, 'modules/');
      modulesAutoExpand =
        modulesLink.classList.contains('nav-link--active') ||
        modulesLink.getAttribute('aria-current') === 'page';

      var modulesLabel = (modulesLink.textContent || '').trim() || 'Modules';
      var modulesLinkClass = (modulesLink.className || 'nav-link').trim();
      if (!modulesLinkClass) modulesLinkClass = 'nav-link';
      var modulesAriaCurrent = modulesLink.getAttribute('aria-current');

      modulesHead = document.createElement('div');
      modulesHead.className = 'nav-modules-head';

      modulesToggleButton = document.createElement('button');
      modulesToggleButton.type = 'button';
      modulesToggleButton.className = 'nav-modules-toggle';
      modulesToggleButton.textContent = '+';
      modulesToggleButton.setAttribute('aria-expanded', modulesAutoExpand ? 'true' : 'false');
      modulesToggleButton.setAttribute('aria-label', modulesAutoExpand ? 'Collapse modules list' : 'Expand modules list');

      modulesSubmenu = document.createElement('div');
      modulesSubmenu.className = 'nav-modules-submenu';
      modulesSubmenu.id = 'primary-nav-modules-submenu';
      modulesSubmenu.hidden = !modulesAutoExpand;
      modulesToggleButton.setAttribute('aria-controls', modulesSubmenu.id);

      var modulesLandingLink = document.createElement('a');
      modulesLandingLink.className = modulesLinkClass + ' nav-modules-link';
      modulesLandingLink.href = modulesHref;
      modulesLandingLink.textContent = modulesLabel;
      if (modulesAriaCurrent) modulesLandingLink.setAttribute('aria-current', modulesAriaCurrent);

      var currentPath = '';
      if (window && window.location && typeof window.location.pathname === 'string') {
        currentPath = normalizePathname(window.location.pathname);
      }

      function isEntryActive(slug) {
        if (!currentPath) return false;
        if (!slug) {
          return /\/modules\/?$/.test(currentPath);
        }
        return currentPath.indexOf('/modules/' + slug + '/') !== -1;
      }

      function createSubEntry(entry, isActive) {
        var label = (entry.number ? entry.number + ' ' : '') + entry.title;
        var isLive = entry.status === 'live';
        var node = isLive ? document.createElement('a') : document.createElement('span');
        node.className =
          'nav-sublink' +
          (isActive ? ' nav-sublink--active' : '') +
          (isLive ? '' : ' nav-sublink--coming');
        if (isLive) {
          node.href = entry.href;
        } else {
          node.setAttribute('aria-disabled', 'true');
        }
        node.textContent = label;
        if (!isLive) {
          var state = document.createElement('span');
          state.className = 'nav-sublink-state';
          state.textContent = 'Coming soon';
          node.appendChild(document.createTextNode(' '));
          node.appendChild(state);
        }
        return node;
      }

      var entries = getModuleMenuItems().map(function (item) {
        return {
          number: item.number,
          title: item.title,
          slug: item.slug,
          status: item.status,
          href: item.path ? joinHref(modulesHref, item.path) : modulesHref
        };
      });

      entries.forEach(function (entry) {
        modulesSubmenu.appendChild(createSubEntry(entry, isEntryActive(entry.slug)));
      });

      modulesHead.appendChild(modulesToggleButton);
      modulesHead.appendChild(modulesLandingLink);
      modulesLink.parentNode.replaceChild(modulesHead, modulesLink);
      modulesHead.insertAdjacentElement('afterend', modulesSubmenu);
      positionModulesSubmenu();

      modulesToggleButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setModulesExpanded(modulesSubmenu.hidden);
      });
    }

    initModulesBentoSection(detectRootPrefix());

    function isOpen() {
      return navLinks.classList.contains('is-open');
    }

    function setExpanded(open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openMenu() {
      navLinks.classList.add('is-open');
      setExpanded(true);
      positionModulesSubmenu();
      prefetchMenuRoutes();
      if (modulesAutoExpand) setModulesExpanded(true);
    }

    function closeMenu() {
      if (!isOpen()) return;
      navLinks.classList.remove('is-open');
      setExpanded(false);
      if (!modulesAutoExpand) setModulesExpanded(false);
    }

    function toggleMenu() {
      if (isOpen()) closeMenu();
      else openMenu();
    }

    function prefetchHref(href) {
      if (!href || !document || !document.head || typeof document.createElement !== 'function') return;
      try {
        var resolved = new URL(href, window && window.location ? window.location.href : undefined);
        if (!resolved || !window || !window.location || resolved.origin !== window.location.origin) return;
        var key = resolved.href;
        if (prefetchedMenuRoutes[key]) return;
        var link = document.createElement('link');
        link.setAttribute('rel', 'prefetch');
        link.setAttribute('as', 'document');
        link.setAttribute('href', key);
        document.head.appendChild(link);
        prefetchedMenuRoutes[key] = true;
      } catch (_err) {
        // Ignore prefetch failures in unsupported contexts.
      }
    }

    function prefetchMenuRoutes() {
      if (menuRoutesPrefetchTriggered) return;
      if (!navLinks || typeof navLinks.querySelectorAll !== 'function') return;
      menuRoutesPrefetchTriggered = true;
      var menuAnchors = Array.prototype.slice.call(navLinks.querySelectorAll('a[href]'));
      menuAnchors.forEach(function (anchor) {
        var href = anchor.getAttribute('href');
        if (!href) return;
        prefetchHref(href);
      });
    }

    navToggle.addEventListener('click', toggleMenu);

    if (window && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', function () {
        positionModulesSubmenu();
      });
    }

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
      if (target.closest('.nav-modules-toggle')) return;
      if (target.closest('.nav-link') || target.closest('.nav-sublink')) closeMenu();
    });
  });
})();
