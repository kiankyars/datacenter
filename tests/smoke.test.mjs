// Browser smoke tests. They run in CI (see .github/workflows/pages.yml); locally they
// need `npx playwright install chromium` first.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

let server;
let browser;
let BASE;

before(async () => {
  server = spawn(process.execPath, ['server.mjs'], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  BASE = await new Promise((resolve, reject) => {
    let output = '';
    server.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) resolve(match[0]);
    });
    server.on('exit', (code) => reject(new Error(`The dev server exited with code ${code}`)));
  });
  browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

async function open(viewport = DESKTOP, { hash = '', setup } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  // Web fonts are not part of what these tests check, and must not depend on the network.
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  if (setup) await setup(page);
  await page.goto(BASE + hash);
  await page.waitForFunction(() => document.body.dataset.world);
  return { page, errors, close: () => context.close() };
}

const chapterIs = (page, n) =>
  page.waitForFunction(
    (label) => document.querySelector('#stop-count').textContent.startsWith(label),
    String(n).padStart(2, '0'),
  );

for (const viewport of [DESKTOP, PHONE]) {
  test(`every chapter, the open server and each flow work without errors at ${viewport.width}px`, async () => {
    const { page, errors, close } = await open(viewport);
    assert.equal(await page.getAttribute('body', 'data-world'), 'ready');
    assert.equal(await page.textContent('#motion-button'), 'Play motion');
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.press(String(i));
      await chapterIs(page, i);
    }
    await page.keyboard.press('3');
    await chapterIs(page, 3);
    await page.click('#open-server');
    await page.waitForSelector('#equipment-dialog[open]');
    assert.equal(await page.textContent('#equipment-title'), 'Inside a server');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#equipment-dialog').open);
    for (const [key, flow] of [
      ['2', 'power'],
      ['4', 'cooling'],
      ['5', 'network'],
    ]) {
      await page.keyboard.press(key);
      await chapterIs(page, Number(key));
      await page.click('#trace');
      await page.waitForSelector(`#trace[aria-pressed="true"][data-flow="${flow}"]`);
      assert.notEqual(await page.textContent('#flow-caption'), '');
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    assert.deepEqual(errors, []);
    await close();
  });
}

test('opening equipment turns the flow off, and its toggle with it', async () => {
  const { page, close } = await open();
  await page.keyboard.press('2');
  await chapterIs(page, 2);
  await page.click('#trace');
  await page.waitForSelector('#trace[aria-pressed="true"]');
  await page.click('#open-guide');
  await page.click('#equipment-content [data-equipment="transformer"]');
  await page.waitForFunction(() => document.querySelector('#equipment-title')?.textContent === 'Transformer');
  assert.equal(await page.getAttribute('#trace', 'aria-pressed'), 'false');
  assert.equal(await page.textContent('#flow-caption'), '');
  await page.keyboard.press('Escape');
  await page.click('#trace');
  assert.equal(await page.getAttribute('#trace', 'aria-pressed'), 'true');
  await close();
});

test('keyboard focus stays on controls that change the chapter copy', async () => {
  const { page, close } = await open();
  await page.keyboard.press('2');
  await chapterIs(page, 2);
  await page.focus('#trace');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'trace');
  await page.focus('#next');
  for (let n = 3; n <= 6; n++) {
    await page.keyboard.press('Enter');
    await chapterIs(page, n);
  }
  assert.equal(await page.evaluate(() => document.activeElement.id), 'next');
  assert.equal(await page.getAttribute('#next', 'aria-disabled'), 'true');
  await close();
});

test('the page does not scroll behind the open drawer', async () => {
  const { page, close } = await open();
  await page.keyboard.press('2');
  await chapterIs(page, 2);
  await page.click('#open-guide');
  await page.waitForSelector('#equipment-dialog[open]');
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(300, 400);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => scrollY), before);
  assert.match(await page.textContent('#stop-count'), /^02/);
  await close();
});

test('chapter labels in the overview open their chapter', async () => {
  const { page, close } = await open();
  const label = page.locator('#hotspots .hotspot:not([hidden])').first();
  await label.waitFor();
  const number = Number((await label.textContent()).slice(0, 2));
  await label.click();
  await chapterIs(page, number);
  await close();
});

