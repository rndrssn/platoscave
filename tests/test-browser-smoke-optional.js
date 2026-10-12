// Optional Playwright smoke tests for browser rendering; auto-skips when Playwright is not installed.
'use strict';

const assert = require('assert');
const path = require('path');
const os = require('os');

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
  assert.strictEqual(await page.locator('.nav-explore-label').textContent(), 'Explore');
  const aboutHref = await page.locator('.nav-links > a').filter({ hasText: 'About' }).getAttribute('href');
  assert.strictEqual(aboutHref, './skills/', 'About must retain the existing experience URL');
  for (const [label, collection] of [['Notes', 'notes'], ['Articles', 'articles']]) {
    assert.strictEqual(await page.locator('.nav-links > a').filter({ hasText: label }).getAttribute('href'), './' + collection + '/');
  }
  await page.goto(toFile('notes/index.html'));
  assert.strictEqual(await page.locator('.nav-links > a').filter({ hasText: 'Notes' }).getAttribute('href'), '../notes/');
  assert.strictEqual(await page.locator('.nav-links > a').filter({ hasText: 'About' }).getAttribute('href'), '../skills/');


  await page.goto(toFile(path.join('modules', 'garbage-can', 'explorer', 'index.html')));
  await page.selectOption('#panel-a-load', 'light');
  await page.selectOption('#panel-a-inflow', 'moderate');
  await page.selectOption('#panel-a-decision', 'unsegmented');
  await page.selectOption('#panel-a-access', 'unsegmented');
  await page.click('#run-sim-btn');
  await page.waitForSelector('#explorer-playback:visible');
  assert(await page.isVisible('#replay-btn'), 'replay must be available during playback');
  assert(await page.isVisible('#generate-run-btn'), 'generation must be available during playback');
  await page.click('#explorer-pause');
  assert.strictEqual(await page.textContent('#explorer-pause'), 'Resume');
  const toolbar = page.locator('#explorer-playback');
  const mobileBounds = await toolbar.boundingBox();
  assert(mobileBounds.width <= 390, 'mobile toolbar must fit the viewport');
  await toolbar.screenshot({ path: path.join(os.tmpdir(), 'gc-explorer-toolbar-mobile.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
  const trackingBounds = await page.locator('#explorer-track').boundingBox();
  const choiceTrackingBounds = await page.locator('#explorer-track-choice').boundingBox();
  assert(Math.abs(trackingBounds.y - choiceTrackingBounds.y) < 3, 'tracking selectors must align on one row');
  await toolbar.screenshot({ path: path.join(os.tmpdir(), 'gc-explorer-toolbar-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  const pausedCaption = await page.textContent('#explorer-stage-note');
  await page.waitForTimeout(2600);
  assert.strictEqual(await page.textContent('#explorer-stage-note'), pausedCaption, 'pause must prevent advancing');
  const eventBounds = await page.locator('#viz-event-ticker').boundingBox();
  const canvasBounds = await page.locator('#viz-svg').boundingBox();
  assert(eventBounds.y + eventBounds.height <= canvasBounds.y, 'event caption must sit above the animation');
  assert.strictEqual(await page.locator('#viz-svg .gc-viz__top-legend').count(), 0, 'explorer must have only one caption location');
  await page.selectOption('#explorer-track', '0');
  assert((await page.textContent('#explorer-tracking')).startsWith('P1:'), 'selected problem must have a stable identity');
  await page.click('[data-explorer-focus="choices"]');
  assert.strictEqual(await page.getAttribute('#viz-svg', 'data-focus'), 'choices');
  await page.locator('#viz-svg circle.choice').first().click();
  assert.strictEqual(await page.inputValue('#explorer-track-choice'), '0', 'clicking an opportunity centre must select it');
  assert.strictEqual(await page.inputValue('#explorer-track'), '', 'choice tracking must clear problem tracking');
  assert((await page.textContent('#explorer-tracking')).startsWith('CO1:'));
  await page.selectOption('#explorer-track-choice', '');
  await page.click('[data-explorer-focus="overview"]');
  await page.click('#explorer-step');
  assert.strictEqual(await page.getAttribute('#viz-svg', 'data-stage'), 'arrival');
  assert.strictEqual(await page.getAttribute('#viz-svg', 'data-focus'), 'problems');
  await page.click('#explorer-step');
  await page.click('#explorer-step');
  assert.strictEqual(await page.getAttribute('#viz-svg', 'data-stage'), 'attention');
  assert.strictEqual(await page.getAttribute('#viz-svg', 'data-focus'), 'choices');
  assert.strictEqual(await page.locator('.problem-attached, .problem-search-ring, .open-pulse, .resolve-pulse').count(), 0, 'explorer must not contain background motion cues');
  assert(!(await page.locator('#explorer-reading-guide').getAttribute('open')), 'legends should start collapsed');
  await page.click('#explorer-reading-guide summary');
  assert(await page.isVisible('#explorer-choice-legend'));
  assert(await page.isVisible('#explorer-problem-legend'));
  for (let i = 0; i < 80; i++) {
    if (await page.isDisabled('#explorer-step')) break;
    await page.click('#explorer-step');
  }
  await page.waitForSelector('#sim-summary:visible');
  assert((await page.textContent('#sum-header')).includes('animated run'));
  assert((await page.textContent('#sum-choice-resolution')).includes('10.0 of 10'), 'immediate successful closures must count as solving problems');
  assert((await page.textContent('#sum-prob-resolved')).includes('20.0 of 20'));
  assert(await page.isDisabled('#explorer-step'), 'finished playback cannot advance');
  assert(await page.isVisible('#generate-run-btn'), 'new generation must be available after completion');
  await page.click('#replay-btn');
  await page.waitForSelector('#explorer-playback:visible');
  assert(!(await page.isVisible('#sim-summary')), 'replay must restart the animation');
  assert((await page.textContent('#explorer-stage-note')).includes('0 of 20'), 'replay starts at the same initial snapshot');
  assert.strictEqual(await page.inputValue('#explorer-track'), '', 'replay must reset tracking');
  await page.selectOption('#panel-a-load', 'heavy');
  assert(!(await page.isVisible('#explorer-playback')), 'changing parameters must stop old playback');

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
