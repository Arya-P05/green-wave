# Green Wave

Can traffic lights that only look at their own queues produce a green wave on
their own? A small traffic simulation, four signal controllers, one Toronto
corridor, and a write-up with live figures.

```
npm install
npm run dev            # the showcase page
npm test               # sim unit tests (node:test, no extra deps)
npm run data:cliff     # recompute data/cliff.json
npm run data:toronto   # rebuild data/spadina.json from the committed counts
npm run experiment     # rerun the experiment into data/experiment.json (~3 min)
```

## Layout

- `lib/sim`: the simulation, pure TypeScript with no dependencies.
  Nagel-Schreckenberg cells (`sim.ts`), the corridor (`network.ts`), Webster
  timing (`webster.ts`), the controllers (`controllers/`), scenarios and
  metrics (`scenario.ts`), and the platoon ratio (`analysis.ts`).
- `scripts`: node scripts that write the JSON in `data/`. Node runs the
  TypeScript directly, so there's no build step.
- `components`: the figures. Each runs the same sim in the browser or reads
  the precomputed JSON.
- `FINDINGS.md`: what the experiment found, with the numbers.

Traffic counts are from the City of Toronto's open data; see `data/README.md`.
Contains information licensed under the Open Government Licence – Toronto.
