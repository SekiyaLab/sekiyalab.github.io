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

/* ---------- 0. responsive layout sanity: no horizontal overflow on key sizes ---------- */
for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth <= overflow.clientWidth + 1) {
    pass(`responsive ${viewport.name} — no horizontal overflow (${overflow.scrollWidth}/${overflow.clientWidth})`);
  } else {
    fail(`responsive ${viewport.name} — horizontal overflow (${overflow.scrollWidth}/${overflow.clientWidth})`);
  }
  await page.close();
}

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

/* ---------- 1b. no-JS fallback: content and static hero field are present ---------- */
{
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  const state = await page.evaluate(() => {
    const hero = document.querySelector('.home-hero');
    const heading = document.querySelector('.home-hero h1');
    const field = document.querySelector('.home-hero__field');
    const box = field?.getBoundingClientRect();
    return {
      heading: heading?.textContent?.trim() ?? '',
      heroHeight: Math.round(hero?.getBoundingClientRect().height ?? 0),
      field: Boolean(field),
      fieldWidth: Math.round(box?.width ?? 0),
      fieldHeight: Math.round(box?.height ?? 0),
    };
  });
  if (state.heading && state.field && state.fieldWidth > 1000 && state.fieldHeight > 700 && state.heroHeight <= 1100) {
    pass(`no-js fallback — hero text and static field render (${state.fieldWidth}x${state.fieldHeight}, hero ${state.heroHeight}px)`);
  } else {
    fail(`no-js fallback — ${JSON.stringify(state)}`);
  }
  await context.close();
}

/* ---------- 2. axe on key surfaces ---------- */
const axePages = [
  '/',
  '/academy/',
  '/research/',
  '/technology/',
  '/f/audit-retrieval/',
  '/s/deep-lob/',
  '/study/',
  '/institute/',
  '/journal/',
  '/q/point-in-time/',
];
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

/* ---------- 4b. focus visibility: keyboard focus has a visible outline ---------- */
{
  const page = await browser.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim().slice(0, 40) ?? '',
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
  if (focus && focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) >= 1) {
    pass(`focus — first tabbable element shows outline (${focus.tag}, ${focus.outlineWidth}, ${focus.outlineColor})`);
  } else {
    fail(`focus — ${JSON.stringify(focus)}`);
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

/* ---------- 4. keyboard: the work index filter is operable ---------- */
{
  const page = await browser.newPage();
  await page.goto(base + '/research/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-research-filter="record"]');
  await page.focus('[data-research-filter="record"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const pressed = await page.getAttribute('[data-research-filter="record"]', 'aria-pressed');
  const visible = await page.locator('[data-work-area]:not([hidden])').count();
  const nonRecordVisible = await page.locator('[data-work-area]:not([hidden]):not([data-work-area="record"])').count();
  if (pressed === 'true' && visible > 0 && nonRecordVisible === 0) {
    pass('keyboard filter — work index filters to the selected area');
  } else {
    fail(`keyboard filter — pressed=${pressed}, visible=${visible}, non-record=${nonRecordVisible}`);
  }
  await page.close();
}

/* ---------- 5. public/private boundary: private work is named, never linked ---------- */
{
  const page = await browser.newPage();
  await page.goto(base + '/research/', { waitUntil: 'networkidle' });
  const nonPublicLinks = await page.locator('[data-work-area]:has(.access-tag:not(.is-public)) a').count();
  const named = await page.locator('[data-work-area]').count();
  if (nonPublicLinks === 0 && named >= 9) pass(`work index — ${named} named entries; non-public entries are not linked`);
  else fail(`work index — non-public links=${nonPublicLinks}, named=${named}`);
  await page.close();
}

/* ---------- 6. reduced motion: the hero field stops animating,
   and smooth scrolling is disabled ---------- */
{
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const heroMotion = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.site-field__mesh, .site-field__signal, .home-hero__environment, .home-hero__field, .home-hero__plane')).map((el) => {
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        transform: style.transform,
      };
    }),
  );
  const smoothScroll = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  const media = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fieldStatic = heroMotion.every((item) => item.animationName === 'none' && item.transform === 'none');
  if (media && fieldStatic && smoothScroll === 'auto') {
    pass('reduced motion — site and hero fields stop animating; smooth scrolling disabled');
  } else {
    fail(`reduced motion — media=${media}, fieldStatic=${fieldStatic}, smoothScroll=${smoothScroll}, heroMotion=${JSON.stringify(heroMotion)}`);
  }
  await context.close();
}

/* ---------- 6b. sampled contrast: key text remains comfortably above WCAG AA ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const samples = await page.evaluate(() => {
    const parse = (value) => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return {
        r: parts[0] ?? 0,
        g: parts[1] ?? 0,
        b: parts[2] ?? 0,
        a: parts[3] ?? 1,
      };
    };
    const blend = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const luminance = (c) => {
      const channel = [c.r, c.g, c.b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
    };
    const ratio = (a, b) => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const backgroundFor = (el) => {
      let bg = { r: 10, g: 11, b: 13, a: 1 };
      const chain = [];
      for (let node = el; node; node = node.parentElement) chain.push(node);
      for (const node of chain.reverse()) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c.a > 0) bg = blend(c, bg);
      }
      return bg;
    };
    return [
      ['hero lede', '.home-hero__lede'],
      ['section intro', '.section-intro'],
      ['hero entry', '.home-hero__entry'],
    ].map(([name, selector]) => {
      const el = document.querySelector(selector);
      if (!el) return { name, selector, found: false };
      const fg = parse(getComputedStyle(el).color);
      const bg = backgroundFor(el);
      return { name, selector, found: true, contrast: Number(ratio(fg, bg).toFixed(2)) };
    });
  });
  const weak = samples.filter((sample) => !sample.found || sample.contrast < 4.5);
  if (weak.length === 0) {
    pass(`contrast — sampled key text >= 4.5:1 (${samples.map((s) => `${s.name}:${s.contrast}`).join(', ')})`);
  } else {
    fail(`contrast — weak samples ${JSON.stringify(weak)}`);
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
