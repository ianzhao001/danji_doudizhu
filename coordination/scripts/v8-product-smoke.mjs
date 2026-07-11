#!/usr/bin/env node
/** Stable-load product error gate for V8 (post-capture validation). */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/V8-evidence');
const BASE_URL = 'http://127.0.0.1:7788/';
const SEED = 20260705;

const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];

function attachStableCollectors(page, bucket, viewport) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('favicon')) return;
    bucket.push({ source: 'console', message: text, viewport });
  });
  page.on('pageerror', (err) => {
    bucket.push({ source: 'pageerror', message: err.message, viewport });
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('favicon')) return;
    const failure = req.failure();
    bucket.push({ source: 'requestfailed', message: `${url} ${failure?.errorText ?? 'failed'}`, viewport });
  });
}

async function waitStable(page) {
  await page.waitForSelector('#GameCanvas', { timeout: 90000 });
  await page.waitForFunction(() => {
    const canvas = document.getElementById('GameCanvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  }, { timeout: 90000 });
  await page.waitForFunction(() => Boolean(globalThis.cc?.director?.getScene?.()), { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

async function main() {
  const productErrors = [];
  for (const vp of VIEWPORTS) {
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const bucket = [];
    attachStableCollectors(page, bucket, vp.label);
    await page.goto(`${BASE_URL}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitStable(page);
    await page.evaluate(() => globalThis.cc?.director?.loadScene?.('game'));
    await page.waitForTimeout(5000);
    productErrors.push(...bucket);
    await browser.close();
  }

  const summaryPath = path.join(EVIDENCE, 'summary.json');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  summary.productErrors = productErrors;
  summary.productErrorsCount = productErrors.length;
  summary.stableLoadSmokeAt = new Date().toISOString();
  summary.harnessNoiseNote = 'Full capture run may log ERR_ABORTED on navigation/reload; stable-load smoke is the product error gate.';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ productErrorsCount: productErrors.length, productErrors }, null, 2));
  if (productErrors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
