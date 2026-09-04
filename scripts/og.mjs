/* Generate the social card from the homepage itself. */
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://localhost:4321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('og.png written');
