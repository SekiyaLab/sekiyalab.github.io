# Sekiya visual research — 2026-09-04

## References investigated

- [Active Theory](https://activetheory.net/) — treats the viewport as one real-time stage rather than a page with an animation in it.
- [FIELD.IO](https://field.io/) — strong project-level visual identity and creative systems that behave as environments.
- [Tracing Art / Resn](https://www.awwwards.com/tracing-art.html) — scroll orchestration, sprite-based particle systems, and visualisation as the navigation mechanism.
- [ashMeteo](https://www.awwwards.com/sites/ashmeteo) — real data becoming an explorable spatial landscape.
- [Listening Together](https://www.awwwards.com/sites/listening-together) — a simple live relationship made legible through a network view.
- [Observable](https://observablehq.com/) — reactive explanatory graphics that make manipulation part of understanding.
- [Patchies](https://github.com/heypoom/patchies) — computation presented as a visible flow between small live systems.
- [Utsubo WebGL practice](https://www.utsubo.com/ja/webgl-threejs-development) — performance budgets, device-led technique choice, and WebGPU/WebGL fallback discipline.

## Techniques worth borrowing

- One full-viewport composition with typography, topology, cursor response, and depth in the same coordinate system.
- A small number of persistent procedural layers instead of decorative videos or large image payloads.
- Project-specific visual grammars seeded by the mechanism: timelines, traces, order-book depth, state comparison, compute cells.
- Scroll and pointer input used to reveal structure, not to hide required content.
- Spatial topic maps and manipulable mechanism diagrams for learning material.
- Reduced internal cost on small devices while preserving the art direction.

## Do not copy

- Generic starfields, terminal chrome, fake telemetry, fake Japanese labels, cinematic loaders, or neon glass SaaS.
- Portfolio sites where every project is a thumbnail in the same card.
- Scroll-gated text, inaccessible canvas-only meaning, or WebGL added merely to claim WebGL.
- Another reaction–diffusion hero. Sekiya needs its own signature.

## Sekiya synthesis

**Art direction: Signal Cartography.** Near-black space contains executable-looking
maps: topology, traces, boundaries, and state fields. Cyan is the carrier signal;
violet marks uncertainty and model structure; green marks compute; magenta is a
rare anomaly. The hero is one viewport-sized topology instrument. Research objects
carry their own miniature mechanism rather than a shared thumbnail treatment.
Academy is a navigable knowledge field whose rooms turn recovered technical notes
into visual traces and experiments. Canvas remains progressive enhancement; text,
SVG, focus states, static compositions, and reduced-motion behavior retain the
meaning without it.

## Monochrome correction — same day, second pass

The Signal Cartography palette above (cyan carrier, violet uncertainty, green
compute, magenta anomaly) read as cyberpunk-product, not Sekiya. Direction
corrected: black and white as the actual identity, not a dark theme.

**References studied for richness without chroma:** black-and-white editorial
and museum-identity design; Japanese monochrome graphic design (disciplined
asymmetry, negative space, ink/paper sensibility); generative line art and
oscilloscope/signal imagery; scientific and technical drawing; the personal
site at joshuadefreitas.github.io as aesthetic DNA — restrained, high-contrast
monochrome, precise typographic hierarchy, evidence-first writing.

**What creates richness in the absence of colour:** luminance steps (many
blacks — void, graphite, charcoal, smoke, gunmetal — many greys — steel,
cool, warm, silver — one white), translucent white hairlines instead of
tinted borders, soft white bloom standing in for glow, geometry and stroke
weight doing the work hue used to do, and grain/noise (already present,
untouched — it never depended on colour).

**Sekiya synthesis: the Black Institute.** The hero is a single luminous
topology — silver threads and points on true black, cursor-lit, oscilloscope
interference bands, one soft light entering from the pointer — screenshot-
stable, then better in motion. Every card, glyph, and lesson room keeps its
existing distinct geometry (already strong) and is retold in luminance
instead of hue: each research object gets a different grey value from the
same ramp rather than a different hue. The one accent is white itself — "the
Signal" — used exactly where the old palette used amber: hover, focus,
active state, pressed filters. No global cyan/violet/green/magenta remains
anywhere in the codebase (verified by grep for non-grayscale hex/rgba across
`src/`). A secondary dim grey — "the Quiet" — marks the other side of a
comparison (purged vs. leaking windows, read vs. write buffer) where the
design previously reached for a second hue.
