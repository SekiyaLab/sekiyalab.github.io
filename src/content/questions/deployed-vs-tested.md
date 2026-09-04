---
question: Is the model you deployed actually the model you tested?
areas: [M&S, S&S]
date: 2026-09-04
order: 1
lead: Release equivalence, evaluation leakage, and the gap between the artifact you measured and the one you shipped.
objects:
  - deep-lob
repos:
  - label: release-equivalence
    url: https://github.com/SekiyaLab/release-equivalence
    note: When is a release behaviourally the system you tested?
  - label: decision-assurance
    url: https://github.com/SekiyaLab/decision-assurance
    note: What a decision record does and does not assure.
---

Every evaluation makes a quiet promise: that the thing measured is the thing that ships. Sekiya keeps finding that promise broken in interesting places — in release pipelines where identical-looking artifacts produce different decisions, and in evaluation protocols where the test itself manufactures the confidence it reports.

The work under this question asks where the gap opens, how wide it can get, and what a boundary that closes it has to look like.
