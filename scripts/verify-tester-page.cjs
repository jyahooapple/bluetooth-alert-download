const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  fs.mkdirSync('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) external.push(r.url()); });
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async text => { window.copiedReport = text; } }
    }));
    await page.goto(pathToFileURL(path.resolve('site/index.html')).href);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
    }
    const href = await page.getByRole('link', { name: 'Download latest beta APK', exact: true }).getAttribute('href');
    assert.equal(href, 'https://github.com/jyahooapple/bluetooth-alert-download/releases/latest/download/app-debug.apk');
    await page.locator('[name=appVersion]').fill('2.0.0-beta.3 (14)');
    await page.locator('[name=phone]').fill('Samsung Galaxy S22');
    await page.locator('[name=category]').selectOption('Car');
    await page.locator('[name=receiver]').fill('Toyota factory stereo');
    await page.locator('[name=title]').selectOption('Title visible but cut short');
    await page.locator('[name=play]').selectOption('Worked');
    const report = await page.locator('#report-preview').inputValue();
    assert.ok(report.includes('Generated title on receiver: Title visible but cut short'));
    assert.ok(report.includes('Play: Worked'));
    assert.ok(report.includes('Pause: Not tested'));
    assert.ok(report.includes('Android version: Unknown'));
    await page.getByRole('button', { name: 'Copy report', exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedReport), undefined);
    assert.equal(await page.locator('#privacy-check').evaluate(e => e.validity.valid), false);
    await page.locator('#privacy-check').check();
    await page.getByRole('button', { name: 'Copy report', exact: true }).click();
    await page.waitForFunction(() => window.copiedReport !== undefined);
    assert.equal(await page.evaluate(() => window.copiedReport), report);
    const [download] = await Promise.all([
      page.waitForEvent('download'), page.getByRole('button', { name: 'Download report', exact: true }).click()
    ]);
    assert.equal(download.suggestedFilename(), 'bluetooth-alert-beta-report.txt');
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), report);
    await page.evaluate(() => { window.open = url => { window.issueUrl = url; return { opener: null }; }; });
    await page.getByRole('button', { name: 'Open report on GitHub', exact: true }).click();
    const issue = new URL(await page.evaluate(() => window.issueUrl));
    assert.equal(issue.origin, 'https://github.com');
    assert.equal(issue.pathname, '/jyahooapple/bluetooth-alert-download/issues/new');
    assert.equal(issue.searchParams.get('body'), report);
    assert.equal(issue.searchParams.get('template'), 'beta-test.md');
    await page.evaluate(() => { window.open = () => null; });
    await page.getByRole('button', { name: 'Open report on GitHub', exact: true }).click();
    assert.match(await page.locator('#report-status').innerText(), /blocked/);
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
    await page.getByRole('button', { name: 'Copy report', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('report-status').textContent.includes('Automatic copying is unavailable'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], 'Report entry must not make network requests');
    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto(pathToFileURL(path.resolve('site/index.html')).href);
    assert.match(await noJs.locator('noscript').innerText(), /report builder requires JavaScript/);
    assert.ok(fs.readFileSync('.github/ISSUE_TEMPLATE/beta-test.md', 'utf8').includes('This issue is public.'));
    console.log('PASS: 320/390/1280px layouts, APK link, structured results, privacy review, clipboard success/fallback, download contents, GitHub draft/blocked popup, no automatic network submission, no-JavaScript fallback. No issue was submitted.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
