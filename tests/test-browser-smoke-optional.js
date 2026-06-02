// Optional Playwright smoke tests for browser rendering; auto-skips when Playwright is not installed.
'use strict';

const assert = require('assert');
const path = require('path');

async function run() {
  if (process.env.CI === 'true') {
    console.log('SKIP: tests/test-browser-smoke-optional.js (skipped in CI)');
    return;
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (_err) {
    console.log('SKIP: tests/test-browser-smoke-optional.js (install playwright to enable)');
    return;
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const ROOT = path.join(__dirname, '..');

  function toFile(relPath) {
    return 'file://' + path.join(ROOT, relPath);
  }

  async function checkSurveyAnswers(start, end) {
    for (let idx = start; idx <= end; idx += 1) {
      await page.check(`input[name="q${idx}"][value="3"]`);
    }
  }

  await page.goto(toFile('index.html'));
  await page.waitForSelector('main#main-content');
  const hasHomeNav = await page.locator('.main-nav .nav-link').first().count();
  assert(hasHomeNav > 0, 'Home page should render global nav links');

  await page.goto(toFile(path.join('modules', 'garbage-can', 'explorer', 'index.html')));
  await page.waitForSelector('#panel-a-load');
  await page.waitForSelector('#panel-a-inflow');
  await page.waitForSelector('#panel-a-decision');
  await page.waitForSelector('#panel-a-access');

  await page.goto(toFile(path.join('modules', 'garbage-can', 'assess', 'index.html')));
  await page.waitForSelector('#questionnaire');
  await checkSurveyAnswers(0, 4);
  await page.click('#q-continue-1');
  await page.waitForSelector('#q-group-2');
  await checkSurveyAnswers(5, 7);
  await page.click('#q-continue-2');
  await page.waitForSelector('#q-group-3');
  await checkSurveyAnswers(8, 11);
  await page.click('#submit-btn');
  await page.waitForSelector('#run-sim-btn');

  await page.goto(toFile(path.join('modules', 'garbage-can', 'can-explainer', 'index.html')));
  await page.waitForSelector('#can-explainer-svg');
  await page.waitForSelector('#can-stop-btn');
  await page.waitForSelector('#can-play-btn');
  await page.waitForSelector('#can-reset-btn');

  await browser.close();
  console.log('PASS: tests/test-browser-smoke-optional.js');
}

run().catch((err) => {
  console.error('FAIL: tests/test-browser-smoke-optional.js');
  console.error(err);
  process.exit(1);
});
