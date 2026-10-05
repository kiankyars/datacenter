// Captures every chapter, the open server and each flow at several viewport sizes for
// visual review. CI uploads the folder as an artifact. Usage: node tests/screenshots.mjs [outDir]
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const out = process.argv[2] || 'screenshots';
await mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: '0' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
const base = await new Promise((resolve, reject) => {
  let output = '';
  server.stdout.on('data', (chunk) => {
    output += chunk;
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
    if (match) resolve(match[0]);
  });
  server.on('exit', (code) => reject(new Error(`The dev server exited with code ${code}`)));
});
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const sizes = [
  [1440, 900],
  [1024, 768],
  [1920, 1080],
  [768, 1024],
  [390, 844],
  [844, 390],
];
const settle = async (page) => {
  await page.waitForFunction(() => window.datacenter?.isSettled(), null, { timeout: 30000 });
  await page.waitForTimeout(250);
};
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => document.body.dataset.world === 'ready');
    const shot = async (name) => {
      await settle(page);
      await page.screenshot({ path: `${out}/${width}x${height}-${name}.png` });
    };
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.press(String(i));
      await shot(`chapter-${i}`);
    }
    await page.keyboard.press('3');
    await settle(page);
    await page.click('#open-server');
    await shot('server');
    await page.keyboard.press('Escape');
    for (const [key, flow] of [
      ['2', 'power'],
      ['4', 'cooling'],
      ['5', 'network'],
    ]) {
      await page.keyboard.press(key);
      await settle(page);
      await page.click('#trace');
      await shot(`flow-${flow}`);
    }
    await page.keyboard.press('2');
    await settle(page);
    await page.click('#open-guide');
    await page.click('#equipment-content [data-equipment="ups"]');
    await shot('equipment-ups');
    if (errors.length) console.error(`${width}x${height}:`, errors);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`Saved screenshots to ${out}/`);
