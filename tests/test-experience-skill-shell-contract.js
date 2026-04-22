'use strict';

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function run() {
  const graphPath = 'modules/experience-skill-graph/index.html';
  const cvPath = 'modules/experience-skill-graph/cv/index.html';
  const graph = read(graphPath);
  const cv = read(cvPath);

  [graphPath, cvPath].forEach((relPath, index) => {
    const source = index === 0 ? graph : cv;
    assert(/class="experience-skill-masthead"/.test(source), relPath + ' missing .experience-skill-masthead');
    assert(/class="experience-skill-switch"/.test(source), relPath + ' missing .experience-skill-switch');
    assert(!/data-exp-toggle-style-btn=/.test(source), relPath + ' should not include temporary style-lab buttons');
    assert(!/experience-skill-toggle-style-preview\.js/.test(source), relPath + ' should not include temporary style-preview script');
    assert(!/class="experience-skill-back"/.test(source), relPath + ' should not include .experience-skill-back');
    assert(!/class="experience-skill-kicker"/.test(source), relPath + ' should not include .experience-skill-kicker');
    assert(!/class="module-back-link"/.test(source), relPath + ' should not use .module-back-link');
    assert(!/class="module-sub-nav"/.test(source), relPath + ' should not use .module-sub-nav');
    assert(!/class="module-context-link"/.test(source), relPath + ' should not use .module-context-link');
  });

  assert(
    /class="experience-skill-switch-link experience-skill-switch-link--active" href="\.\/" aria-current="page">Skills Graph<\/a>/.test(graph),
    graphPath + ' must mark Skills Graph as the active switch item'
  );
  assert(
    /class="experience-skill-switch-link" href="cv\/">CV<\/a>/.test(graph),
    graphPath + ' must link to CV from the switch'
  );

  assert(
    /class="experience-skill-switch-link" href="\.\.\/">Skills Graph<\/a>/.test(cv),
    cvPath + ' must link back to Skills Graph from the switch'
  );
  assert(
    /class="experience-skill-switch-link experience-skill-switch-link--active" href="\.\/" aria-current="page">CV<\/a>/.test(cv),
    cvPath + ' must mark CV as the active switch item'
  );

  console.log('PASS: tests/test-experience-skill-shell-contract.js');
}

run();
