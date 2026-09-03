// Reload-mid-form probe. Run from the project root against a DEV server so
// Svelte's hydration warnings are not stripped:
//   npx vite dev --port 5199 --strictPort &   (stop it afterwards!)
//   node docs/phases/reference/hydration-probe.mjs http://localhost:5199
// Prints the server-rendered step heading, the hydrated step heading, and
// every console message emitted after the reload. Success = no
// `hydration_mismatch` (or any warning/error) and the persisted step shown.
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(`${base}/examples/conditional`);
await page.waitForLoadState('networkidle');
await page.getByRole('radio', { name: 'Yes' }).check();
await page.getByRole('checkbox', { name: 'Mountains' }).check();
await page.getByRole('button', { name: /Next/ }).click();
await page.getByRole('heading', { name: 'Trip Details' }).waitFor();
await page.waitForTimeout(500); // let the debounced save flush

logs.length = 0;
const resp = await page.reload({ waitUntil: 'commit' });
const ssrHtml = await resp.text();
const ssrHeading = ssrHtml.match(/<h2[^>]*>([^<]*)<\/h2>/)?.[1];
await page.waitForLoadState('networkidle');
const clientHeading = await page.getByRole('heading', { level: 2 }).first().textContent();
console.log('SSR heading      :', ssrHeading);
console.log('Hydrated heading :', clientHeading?.trim());
console.log('Console after reload:');
console.log(logs.filter((l) => !l.includes('[vite]')).join('\n') || '(nothing)');
await browser.close();
