'use strict';

const fs = require('fs');
const path = require('path');

const themesPath = path.join(__dirname, '..', 'css', 'themes.css');
const themeConfigPath = path.join(__dirname, '..', 'theme.config.js');
const themeBootstrapPath = path.join(__dirname, '..', 'js', 'theme-bootstrap.js');

function loadCssWithImports(entryPath, seen) {
  const visited = seen || new Set();
  const absEntry = path.resolve(entryPath);
  if (visited.has(absEntry)) return '';
  visited.add(absEntry);

  const css = fs.readFileSync(absEntry, 'utf8');
  const importRe = /@import\s+url\(\s*['"]([^'"]+)['"]\s*\)\s*;/g;
  let out = css;
  let match;

  while ((match = importRe.exec(css)) !== null) {
    const rel = match[1];
    const childPath = path.resolve(path.dirname(absEntry), rel);
    if (!fs.existsSync(childPath)) {
      throw new Error('Missing imported CSS file: ' + childPath);
    }
    out += '\n' + loadCssWithImports(childPath, visited);
  }

  return out;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getDeclaredThemeNames(cssSource) {
  const re = /\[data-theme='([^']+)'\]/g;
  const names = new Set();
  let match;
  while ((match = re.exec(cssSource)) !== null) {
    names.add(match[1]);
  }
  return names;
}

function parseThemeConfigAssignments(configSource) {
  const re = /^\s*(\/\/\s*)?window\.PLATOSCAVE_THEME\s*=\s*'([^']*)'\s*;/gm;
  const entries = [];
  let match;
  while ((match = re.exec(configSource)) !== null) {
    entries.push({
      value: match[2],
      commented: !!match[1],
    });
  }
  return entries;
}

function parseBootstrapAllowlist(bootstrapSource) {
  const blockMatch = bootstrapSource.match(/var\s+AVAILABLE_THEMES\s*=\s*\[([\s\S]*?)\]\s*;/);
  assert(blockMatch, 'Could not find AVAILABLE_THEMES array in js/theme-bootstrap.js');

  const names = [];
  const entryRe = /'([^']+)'/g;
  let match;
  while ((match = entryRe.exec(blockMatch[1])) !== null) {
    names.push(match[1]);
  }
  return new Set(names);
}

function testThemeConfigAndThemeCssStayInSync() {
  const cssSource = loadCssWithImports(themesPath);
  const configSource = fs.readFileSync(themeConfigPath, 'utf8');
  const bootstrapSource = fs.readFileSync(themeBootstrapPath, 'utf8');

  const declaredThemes = getDeclaredThemeNames(cssSource);
  const configEntries = parseThemeConfigAssignments(configSource);
  const bootstrapAllowlist = parseBootstrapAllowlist(bootstrapSource);
  const specialValues = new Set(['', 'default', 'base']);

  assert(declaredThemes.size > 0, 'No [data-theme=...] names found in imported theme CSS');
  assert(configEntries.length > 0, 'No window.PLATOSCAVE_THEME assignments found in theme.config.js');

  const activeEntries = configEntries.filter((entry) => !entry.commented);
  assert(activeEntries.length === 1, 'theme.config.js must contain exactly one active PLATOSCAVE_THEME assignment');

  const activeValue = activeEntries[0].value;
  assert(
    specialValues.has(activeValue) || declaredThemes.has(activeValue),
    'Active theme in theme.config.js is not declared in CSS themes: ' + activeValue
  );

  const configuredCustom = new Set(
    configEntries
      .map((entry) => entry.value)
      .filter((value) => !specialValues.has(value))
  );

  for (const configuredName of configuredCustom) {
    assert(
      declaredThemes.has(configuredName),
      'theme.config.js lists unknown theme name: ' + configuredName
    );
  }

  for (const declaredName of declaredThemes) {
    assert(
      configuredCustom.has(declaredName),
      'theme.config.js is missing declared theme name: ' + declaredName
    );
    assert(
      bootstrapAllowlist.has(declaredName),
      'js/theme-bootstrap.js allowlist is missing declared theme name: ' + declaredName
    );
  }

  for (const allowedName of bootstrapAllowlist) {
    assert(
      declaredThemes.has(allowedName),
      'js/theme-bootstrap.js allowlist includes unknown theme name: ' + allowedName
    );
  }
}

function run() {
  testThemeConfigAndThemeCssStayInSync();
  console.log('PASS: tests/test-theme-config-contract.js');
}

run();
