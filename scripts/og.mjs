/* Generate the social card from the live field — the artifact is the image. */
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://localhost:4321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(base + '/', { waitUntil: 'networkidle' });
/* let the field develop into a mature pattern */
await page.waitForTimeout(14000);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('og.png written');
