# writing

Arya Patel's writing: questions I got curious about, each worked out with a
small simulation and written up as a post with live figures you can play with.
One Next.js site, one post per route.

| route | post | question |
|---|---|---|
| `/` | the index | |
| `/green-wave` | green wave | Can traffic lights find the green wave on their own? |
| `/sliding-doors` | sliding doors | How do pickleball rallies really get won? |
| `/iphone-photos` | almost good | How do you take really good iPhone photos? |
| `/little-person` | the little person | Why is it so embarrassing to say I want to be great? |

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

### Inline edits (dev only)

Under `npm run dev`, hit **edit** (next to comments) or press **E** (again to
finish; ignored while typing), click a dotted-underlined
paragraph or heading, change the words, then click away or press enter (esc
undoes). `app/api/edit/route.dev.ts` writes the new words into that post's
`app/<post>/page.tsx` and hot reload shows them. Only blocks that are plain
text (no links or emphasis inside) and whose words appear exactly once in the
page's source as a whole JSX text are editable. Same `*.dev.ts` gating as the
comments, so production has neither. Characters JSX text can't hold as typed
(`" ' & < > { }`) are saved as HTML entities, so they render exactly as typed.
If a save fails, the block keeps your words, turns red, and the reason shows
right under it.

Hovering or focusing an editable block shows **× delete**, which (after a
confirm) removes the whole element, tag and all, from `page.tsx`. Section
headings are editable too: they write back to `<Section title="…">` and to the
matching `{ id, title }` line in the contents list. **× delete heading** removes
only the title and its contents line; the section's paragraphs stay.

**+ image** by any block picks a file, asks for alt text and an optional
caption, copies the file into `public/<post>/` under a lowercase-dashed name,
and adds `<Picture src="…" alt="…" width={…} height={…} />`
(`components/shared/Picture.tsx`) right after that block (after a heading means
the top of its section). Hovering an image (dashed outline) shows **full /
right**: right writes `side="right"`, which puts the image in the right margin
on screens 1280px and wider, without changing the text's width or moving the
text below. **× delete** on an image removes the tag; its file stays in
`public/`.

The right margin is a free column. Hovering it shows **+ image here** at that
height, and margin images drag up and down. Either way a margin image is stored
as the block it starts beside plus a pixel offset: the tag goes right after that
block in the source, with `offset={N}` meaning its top sits N px below that
block's top (negative is above, no prop is 0). Dropping it lower or higher picks
whichever block's top is the last one at or above the image's top. One margin
image per block. Under 1280px the offset is ignored and the image sits right
after that block at text width.

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

## sliding doors

How do pickleball rallies really get won? A pretend doubles court where every
shot is a choice plus a roll of the dice, tuned to published 4.0-level stats,
then replayed from any moment to see which decisions actually matter.

```
npm run pickleball:calibrate    # the model's stats next to the published ones
npm run pickleball:experiment   # rerun into data/pickleball/results.json (~1 min)
```

- `lib/pickleball`: the court (`court.ts`), the tuned odds (`params.ts`), one
  rally shot by shot (`rally.ts`), the "sensible 4.0" players and the habit
  variants (`policy.ts`), the calibration stats (`stats.ts`), replays with
  shared seeds and decision costs (`value.ts`), and whole games with side-out
  scoring (`game.ts`). `calibration.test.ts` holds the model to the published
  ranges.
- `components/pickleball`: the Rewind demo (`Rewind.tsx`, drawing in
  `court.ts`, playback in `play.ts`, replays in `ghosts.worker.ts`), the
  no-man's land chart (`NoMansLand.tsx`) and the decision and habit tables
  (`Ledger.tsx`).
- `docs/pickleball/CONCEPTS.md`: the research notes and the three pitches.
  `docs/pickleball/FINDINGS.md`: what the experiment found, with the numbers.

The real-world stats and their sources are cited in the post's notes. Every
simulated number in the post is read from `data/pickleball/results.json`.

## almost good

How do you take really good iPhone photos? The usual tips checked against
published research and Apple's own guides, taught with five small drawings:
a framing grid (Palmer et al.'s centre and inward biases), a ray-marched
plaster head under a movable light, a tap-to-expose meter, background blur
from the thin-lens formula, and a face drawn from different distances (Ward
et al.'s selfie geometry). The math is in `lib/iphone-photos/` (`npm test`
covers it); every source and the claim it supports is in
`docs/iphone-photos/SOURCES.md`.

Arya's own photos are in `public/iphone-photos/story/`, resized to 1600 px
and with all metadata (including location) stripped. Strip any new photo the
same way before adding it.
