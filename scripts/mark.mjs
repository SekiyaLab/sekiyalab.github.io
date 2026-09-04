/* Rasterize the Sekiya mark (public/mark.svg) to square PNGs for use as a
 * profile picture / avatar asset. Usage: node scripts/mark.mjs */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const svg = readFileSync(new URL('../public/mark.svg', import.meta.url), 'utf8');
const sizes = [512, 1024];

mkdirSync('docs/brand', { recursive: true });

const browser = await chromium.launch();
for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`
    <!doctype html><html><head><meta charset="utf-8" /><style>
      html,body{margin:0;padding:0;background:#030303;}
      svg{display:block;width:${size}px;height:${size}px;}
    </style></head><body>${svg}</body></html>
  `);
  await page.waitForTimeout(80);
  const path = `docs/brand/sekiya-mark-${size}.png`;
  await page.screenshot({ path });
  await page.close();
  console.log(`${path} written`);
}
await browser.close();
