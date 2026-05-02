'use strict';

(function initModuleRouteData(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.PlatoscaveModuleRouteData = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildModuleRouteData() {
  var moduleRoutes = [
    {
      title: 'Emergence',
      slug: 'emergence',
      path: 'emergence/',
      status: '',
      descriptor: 'Local rules yielding global patterns.',
      sections: "01 Conway's Game of Life / 02 GANTT meets Game of Life"
    },
    {
      title: 'Organisational Diagnostic',
      slug: 'maturity',
      path: 'maturity/',
      status: 'coming-soon',
      descriptor: 'A situation check for predictive vs adaptive contexts.',
      sections: 'Planned diagnostic'
    },
    {
      title: 'The Garbage Can Model',
      slug: 'garbage-can',
      path: 'garbage-can/',
      status: '',
      descriptor: 'Organisational choice under ambiguity.',
      sections: 'Organised Anarchy / Taxonomy / Concept animation / Explore / Assess'
    },
    {
      title: 'Learning & Feedback',
      slug: 'learning-feedback',
      path: 'learning-feedback/',
      status: '',
      descriptor: 'Where traditional control and adaptive learning coexist.',
      sections: 'Epistemic Bets / Feedback Debt'
    },
    {
      title: 'Flow & Queuing',
      slug: 'flow-queuing',
      path: 'flow-queuing/',
      status: '',
      descriptor: 'Why high utilization creates queues, delay, and amplified variability.',
      sections: 'Flow and Waiting / Taxonomy / Explore / Concept Map / Appendix'
    },
    {
      title: 'Ambiguity to Clarity',
      slug: 'ambiguity-clarity',
      path: 'ambiguity-clarity/',
      status: '',
      descriptor: 'How open work becomes clear enough to test and build.',
      sections: 'Ambiguity to Clarity / Clarity Map'
    }
  ];

  function normalizeModuleStatus(status) {
    return status === 'coming-soon' ? 'coming-soon' : '';
  }

  function cloneRoute(route) {
    return {
      title: (route && route.title) || '',
      slug: (route && route.slug) || '',
      path: (route && route.path) || '',
      status: normalizeModuleStatus(route && route.status),
      descriptor: (route && route.descriptor) || '',
      sections: (route && route.sections) || ''
    };
  }

  function getModuleRoutes() {
    return moduleRoutes.map(cloneRoute);
  }

  function getModuleMenuItems() {
    return getModuleRoutes().map(function(route) {
      return {
        title: route.title,
        slug: route.slug,
        path: route.path,
        status: route.status
      };
    });
  }

  return {
    moduleRoutes: getModuleRoutes(),
    getModuleRoutes: getModuleRoutes,
    getModuleMenuItems: getModuleMenuItems
  };
}));
