---
question: What does an npm install really touch?
areas: [S&S]
date: 2026-09-04
order: 2
lead: Lifecycle scripts run with your credentials, your network and your filesystem. Almost nothing tells you what they did.
objects:
  - trace-npm
  - audit-retrieval
---

An install script is arbitrary code executed at the moment of maximum trust. The package manager asks for approval; it does not describe behaviour. The question is not whether to be afraid of install scripts — it is how to *see* one.

trace-npm is Sekiya's instrument for that: run the script under a tracer, keep the record, state what the record cannot show.
