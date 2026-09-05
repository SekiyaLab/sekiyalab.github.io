/* Screenshot key surfaces at desktop + mobile. Usage: node scripts/shoot.mjs [path...] */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.BASE ?? 'http://localhost:4321';
const outDir = process.env.OUT_DIR ?? 'shots';
const paths = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/f/audit-retrieval/', '/s/deep-lob/', '/i/trace-npm/', '/journal/', '/institute/', '/study/', '/q/deployed-vs-tested/'];

const sizes = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const size of sizes) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
  });
  for (const p of paths) {
    const name = p === '/' ? 'index' : p.replaceAll('/', '_').replaceAll('#', 'hash-').replace(/^_|_$/g, '');
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(outDir, `${size.name}-${name}.png`) });
    await page.screenshot({ path: join(outDir, `${size.name}-${name}-full.png`), fullPage: true });
    console.log(`${size.name} ${p}`);
  }
  await page.close();
}
await browser.close();
