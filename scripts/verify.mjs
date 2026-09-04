/* Sekiya verification: determinism, accessibility, weight.
 * Usage: node scripts/verify.mjs  (expects preview on :4321)
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const base = process.env.BASE ?? 'http://localhost:4321';
let failures = 0;
const fail = (msg) => { failures++; console.error(`FAIL  ${msg}`); };
const pass = (msg) => console.log(`ok    ${msg}`);

const browser = await chromium.launch();

/* ---------- 1. no invisible page: .reveal content must not depend on
   scrolling or JS timing to become visible (regression guard — the
   previous homepage shipped most of its content at opacity:0 until an
   IntersectionObserver fired, which a full-page capture never triggered) ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  /* no waitForTimeout, no scroll: check the instant the DOM is parsed */
  const hidden = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    return els.filter((el) => getComputedStyle(el).opacity === '0').length;
  });
  const total = await page.evaluate(() => document.querySelectorAll('.reveal').length);
  if (hidden === 0) pass(`no invisible content — 0/${total} .reveal elements at opacity:0 pre-scroll`);
  else fail(`invisible content — ${hidden}/${total} .reveal elements at opacity:0 before any scroll`);
  await page.close();
}

/* ---------- 2. axe on key surfaces ---------- */
const axePages = ['/', '/f/audit-retrieval/', '/s/deep-lob/', '/i/trace-npm/', '/study/', '/institute/', '/journal/', '/q/npm-install/'];
const axeCtx = await browser.newContext();
for (const p of axePages) {
  const page = await axeCtx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) {
    fail(`axe ${p} — ${serious.map((v) => `${v.id}(${v.nodes.length})`).join(', ')}`);
  } else {
    pass(`axe ${p} — no serious/critical violations (${results.violations.length} minor)`);
  }
  await page.close();
}

/* ---------- 3. weight budget: homepage < 900KB compressed (field engine included) ---------- */
{
  const page = await browser.newPage();
  let bytes = 0;
  page.on('response', async (res) => {
    try {
      const body = await res.body();
      bytes += body.length;
    } catch { /* streamed */ }
  });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const kb = Math.round(bytes / 1024);
  if (kb < 900) pass(`homepage weight ${kb}KB < 900KB`);
  else fail(`homepage weight ${kb}KB ≥ 900KB`);
  await page.close();
}

/* ---------- 4. keyboard: area lens filter is operable ---------- */
{
  const page = await browser.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-lens="M&S"]');
  await page.focus('[data-lens="M&S"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const pressed = await page.getAttribute('[data-lens="M&S"]', 'aria-pressed');
  if (pressed === 'true') pass('keyboard filter — area lens toggles via keyboard');
  else fail('keyboard filter — area lens did not toggle via keyboard');
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