test('equipment labels in a chapter open their detail', async () => {
  const { page, close } = await open();
  await page.keyboard.press('2');
  await chapterIs(page, 2);
  const label = page.locator('#hotspots .hotspot-item:not([hidden])').first();
  await label.waitFor();
  await label.click();
  await page.waitForSelector('#equipment-dialog[open]');
  assert.match(await page.textContent('#equipment-dialog .eyebrow'), /^POWER \/ LOOK CLOSER/);
  await close();
});

test('a shared address opens its chapter and equipment', async () => {
  const { page, errors, close } = await open(DESKTOP, { hash: '#power/ups' });
  await page.waitForSelector('#equipment-dialog[open]');
  assert.equal(await page.textContent('#equipment-title'), 'UPS & batteries');
  assert.match(await page.textContent('#stop-count'), /^02/);
  assert.deepEqual(errors, []);
  await close();
});

test('copy and navigation work when three.js cannot load', async () => {
  const { page, close } = await open(DESKTOP, {
    setup: (p) => p.route('**/three.core.min.js', (route) => route.abort()),
  });
  assert.equal(await page.getAttribute('body', 'data-world'), 'fallback');
  assert.equal(await page.locator('#chapter-nav button').count(), 6);
  assert.ok(await page.locator('.world-fallback').isVisible());
  await page.keyboard.press('4');
  await chapterIs(page, 4);
  await page.click('#open-guide');
  await page.waitForSelector('#equipment-dialog[open]');
  await close();
});

test('a frame that starts 0px tall recovers without errors', async () => {
  const context = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' });
  await context.route(/^https:\/\/fonts\./, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  await context.addInitScript(() => {
    window.__errors = [];
    addEventListener('error', (e) => window.__errors.push(String(e.message)));
    addEventListener('unhandledrejection', (e) => window.__errors.push(String(e.reason)));
  });
  const page = await context.newPage();
  await page.route(`${BASE}host.html`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<iframe id="f" src="/" style="width:800px;height:0;border:0"></iframe>',
    }),
  );
  await page.goto(`${BASE}host.html`);
  const frame = await (await page.waitForSelector('#f', { state: 'attached' })).contentFrame();
  await frame.waitForSelector('#chapter-copy h1');
  await page.evaluate(() => {
    document.getElementById('f').style.height = '700px';
  });
  await frame.waitForFunction(() => document.body.dataset.world === 'ready');
  await frame.evaluate(() => scrollTo(0, 10));
  await page.waitForTimeout(300);
  assert.deepEqual(await frame.evaluate(() => window.__errors), []);
  await context.close();
});

test('content after the journey takes over the page past its end', async () => {
  const { page, errors, close } = await open();
  // Embed the journey between host content, as the course homepage does.
  await page.evaluate(() => {
    const before = document.createElement('section');
    before.style.height = '600px';
    document.querySelector('#scroll-track').before(before);
    const after = document.createElement('section');
    after.id = 'after';
    after.style.height = '2000px';
    document.querySelector('#scroll-track').after(after);
    dispatchEvent(new Event('resize'));
  });
  await page.keyboard.press('6');
  await chapterIs(page, 6);
  await page.evaluate(() => document.getElementById('after').scrollIntoView());
  await page.waitForFunction(() => document.body.classList.contains('past-journey'));
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#story')).visibility), 'hidden');
  assert.equal(await page.evaluate(() => location.hash), '');
  const y = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction((start) => scrollY > start, y);
  assert.match(await page.textContent('#stop-count'), /^06/);
  await page.keyboard.press('Home');
  await page.waitForFunction(() => !document.body.classList.contains('past-journey'));
  await page.evaluate(() => scrollTo(0, 650));
  await page.waitForFunction(() => document.querySelector('#stop-count').textContent.startsWith('01'));
  await page.keyboard.press('3');
  await chapterIs(page, 3);
  const trackTop = await page.evaluate(
    () => document.querySelector('#scroll-track').getBoundingClientRect().top + scrollY,
  );
  assert.equal(trackTop, 600);
  assert.deepEqual(errors, []);
  await close();
});
