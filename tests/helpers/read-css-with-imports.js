'use strict';

const fs = require('fs');
const path = require('path');

function readCssWithImports(filePath, visited = new Set()) {
  const normalized = path.resolve(filePath);
  if (visited.has(normalized)) return '';
  visited.add(normalized);

  const source = fs.readFileSync(normalized, 'utf8');
  let combined = source;
  const imports = Array.from(source.matchAll(/@import\s+url\('([^']+)'\);/g)).map((m) => m[1]);

  for (const relImportPath of imports) {
    const absImportPath = path.resolve(path.dirname(normalized), relImportPath);
    combined += '\n' + readCssWithImports(absImportPath, visited);
  }

  return combined;
}

module.exports = {
  readCssWithImports,
};
