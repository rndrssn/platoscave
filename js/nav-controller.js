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
      { title: 'Emergence Primer', slug: 'emergence-primer', path: 'emergence-primer/' },
      { title: 'Organisational Diagnostic', slug: 'maturity', path: 'maturity/', status: 'coming-soon' },
      { title: 'The Garbage Can Model', slug: 'garbage-can', path: 'garbage-can/' },
      { title: 'Management Mix', slug: 'mix-mapper', path: 'mix-mapper/' },
      { title: 'The Descent', slug: 'the-descent', path: 'the-descent/' }
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
      return status === 'coming-soon' ? 'coming-soon' : '';
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

    function currentPathname() {
      if (!window || !window.location || typeof window.location.pathname !== 'string') return '';
      return normalizePathname(window.location.pathname);
    }

    function shouldAutoExpandModulesForViewport() {
      return false;
    }

    function isNotesPath(pathname) {
      return pathname === '/notes/' || pathname.indexOf('/notes/') === 0;
    }

    function isCvPath(pathname) {
      return pathname === '/cv/' || pathname.indexOf('/modules/experience-skill-graph/cv/') === 0;
    }

    function isExperiencePath(pathname) {
      if (pathname === '/skills/') return true;
      if (pathname.indexOf('/modules/experience-skill-graph/') !== 0) return false;
      return pathname.indexOf('/modules/experience-skill-graph/cv/') !== 0;
    }

    function isModulesPath(pathname) {
      if (pathname === '/modules/' || pathname === '/modules') return true;
      if (pathname.indexOf('/modules/') !== 0) return false;
      return pathname.indexOf('/modules/experience-skill-graph/') !== 0;
    }

    function createPrimaryNavLink(config) {
      var node = document.createElement('a');
      node.className = 'nav-link nav-link--editorial' + (config.active ? ' nav-link--active' : '');
      node.href = config.href;
      node.textContent = config.label;
      if (config.active) node.setAttribute('aria-current', 'page');
      if (config.role) node.setAttribute('data-nav-role', config.role);
      return node;
    }

    function normalizePrimaryNavLinks(rootPrefix) {
      if (
        !navLinks ||
        typeof navLinks.textContent !== 'string' ||
        typeof navLinks.appendChild !== 'function' ||
        !document ||
        typeof document.createElement !== 'function'
      ) {
        return;
      }

      var pathname = currentPathname();
      var notesHref = joinHref(rootPrefix, 'notes/');
      var cvHref = joinHref(rootPrefix, 'modules/experience-skill-graph/cv/');
      var experienceHref = joinHref(rootPrefix, 'modules/experience-skill-graph/');
      var modulesHref = joinHref(rootPrefix, 'modules/');

      navLinks.textContent = '';
      [
        { label: 'Notes', href: notesHref, active: isNotesPath(pathname) },
        { label: 'CV', href: cvHref, active: isCvPath(pathname) },
        { label: 'Experience', href: experienceHref, active: isExperiencePath(pathname) },
        { label: 'Modules', href: modulesHref, active: isModulesPath(pathname), role: 'modules' }
      ].forEach(function (item) {
        navLinks.appendChild(createPrimaryNavLink(item));
      });
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
    var siteHeader = document.querySelector('.site-header');
    var mainNav = document.querySelector('.main-nav');
    var navTitle = document.querySelector('.nav-title');
    var modulesToggleButton = null;
    var modulesHead = null;
    var modulesSubmenu = null;
    var modulesAutoExpand = false;
    var mainNavPinned = false;
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
      modulesToggleButton.setAttribute('title', open ? 'Collapse modules list' : 'Expand modules list');
      if (open) modulesToggleButton.classList.add('is-expanded');
      else modulesToggleButton.classList.remove('is-expanded');
    }

    function positionModulesSubmenu() {
      if (!modulesToggleButton || !modulesSubmenu || !navLinks) return;
      var anchorLeft = modulesToggleButton.offsetLeft + 6;
      if (
        typeof modulesToggleButton.getBoundingClientRect === 'function' &&
        typeof navLinks.getBoundingClientRect === 'function'
      ) {
        var toggleRect = modulesToggleButton.getBoundingClientRect();
        var navRect = navLinks.getBoundingClientRect();
        anchorLeft = (toggleRect.left - navRect.left) + toggleRect.width;
      }
      modulesSubmenu.style.setProperty('--modules-submenu-left', String(anchorLeft) + 'px');
    }

    function getMainNavPinThreshold() {
      if (!navTitle || typeof navTitle.offsetHeight !== 'number') return 0;
      return Math.max(0, navTitle.offsetHeight);
    }

    function updateMainNavPinnedState() {
      if (!mainNav) return;
      var scrollY = 0;
      if (typeof window !== 'undefined') {
        if (typeof window.scrollY === 'number') scrollY = window.scrollY;
        else if (typeof window.pageYOffset === 'number') scrollY = window.pageYOffset;
      }
      var shouldPin = scrollY > getMainNavPinThreshold();
      if (shouldPin === mainNavPinned) return;

      mainNavPinned = shouldPin;
      mainNav.classList.toggle('main-nav--pinned', shouldPin);
      if (siteHeader && siteHeader.classList) {
        siteHeader.classList.toggle('nav-main-pinned', shouldPin);
      }
      positionModulesSubmenu();
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
        var role = (link.getAttribute('data-nav-role') || '').toLowerCase();
        if (role === 'modules') {
          modulesLink = link;
          return;
        }
        var text = (link.textContent || '').trim().toLowerCase();
        var href = (link.getAttribute('href') || '').toLowerCase();
        if (text === 'modules' || href === './') modulesLink = link;
      });

      if (!modulesLink || !modulesLink.parentNode) return;

      var modulesHref = modulesLink.getAttribute('href') || joinHref(rootPrefix, 'modules/');
      modulesAutoExpand = shouldAutoExpandModulesForViewport();

      modulesHead = document.createElement('div');
      modulesHead.className = 'nav-modules-head';

      modulesToggleButton = document.createElement('button');
      modulesToggleButton.type = 'button';
      modulesToggleButton.className = 'nav-link nav-link--editorial nav-modules-toggle nav-modules-toggle--bento';
      modulesToggleButton.title = 'Modules';
      modulesToggleButton.textContent = '';
      var modulesToggleLabel = document.createElement('span');
      modulesToggleLabel.className = 'visually-hidden';
      modulesToggleLabel.textContent = 'Modules';
      modulesToggleButton.appendChild(modulesToggleLabel);
      modulesToggleButton.setAttribute('aria-expanded', modulesAutoExpand ? 'true' : 'false');
      modulesToggleButton.setAttribute('aria-label', modulesAutoExpand ? 'Collapse modules list' : 'Expand modules list');

      modulesSubmenu = document.createElement('div');
      modulesSubmenu.className = 'nav-modules-submenu';
      modulesSubmenu.id = 'primary-nav-modules-submenu';
      modulesSubmenu.hidden = !modulesAutoExpand;
      modulesToggleButton.setAttribute('aria-controls', modulesSubmenu.id);

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
        var label = entry.title;
        var isComingSoon = entry.status === 'coming-soon';
        var node = isComingSoon ? document.createElement('span') : document.createElement('a');
        node.className =
          'nav-sublink' +
          (isActive ? ' nav-sublink--active' : '') +
          (isComingSoon ? ' nav-sublink--coming' : '');
        if (isComingSoon) {
          node.setAttribute('aria-disabled', 'true');
        } else {
          node.href = entry.href;
        }
        node.textContent = label;

        if (isComingSoon) {
          var state = document.createElement('span');
          state.className = 'nav-sublink-state';
          state.textContent = 'Coming soon';
          node.appendChild(document.createTextNode(' '));
          node.appendChild(state);
        }
        return node;
      }

      var entries = getModuleMenuItems()
        .filter(function (item) {
          return item.status !== 'coming-soon';
        })
        .map(function (item) {
          return {
            title: item.title,
            slug: item.slug,
            status: item.status,
            href: item.path ? joinHref(modulesHref, item.path) : modulesHref
          };
        });

      modulesSubmenu.appendChild(
        createSubEntry({ title: 'All modules', slug: '', status: '', href: modulesHref }, isEntryActive(''))
      );
      entries.forEach(function (entry) {
        modulesSubmenu.appendChild(createSubEntry(entry, isEntryActive(entry.slug)));
      });

      modulesHead.appendChild(modulesToggleButton);
      modulesLink.parentNode.replaceChild(modulesHead, modulesLink);
      modulesHead.insertAdjacentElement('afterend', modulesSubmenu);
      positionModulesSubmenu();

      modulesToggleButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setModulesExpanded(modulesSubmenu.hidden);
      });
    }

    var rootPrefix = detectRootPrefix();
    normalizePrimaryNavLinks(rootPrefix);
    initModulesBentoSection(rootPrefix);
    updateMainNavPinnedState();

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
        var nextAutoExpand = shouldAutoExpandModulesForViewport();
        if (nextAutoExpand !== modulesAutoExpand) {
          modulesAutoExpand = nextAutoExpand;
        }
        if (modulesAutoExpand) setModulesExpanded(true);
        updateMainNavPinnedState();
        positionModulesSubmenu();
      });
      window.addEventListener('scroll', updateMainNavPinnedState, { passive: true });
    }

    document.addEventListener('pointerdown', function (event) {
      var target = event.target;
      var isModulesSubmenuOpen = modulesSubmenu && !modulesSubmenu.hidden;
      if (isModulesSubmenuOpen) {
        var inModulesHead = modulesHead && modulesHead.contains(target);
        var inModulesSubmenu = modulesSubmenu && modulesSubmenu.contains(target);
        if (!inModulesHead && !inModulesSubmenu) setModulesExpanded(false);
      }
      if (!isOpen()) return;
      if (navLinks.contains(target) || navToggle.contains(target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (modulesSubmenu && !modulesSubmenu.hidden) setModulesExpanded(false);
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
