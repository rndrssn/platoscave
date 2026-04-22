'use strict';

const fs = require('fs');
const path = require('path');

const SUBPAGE_PATHS = [
  'modules/emergence-primer/ganttgol/index.html',
  'modules/garbage-can/taxonomy/index.html',
  'modules/garbage-can/can-explainer/index.html',
  'modules/garbage-can/explorer/index.html',
  'modules/garbage-can/assess/index.html',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  SUBPAGE_PATHS.forEach((relPath) => {
    const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    const backLinkMatch = source.match(
      /<a[^>]*class="module-back-link"[^>]*href="\.\.\/\.\.\/"[^>]*aria-label="Back to Modules"[^>]*>\s*<\/a>/i
    );
    assert(
      Boolean(backLinkMatch),
      relPath + ' is missing the required module back-link contract'
    );

    assert(
      !/<a[^>]*class="module-back-link"[^>]*>\s*Modules\s*<\/a>/i.test(source),
      relPath + ' back-link should be arrow-only without visible Modules text'
    );

    const backIndex = source.indexOf('<a class="module-back-link"');
    const contextIndex = source.indexOf('class="module-header-number module-context-number module-context-link"');
    assert(
      backIndex !== -1 && contextIndex !== -1 && backIndex < contextIndex,
      relPath + ' back-link should render above the module context line'
    );
  });

  console.log('PASS: tests/test-module-subpage-back-link-contract.js');
}

run();
