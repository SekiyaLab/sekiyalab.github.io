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

/* ---------- 1. Field determinism: same seed ⇒ same checksum at same step ---------- */
{
  const readChecksum = async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-r-checksum]');
    /* scrub to a fixed step and wait for the engine to catch up */
    await page.evaluate(() => new Promise((resolve) => {
      const track = document.querySelector('[data-time-track]');
      const target = 512;
      const iv = setInterval(() => {
        const now = parseInt(track.getAttribute('aria-valuenow') ?? '0', 10);
        if (now >= target) { clearInterval(iv); resolve(); }
      }, 120);
      track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
      track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    }));
    await page.waitForTimeout(400);
    const checksum = await page.textContent('[data-r-checksum]');
    const step = await page.textContent('[data-r-step]');
    await page.close();
    return { checksum: checksum?.trim(), step: step?.trim() };
  };
  const a = await readChecksum();
  const b = await readChecksum();
  if (a.checksum && a.checksum === b.checksum && a.checksum !== '00000000') {
    pass(`field determinism — checksum ${a.checksum} reproduced at step ~512`);
  } else {
    fail(`field determinism — ${a.checksum} vs ${b.checksum}`);
  }
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

/* ---------- 4. keyboard: time axis operable ---------- */
{
  const page = await browser.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-time-track]');
  await page.focus('[data-time-track]');
  const before = await page.textContent('[data-r-step]');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  const after = await page.textContent('[data-r-step]');
  if (before !== after) pass(`keyboard scrub — step ${before?.trim()} → ${after?.trim()}`);
  else fail('keyboard scrub — step did not change');
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
