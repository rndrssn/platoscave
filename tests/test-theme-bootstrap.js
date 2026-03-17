'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'theme-bootstrap.js'), 'utf8');

function runWithTheme(themeValue) {
  let setCall = null;
  let removed = false;

  const documentElement = {
    setAttribute(name, value) {
      setCall = { name, value };
    },
    removeAttribute(name) {
      if (name === 'data-theme') removed = true;
    },
  };

  const context = {
    window: { PLATOSCAVE_THEME: themeValue },
    document: { documentElement },
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return { setCall, removed };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testDefaultCasesClearTheme() {
  const cases = ['', 'default', 'base', '   default   ', '   '];
  for (const theme of cases) {
    const result = runWithTheme(theme);
    assert(result.removed, `Expected removeAttribute for theme "${theme}"`);
    assert(result.setCall === null, `Did not expect setAttribute for theme "${theme}"`);
  }
}

function testCustomThemeSetsDataTheme() {
  const result = runWithTheme('decision-collision-cold');
  assert(!result.removed, 'Did not expect removeAttribute for custom theme');
  assert(result.setCall !== null, 'Expected setAttribute for custom theme');
  assert(result.setCall.name === 'data-theme', 'Expected data-theme attribute');
  assert(result.setCall.value === 'decision-collision-cold', 'Expected configured theme value');
}

function testCustomThemeIsTrimmed() {
  const result = runWithTheme('  urban-grid2  ');
  assert(result.setCall !== null, 'Expected setAttribute for trimmed custom theme');
  assert(result.setCall.value === 'urban-grid2', 'Expected trimmed theme value');
}

function run() {
  testDefaultCasesClearTheme();
  testCustomThemeSetsDataTheme();
  testCustomThemeIsTrimmed();
  console.log('PASS: tests/test-theme-bootstrap.js');
}

run();
