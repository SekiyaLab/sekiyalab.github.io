# Independent review — Sekiya public-site redesign — r01

**Verdict: ACCEPT**

Reviewer had no role in building the candidate. Review was read-only: no source, styles, content, assets, scripts, configuration, git history, remotes, or deployment state was modified. The only artifact created is this file.

## Candidate / base / scope

- Candidate: `812fd29` — "redesign: rebuild Sekiya public site"
- Immediate parent (preserved pre-rebuild snapshot): `d41589c`
- Published baseline: `a8c47a5`
- Ancestry verified: `d41589c` is an ancestor of `812fd29` (`git merge-base --is-ancestor` = true); working tree at `812fd29` is clean.
- Full diff reviewed against both `d41589c` (28 files, +1394/-1243) and `a8c47a5` (29 files, +1761/-1594).
- Scope check: the diff touches only presentation/content of the existing site (components, styles, page copy, a few data-file annotations, a build-time syntax-highlight theme swap, favicon assets, and the two verification/screenshot scripts). No new dependencies, no infra/deploy config (`astro.config.mjs` only changes the Shiki syntax-highlight theme to a CSS-variables theme; `site`/`base`/deploy target untouched), no governance or IA rewrite. Assessed as in-scope for a public-site redesign.

## Checks and viewports actually inspected

