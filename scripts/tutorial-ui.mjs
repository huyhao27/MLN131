// Usage: node scripts/tutorial-ui.mjs <absolute path to playwright/index.mjs> <chrome.exe>
// Start the Vite server first. Browser dependencies are intentionally not added to the game.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { contextualHints } from '../src/ui/tutorial.js';
assert.equal(contextualHints({ phase: 'random' })[0].id, 'random');
assert.equal(contextualHints({ phase: 'finalRepair' })[0].id, 'repair');
assert(contextualHints({ resources: { CAPACITY: 34 } }).some(h => h.id === 'capacity'));
assert(!contextualHints({ resources: { CAPACITY: 35 } }).some(h => h.id === 'capacity'));
assert.deepEqual(contextualHints({ options: [{ disabled: true }, { fallbackFor: 'X' }] }).map(h => h.id), ['locked', 'pilot']);
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.argv[3], headless: true });
const errors = [];
const baseUrl = process.argv[4] || 'http://localhost:5173';
try {
  for (const choice of ['Y1-A', 'Y1-B', 'Y1-C']) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/?random=0`);
    await page.locator('dialog[open]').waitFor();
    await page.keyboard.press('1');
    assert.equal(await page.evaluate(() => window.__game.state.phase), 'briefing');
    await page.locator('[data-guide]').click();
    assert.equal(await page.evaluate(() => window.__game.state.phase), 'yearStart');
    await page.locator('[data-next]').click();
    await page.locator('.tt-continue').click();
    for (let i = 0; i < 3; i++) await page.locator('[data-next]').click();
    await page.locator(`[data-opt="${choice}"]`).click();
    assert.equal(await page.evaluate(() => window.__game.state.history.length), 1);
    assert.equal(await page.evaluate(() => window.__game.state.history[0].choiceId), choice);
    for (let i = 0; i < 2; i++) await page.locator('[data-next]').click();
    const before = await page.evaluate(() => JSON.stringify(window.__game.state));
    await page.locator('[data-help]').click();
    await page.keyboard.press('1');
    await page.keyboard.press('Enter');
    // Enter activates the focused close button, never a simulation choice.
    assert.equal(await page.evaluate(() => JSON.stringify(window.__game.state)), before);
    await page.locator('.tt-continue').click();
    assert.equal(await page.evaluate(() => window.__game.state.year), 2);
    if (choice === 'Y1-A') {
      for (let i = 0; i < 80 && await page.evaluate(() => window.__game.state.phase !== 'end'); i++) {
        await page.locator('.tt-choice:not(.is-disabled), .tt-continue').first().click();
      }
      assert.equal(await page.evaluate(() => window.__game.state.phase), 'end');
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/?random=0`);
  await page.locator('[data-alone]').click();
  assert.equal(await page.locator('dialog[open]').count(), 0);
  const snapshot = await page.evaluate(() => JSON.stringify(window.__game.state));
  await page.locator('[data-help]').click();
  const bounds = await page.locator('dialog').boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
  if (process.argv[5]) await page.screenshot({ path: process.argv[5], fullPage: true });
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => JSON.stringify(window.__game.state)), snapshot);
  await page.close();
  assert.deepEqual(errors, []);
  console.log('Tutorial UI: all Y1 choices, input isolation, help, skip and mobile checks pass.');
} finally {
  await browser.close();
}
