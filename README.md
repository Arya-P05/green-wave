# writing

Arya Patel's writing: questions I got curious about, each worked out with a
small simulation and written up as a post with live figures you can play with.
One Next.js site, one post per route.

| route | post | question |
|---|---|---|
| `/` | the index | |
| `/green-wave` | green wave | Can traffic lights find the green wave on their own? |

```
npm install
npm run dev            # the site, every post
npm test               # every post's unit tests (node:test, no extra deps)
npm run lint && npm run typecheck && npm run build
```

## Layout

Each post keeps its own code in folders named after it, so posts never
reach into each other:

- `app/<post>/page.tsx`: the write-up. `app/<post>/numbers.ts`: every number
  the prose quotes, read from that post's generated data so the words can't
  drift from the results.
- `lib/<post>/`: the simulation, pure TypeScript with no dependencies.
- `components/<post>/`: the figures.
- `scripts/<post>/`: node scripts that write `data/<post>/`. Node runs the
  TypeScript directly, so there's no build step.
- `docs/<post>/`: findings and notes.

Shared by every post: `app/layout.tsx` (IBM Plex Mono, the palette in
`app/globals.css`), `components/shared/` (contents, "what you're looking at /
try this" lines, "if you want more detail on…" fold-outs, charts, the
signature, canvas hooks) and `lib/shared/random.ts` (a seeded PRNG, so every
number is reproducible). `app/writings.ts` is the list on the index page.

Personal anecdotes in the prose are marked `<!-- ARYA-TWEAK -->` for Arya to
edit.

### Review comments (dev only)

Under `npm run dev`, select text or click a paragraph on any post to leave a
comment; they're saved to `review/comments.json` (gitignored). The route is a
`*.dev.ts` file that `next.config.ts` only picks up in development, so
production builds have neither the route nor the tool.

## green wave

Can traffic lights that only look at their own queues produce a green wave on
their own? A small traffic simulation, five signal controllers (including
max-pressure+, a fix for the textbook rule), one Toronto corridor.

```
npm run data:cliff     # recompute data/green-wave/cliff.json
npm run data:toronto   # rebuild data/green-wave/spadina.json from the committed counts
npm run experiment     # rerun the experiment into data/green-wave/experiment.json (~3 min)
```

- `lib/green-wave/sim`: Nagel-Schreckenberg cells (`sim.ts`), the corridor
  (`network.ts`), Webster timing (`webster.ts`), the controllers
  (`controllers/`), scenarios and metrics (`scenario.ts`), and the platoon
  ratio (`analysis.ts`).
- `lib/green-wave/cliff.ts`, `game.ts`, `ring.ts`: the single intersection,
  the be-the-light game, and the ring road, all on the same sim.
- `components/green-wave`: the cliff (`cliff/Cliff`), be the light
  (`cliff/BeTheLight`), the phantom jam (`PhantomJam`), tune the wave
  (`wave/Tuner`), and the time-space diagram (`wave/TimeSpace`).
- `docs/green-wave/FINDINGS.md`: what the experiment found, with the numbers.

Traffic counts are from the City of Toronto's open data; see
`data/green-wave/README.md`. Contains information licensed under the Open
Government Licence – Toronto. Lane counts © OpenStreetMap contributors, ODbL.