- Rendered via the candidate's own `astro build` output, served on the already-running local preview (`localhost:4321`), confirmed to be serving the reviewed commit (title, markup, and asset hashes match the built `dist/`).
- Ran `node scripts/verify.mjs` (Playwright + axe-core, read-only against localhost) — full output: responsive-overflow at mobile/tablet/desktop, no-JS fallback, `.reveal` pre-scroll visibility, axe WCAG2A/AA on 11 representative pages (`/`, `/academy/`, `/academy/gpu-command-journey/`, `/academy/ping-pong-buffers/`, `/f/audit-retrieval/`, `/s/deep-lob/`, `/i/trace-npm/`, `/study/`, `/institute/`, `/journal/`, `/q/npm-install/`), keyboard-operable work-index filter, focus-visible outline, homepage weight, `prefers-reduced-motion` behavior, and sampled contrast. **All checks passed, 0 failures.**
- Independently re-measured contrast on the primary nav links (not covered by the script's sample set): `rgb(131,141,156)` on the page background = 5.86:1 at 13px/400 — comfortably above AA for small text, corroborating axe's page-wide color-contrast pass.
- Captured fresh screenshots (not reused from the working tree's existing `shots/`) at desktop (1440×1000), laptop (1366×768), and mobile (390×844), both viewport and full-page, for: `/`, `/academy/`, `/institute/`, `/journal/`, `/study/`, `/f/audit-retrieval/`, `/s/deep-lob/`, `/i/trace-npm/`, `/q/npm-install/`. Visually inspected all of these.
- Read the full diff for every changed file's summary; read in full: `Mark.astro`, `SiteField.astro` (and diffed out the deleted `SignalField.astro`), `Base.astro`, `index.astro`, `research.ts`, `favicon.svg`, `astro.config.mjs`, `study.astro`; diffed `institute.astro`, `audit-retrieval.mdx`, `trace-npm.mdx` line-by-line.
- Grepped source and `dist/` for the forbidden term `Atlas` (no matches) and for the previously-used lab identity `Ghalvera` (present in baseline frontmatter/copy, fully removed in the candidate — no residual matches anywhere, including `dist/`).
- Grepped for exposed private/internal links; verified programmatically (via `verify.mjs` check 5) that all `access: 'Private'` entries in `research.ts` are named on the work index but carry no `<a>`.

## Findings

### Blocking
None.

### Material (nonblocking)
1. **`/study/` renders byte-identical content to `/academy/`** — same `<title>Academy — Sekiya</title>`, same `<h1>`, same markup (confirmed via `curl` diff and screenshot comparison). `src/pages/study.astro` is a one-line re-export of `AcademyHome`. **This is pre-existing**, not introduced by the candidate: identical in both `d41589c` and `a8c47a5`. It is not linked from primary nav (`Base.astro`'s nav has no `/study/` entry), so it's a low-traffic orphan route rather than a user-facing dead end, but it is publicly reachable, duplicate-titled, and is one of the 11 pages the candidate's own `verify.mjs` checks — worth fixing in a follow-up commit, but it is out of this diff's actual scope and does not block this candidate.

### Nonblocking
2. `public/favicon.ico` is a single 32×32 PNG-in-ICO container (confirmed via `file`), not a multi-resolution classic ICO. Fine for all modern browsers/OSes; only matters for legacy consumers that expect embedded 16×16. Cosmetic.
3. `institute.astro` copy was reworded beyond the identity/brand pass (e.g., "A place to leave a question open for a while." → "A quiet room for difficult systems."; the personal "Elsewhere" section linking to the founder's external GitHub index was removed). This is a content edit, not an infra/governance rewrite, and removing a personal outbound link plausibly *improves* public-surface tightness — flagged as an observed change for founder awareness, not a defect.
4. `origin: Ghalvera` frontmatter and the "Originally developed under Ghalvera..." provenance sentence were removed from both `audit-retrieval.mdx` and `trace-npm.mdx`, and the `Systems & Security` summary was reworded from "telemetry record" to "event record." Read as compliant with the "no historical-lab material" boundary — verified no residual reference to that identity anywhere in source or `dist/`.

## Observed facts vs. subjective opinion

- Observed facts: all automated checks above (pass/fail, contrast ratios, ancestry, grep results, HTTP/title comparisons) are machine-verified, not taste judgments.
- Subjective, stated as such: the Newsreader/DM Mono pairing, the full-bleed dark hero, and the restrained SVG "field" background read as coherent and unfussy across all three captured viewports — this is a design opinion, offered because the brief asked for full-site coherence, but a different reviewer could reasonably weigh the italic display type differently. No boxed/dashboard-style hero container was observed at any breakpoint captured.

## Identity mark

The `Mark.astro` bat glyph was inspected at hero scale (112px, home hero), nav scale (34px, header, all pages), mobile scale (same 34px component, narrower viewport), and favicon scale (32×32 `favicon.ico` + `favicon.svg`). At every scale it reads as an abstract angular bat silhouette with a small chevron "signal" mark at center chest — not a cartoon/Halloween bat, and not visually similar to a known third-party logo as far as this reviewer can judge. This is necessarily a subjective read, not a trademark-clearance search.

## Exact next boundary

Per the brief: this `ACCEPT` means the candidate *may* be committed together with this review artifact and published, **after** the founder independently re-verifies ancestry and a clean tree at commit time (a fast final check, since nothing in this review session touched the tree). This review does not commit, push, or deploy anything, and does not itself constitute that final verification.

## Blind spots

- No screen-reader (VoiceOver/NVDA/JAWS) pass was performed — accessibility conclusions rely on automated axe (WCAG2A/AA tags) plus manual DOM/contrast inspection, not assistive-technology use.
- No real mobile/touch hardware was used — mobile findings are from Chromium viewport emulation only (390×844, 820×1180), not a physical device or Safari/iOS engine.
- Not every content page was rendered: reviewed a representative sample (home, academy index + 2 academy rooms, institute, journal index, study, 3 research-object detail pages across `/f/`, `/s/`, `/i/`, 1 question page) rather than every `/q/` question or every research object.
- `night.css`/`base.css` (1788 and 428 changed lines respectively) were not read line-by-line; reduced-motion and focus-visible coverage were spot-checked by grep and corroborated by the automated reduced-motion/focus/contrast checks rather than a full manual stylesheet audit.
- No trademark/logo-similarity search was performed for the bat mark beyond visual judgment.
- Did not test the actual GitHub Pages deployment — only the local `astro build` → `astro preview` output. `astro.config.mjs`'s only change is the Shiki theme; deploy-relevant config (`site`, `base`, output target) is unchanged from baseline, which lowers but does not eliminate this risk.
