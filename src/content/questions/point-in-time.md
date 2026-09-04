---
question: Can you reconstruct what was actually knowable then?
areas: [M&S]
date: 2026-09-04
order: 3
lead: Datasets remember everything, including things nobody knew yet. Point-in-time truth is a reconstruction problem.
repos:
  - label: clock-dataset
    url: https://github.com/SekiyaLab/clock-dataset
    note: Point-in-time reconstruction and the recorded/knowable gap.
  - label: degradation-diagnosis
    url: https://github.com/SekiyaLab/degradation-diagnosis
    note: Diagnosing when a model's world has moved.
---

A training table is a photograph taken now of a world that was knowable then. Features revised after the fact, labels that arrived late, records backfilled by later processes — each one leaks the future into the past, and each leak flatters a model.

The clock-dataset work builds datasets where the information state at time *t* can be reconstructed honestly — and measures what the gap between "recorded" and "knowable" does to evaluation.
