/* Sekiya — site-wide chrome: clock, field status, reveals, Lenis, register. */

declare global {
  interface Window {
    __sekiyaLenis?: { destroy: () => void };
  }
}

/* ---------- UTC clock — the institute's wall clock ---------- */
function bootClock() {
  const el = document.querySelector<HTMLElement>('[data-utc-clock]');
  if (!el) return;
  const tick = () => {
    const d = new Date();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm} UTC`;
  };
  tick();
  setInterval(tick, 20000);
}

/* ---------- header reflects the field's actual state ---------- */
function bootFieldStatus() {
  const el = document.querySelector<HTMLElement>('[data-field-status]');
  if (!el) return;
  document.addEventListener('sekiya:field', (e) => {
    const running = (e as CustomEvent).detail?.running === true;
    const dot = el.querySelector('.dot');
    if (dot) dot.classList.toggle('paused', !running);
    el.childNodes[1].textContent = running ? 'Field · running' : 'Field · paused';
  });
}

/* ---------- scroll reveals (IO-based; safe everywhere) ---------- */
let revealIO: IntersectionObserver | null = null;
function bootReveals() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll<HTMLElement>('.reveal:not(.in)');
  if (reduced) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  revealIO ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO!.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  els.forEach((el) => revealIO!.observe(el));
}

/* ---------- Lenis — silk scroll, with a hard off-ramp ---------- */
async function bootLenis() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse) return;
  const { default: Lenis } = await import('lenis');
  if (window.__sekiyaLenis) return;
  const lenis = new Lenis({ lerp: 0.14, anchors: true });
  window.__sekiyaLenis = lenis;
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/* ---------- plate SOURCE / STATE toggles ---------- */
function bootPlates() {
  document.querySelectorAll<HTMLElement>('[data-plate]').forEach((plate) => {
    if (plate.dataset.plateBoot) return;
    plate.dataset.plateBoot = '1';
    const view = plate.querySelector<HTMLButtonElement>('[data-plate-view]');
    const state = plate.querySelector<HTMLButtonElement>('[data-plate-state]');
    view?.addEventListener('click', () => {
      plate.classList.remove('show-state');
      view.setAttribute('aria-pressed', 'true');
      state?.setAttribute('aria-pressed', 'false');
    });
    state?.addEventListener('click', () => {
      plate.classList.add('show-state');
      state.setAttribute('aria-pressed', 'true');
      view?.setAttribute('aria-pressed', 'false');
    });
  });
}

/* ---------- register: lens filters + sorting ---------- */
function bootRegister() {
  const table = document.querySelector<HTMLTableElement>('[data-register]');
  if (!table || table.dataset.registerBoot) return;
  table.dataset.registerBoot = '1';
  const tbody = table.querySelector('tbody')!;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const lenses = document.querySelectorAll<HTMLButtonElement>('[data-lens]');
  const caption = document.querySelector<HTMLElement>('[data-register-caption]');

  function applyLens(area: string) {
    let shown = 0;
    for (const row of rows) {
      const visible = area === 'all' || row.dataset.area === area;
      row.hidden = !visible;
      if (visible) shown++;
    }
    if (caption) {
      caption.textContent =
        area === 'all'
          ? `${rows.length} objects · all areas`
          : `${shown} objects · ${area}`;
    }
  }

  lenses.forEach((lens) => {
    lens.addEventListener('click', () => {
      lenses.forEach((l) => l.setAttribute('aria-pressed', l === lens ? 'true' : 'false'));
      applyLens(lens.dataset.lens!);
      const target = document.querySelector('#register');
      if (lens.dataset.scroll !== 'false') target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* deep-link: /?area=S%26S */
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area');
  if (area) {
    const lens = Array.from(lenses).find((l) => l.dataset.lens === area);
    lens?.click();
  }

  let sortKey: 'date' | 'no' = 'date';
  let sortDir = -1;
  table.querySelectorAll<HTMLTableCellElement>('th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort as 'date' | 'no';
      sortDir = key === sortKey ? -sortDir : -1;
      sortKey = key;
      table.querySelectorAll('.sort-mark').forEach((m) => m.remove());
      const mark = document.createElement('span');
      mark.className = 'sort-mark';
      mark.textContent = sortDir < 0 ? ' ↓' : ' ↑';
      th.appendChild(mark);
      rows.sort((a, b) => {
        const av = a.dataset[sortKey] ?? '';
        const bv = b.dataset[sortKey] ?? '';
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });
      for (const row of rows) tbody.appendChild(row);
    });
  });
}

/* ---------- sidenotes: inline toggle when not in margin ---------- */
function bootSidenotes() {
  document.querySelectorAll<HTMLElement>('[data-sidenote-ref]').forEach((ref) => {
    if (ref.dataset.snBoot) return;
    ref.dataset.snBoot = '1';
    ref.addEventListener('click', () => {
      const note = document.getElementById(ref.dataset.sidenoteRef!);
      note?.classList.toggle('open');
    });
  });
}

/* ---------- object rail: active section tracking ---------- */
function bootRail() {
  const links = document.querySelectorAll<HTMLAnchorElement>('.object-rail a[href^="#"]');
  if (!links.length) return;
  const sections = Array.from(links)
    .map((a) => document.querySelector(a.getAttribute('href')!))
    .filter(Boolean) as Element[];
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach((a) =>
            a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`),
          );
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

function boot() {
  bootClock();
  bootFieldStatus();
  bootReveals();
  bootLenis();
  bootPlates();
  bootRegister();
  bootSidenotes();
  bootRail();
}

document.addEventListener('astro:page-load', boot);
boot();
