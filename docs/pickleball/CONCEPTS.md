# Pickleball: concepts (Phase 1: research + pitch)

**The question (fixed):** *How do pickleball rallies really get won? Model shot choice and court position, and find which decisions matter most.*

**Format:** a story-style showcase post like Green Wave (devp.ca/synthetic-warmup, ishaand.com/shadow): personal, deep, intentional, building toward **one** great interactive **simulation** demo (not real footage). Arya has no data from her own games, so the model is a simulation calibrated to published aggregate stats. Every number below is attributed to a source. Anything shaky is marked **[uncertain]**.

---

## 1. What the research says

### Court + rules that matter for a model
- Court is 20 × 44 ft. The non-volley zone ("kitchen") runs 7 ft back from the net on each side, and you can't volley while standing in it. The **two-bounce rule** means the return must bounce and the third shot must bounce, so the serving team starts pinned at the baseline while the returning team can walk in behind the return. This asymmetry drives everything below.
- The space between the baseline and the kitchen is the **transition zone** ("no-man's land"). Coaching consensus says you should move through it, not live in it.

### Who wins rallies (serve vs return)
| Finding | Number | Source |
|---|---|---|
| Serving team rally win %, 107 pro APP/PPA games to 11 (singles + doubles) | 45.7% overall; MD 41.5%, WD 44.4%, XD 44.3% | Reddit charting by a fan, r/Pickleball (x07ib1). **[uncertain: amateur charting, not peer reviewed]** |
| Receiving pairs, 2,344 points, 2023 PPA men's doubles SF/F | receivers win **55.5%** | Peer-reviewed: "Technical–tactical behaviour and rally structure in professional men's doubles pickleball" (Int. J. Sports Sci. & Coaching, doi 10.1177/17479541261436986) |
| Amateur doubles, 510 serves | serving team ~42% | Himawan et al. 2025, J. Racket Sports Performance & Science, as cited by Rally Trace. **[I didn't read the primary paper]** |
| First-serving team advantage (Markov chain over a whole game) | essentially zero: very slightly negative to 11, very slightly positive to 15 | DeFord & Ethier, arXiv 2303.02942 / AMS Contemporary Math 844 |

→ **The baseline fact:** the serving team is the underdog in every rally, at roughly 42–46% depending on level and division.

### Return depth: the strongest published signal
Jayan Gandhi (advised by Dr. Scott Powers, Rice), ~2,000 rallies, 150+ teams, DUPR 2.5–5.0+, The Dink, Oct 2024:
- Share of returns hit deep (far third of the court): 37% at 2.5–3.0, rising to about **50% at 3.5+ and staying there, even for 5.0+**.
- Returning team win %, **deep vs shallow return**: 3.5–4.0: 70 vs 51; 4.0–4.5: 67 vs 49; 4.5–5.0: 70 vs 50; 5.0+: 70 vs 47 (all p < 0.001). Below 3.5 the trend points the same way but isn't significant.
- **A shallow return erases the returner's built-in advantage, so the rally becomes a coin flip.**
- pklmart's study of ~3,000 rallies (4.5, 5.0, pro) also concludes deeper returns are better and down-the-line returns are slightly better, with pace unclear. Return error rates: 5.2% at 4.5–5.0, **3.0% for pros**.

### Third-shot drop vs drive: the famous argument shows no measurable difference
- Gandhi (same study): **no difference at any DUPR level**. Returning team win % vs drive / drop at 5.0+: 58 / 57; at 4.5–5.0: 58 / 64 (not significant). Splitting by return depth doesn't change it. **Third-shot failure rate is ≥ ~20% for both shots at every level** (5.0+: drops ~22% including "high drop" estimates, drives 23%). At 5.0+, 61% of thirds were drops.
- Pickleball Analytics blog (Kevin, Apr 2022, 4 pro matches): serving team scored **47% with drops and 47% with drives**. About 72% of drops were "effective," about 8 in 9 drives landed in, and roughly 5 of 8 thirds were drops. **[small sample]**
- Jim Ramsey (PPA Tour recap, 2024 Orange County Cup, 9 matches), as cited by Pickleball Insiders: only **17%** of rallies with a third-shot drive ended on shot 3 or 4. The drive "buys a fifth ball," and of 309 fifth-shot chances, **66% were drops**. **[secondary citation; I didn't read the PPA original]**
- calebhyun.github.io point analysis (pklmart API, 2,500+ pro rallies, 22k shots) found unforced errors cluster in the first 5–6 shots and winners mostly come after about 9 shots. Their model gave a slightly higher serving-team win probability for drives, and *first to speed up* was a meaningful feature. **[student project; direction only]**

→ The drop-vs-drive argument mostly cancels out. What seems to matter is **what the third shot buys you: time to move forward, and a better 5th shot**.

### Kitchen line / transition
- Coaching consensus: the team that controls the kitchen line wins most points. Widely repeated figures say the team at the kitchen first wins "~70%" of rallies, and that teams that fail to get there lose 65% of the time across "34,000 rallies" (Pickleball Globe, quoting a video). **[uncertain: no primary dataset found; treat as folklore to test, not fact]**
- The Dink, 2019 vs 2022 pros: the serving team "achieved neutrality" (both players reached the kitchen safely) **70% of the time at the 2019 US Open, versus 56–58% in two 2022 events**. When neutrality was reached, the serving team won ~47–53%, basically even. Rallies with neutrality supplied 63–82% of serving-team points. **This is the cleanest published number on transition: once you get in, it's a coin flip. The fight is getting in.**
- PB Vision defines "Kitchen Arrival" as a metric (serving team qualifies after 4 non-fault shots). Real Clear Stats reportedly found that a stricter version (KAP) correlates with DUPR **[uncertain: mentioned on PB Vision's roadmap board, data not public]**.
- DUPR blog: the reset shot from transition is "what separates 3.5 from 4.0–4.5."

### Rally length and how points end
- Average rally length (Gandhi): 6.4 shots at 2.5–3.0, rising to **7.9 at 4.5+**.
- Pro men's doubles 2023 (peer-reviewed paper above): **35.2% of rallies are ≥ 13 shots**. Short and medium rallies favor receivers, long ones favor servers. **Rally length was the strongest predictor of the outcome**, ahead of hitting zone. Most decisive shots come from mid-court "zone 2." Groundstrokes go with unforced errors, volleys with winners.
- Singles notational studies (MDPI Applied Sciences 2024, men's singles; Functional Morphology & Kinesiology 2025, women's singles): **unforced errors end ~58% (men) and ~63.7% (women) of points.** Singles only, but the takeaway carries over: **most points are lost, not won**.
- Speed-ups (doubles): PPA match stat wraps show the team that speeds up first winning anywhere from 41% to 77% depending on the match **[single-match numbers; huge variance]**.

### Score → game (useful for the "so what")
- DeFord & Ethier's absorbing Markov chain maps rally win probabilities to game win probability under side-out scoring. Rally Trace's model: a team winning 47% of its serve rallies vs 45% wins **55.5% of games**. Small rally edges compound into game edges.
- The Dink (82 PPA games, 2024): first to 4 points wins 89% **[small N]**.

### Takeaways for the model
1. The serve-and-return structure gives the returning team a built-in advantage of roughly 55/45.
2. **Return depth is the biggest published single lever** (~70% vs ~50%).
3. Third-shot type barely matters on its own. Execution (~20% failure) and what happens next matter.
4. Once all four players are at the kitchen, rallies are roughly even. The value is in *getting there*.
5. Most points end on errors, so risk control is a decision too.

These five are calibration targets for the sim. The interesting part is what the sim says **between** them: which in-rally decisions (advance or hold, reset or counter, dink or speed up, target which player) carry the most win probability.

---

## 2. The shared engine (all three pitches use it)

**Agents:** 4 players (doubles), each with a continuous (x, y) position on a 20 × 44 court and a max speed. Position is summarized into zones for decisions and value tables: depth {baseline, deep transition, mid transition, kitchen line} × width {left, middle, right}.

**Ball:** each shot is an event, not physics. It has a target point, a **height at the net/contact** (low / medium / high = "pop-up"), a speed class (soft / medium / hard), and a flight time. Flight time is the key mechanic: soft shots (drop, dink, lob) buy time to move, and hard shots (drive, speed-up) take it away. Players move toward their intended spot during each flight, so **shot choice directly creates court position**. The two-bounce rule and the kitchen volley rule are enforced.

**Shots:** serve, return (deep/short, line/middle), drive, drop/reset, dink, speed-up, lob, punch volley, put-away. Each has an outcome distribution {error, pop-up given, neutral, pressure, winner} that depends on:
- hitter depth (a drop from deep transition is harder than one from near the kitchen),
- incoming ball height and speed (low/fast is hard, a high ball is attackable),
- whether the ball is taken as a volley or off the bounce, and a per-player skill multiplier.

**Policy:** a parameterized decision rule per player: P(drop vs drive | depth, incoming ball), advance / split-step / hold logic, patience (dinks before speeding up), target (middle, weaker player, feet), and when to lob. Default policy = "sensible 4.0 amateur."

**Calibration (honest):** tune the free parameters so the *default* sim reproduces the published aggregates: serving team ~44% rally wins, deep returns ~50%, return-team win ~70% after deep vs ~50% after shallow, third-shot failure ~20%, mean rally ~7–8 shots, serving team reaching the kitchen safely ~55–70%. The post says plainly that it's a toy world tuned to real stats, and that its conclusions are "in this model."

**Computing "which decisions matter most":**
1. **State value V(s)** = P(serving team wins the rally | state). State = 4 player zones + who's hitting + incoming ball class + shot index bucket. Estimate it by Monte Carlo (play out ~1–5M rallies offline, tabulate) or exactly with value iteration on the discretized chain (state space ≈ 10⁴–10⁵ after symmetry, fine in Node).
2. **Action value Q(s,a)** for every option at every decision.
3. **Leverage of a decision** = max_a Q(s,a) − min_a Q(s,a): how much win probability is on the line at that moment (like "leverage index" in baseball or point importance in tennis). **Mistake cost** = Q(s, best) − Q(s, chosen).
4. **Aggregate over real play:** weight by how often each state happens under the default policy and sum by decision family (return depth, third type, advance-or-hold after the third, reset vs counter in transition, dink patience, speed-up timing, target choice). The result is "win probability at stake per rally" per family, which is literally *which decisions matter most*.
5. **Counterfactual policy swaps:** change one rule (e.g. "always hold at the baseline after a drive"), rerun 100k rallies, report Δ rally win %, then turn that into Δ **game** win % with the DeFord–Ethier side-out chain.
6. **Skill sensitivity:** Δ game win % per 10% fewer errors on each shot. That answers the personal question "what should I practice?"

---

## 3. Three pitches (same question, different arcs and hero demos)

### Pitch A: "Sliding Doors" (every rally is a tree of rallies that didn't happen)

**Story arc.** It opens on a point Arya lost last weekend that she keeps replaying in her head: she drove the third, it came back at her feet, and she popped it up. Was it the drive? Was it standing still afterwards? Was the point already gone at the return? She realizes she has no way to know, because she only ever sees the one rally that happened. So she builds a world where she can see all of them: a simulator of four little players, calibrated to real stats, where any moment can be rewound and replayed a thousand times with one decision changed. She tests the famous argument (drop vs drive) and finds that, like the real data says, it barely moves the needle. **Hypothesis the sim could plausibly reveal:** the decisions that carry the most win probability are the boring ones right *after* the shot everyone argues about, like whether the third-shot hitter moves forward or freezes, and whether the fifth is a reset or another drive. The flashy put-away almost never matters, because by then the point is already decided. The post ends with a ranked "what's actually at stake per rally" chart and what she's going to practice.

**What the sim models.** The shared engine, plus a per-shot **win-probability line** (V after every shot) and fast branching: from any frozen state, run N ghost rallies per alternative action.

**Which decisions matter.** Leverage index per decision family (§2.3–4) shown as the closing chart. The rewind demo is the intuitive version: the size of the fan-out is the leverage.

**Hero demo: "Rewind."** A top-down court. Four dot-players play a rally at a readable pace, with the ball drawn as an arc and its shadow, and a win-probability line ticking along underneath like an election needle. **The reader can pause at any shot**, then tap a player to pick a different choice from a small radial menu (drop / drive / lob, step in / hold, dink / speed-up). The moment they pick, **200 faint ghost rallies fan out** from that instant, each one a translucent trail. They resolve into a split bar ("your choice: 61% → 48%") and the needle redraws. A "find the moment" mode asks: *this rally was lost. Find the decision that cost the most.* The reader scrubs, guesses, and is told the true answer with the Δ.
- *Why it's fun:* it's a puzzle and a time machine, with instant, visible consequences. The ghost fan-out is a beautiful image.
- *How it makes the point:* readers feel that leverage is concentrated in a few moments, and usually not the ones they'd guess.

**Feasibility (Next.js + canvas, no heavy libs).** The engine is pure TS in `lib/` with `node --test`, the same as green-wave. 200 ghost rallies × ~10 shots is thousands of events, well under 10 ms in a Web Worker, so branching is live with no precompute. A V table (optional, for the needle) is precomputed by `scripts/` into JSON of about 100–300 KB. Ghost trails are low-alpha strokes on an offscreen canvas. Risk: medium. The radial menu and scrubber UX need polish, and the "find the moment" answer needs a deterministic seed per rally.

---

### Pitch B: "No-Man's Land" (a map of where points are won)

**Story arc.** Arya's coach says the same thing every week: *get to the kitchen.* She does try, but she always seems to be caught halfway when the ball comes back hard. She wants to know if "get to the kitchen" is actually true, and if so, *how much* each step is worth. The research half-agrees: once all four players are at the line, rallies are roughly a coin flip (The Dink: ~47–53%), so the value isn't *being* there, it's *getting* there. She builds the sim and computes, for every spot on the court and every incoming ball, the probability that her team wins from there. The result is a heat map of the court. **Hypothesis:** the court isn't a smooth gradient from "bad at the baseline" to "good at the kitchen." There's a **cliff**: a band of deep transition where your win probability is lower than if you'd stayed back, because you're too close to drop safely and too far to volley. The real decision isn't "go forward." It's "**never get caught moving in that band when they can attack**," which is why the drop works (it buys the time to cross it) and the drive only works if you hold back after it. The post closes with a "how many feet are worth how much" chart.

**What the sim models.** The shared engine with finer position resolution (e.g. 1-ft depth bins) and explicit split-step timing: a player who is still moving when the opponent makes contact gets an execution penalty.

**Which decisions matter.** V(position, incoming ball, opponents' positions) as the heat map. "Decision value" = ∂V/∂(step forward vs hold) at each spot, plus counterfactuals ("always advance after the third" vs "advance only behind a drop" vs "hold after drives").

**Hero demo: "Walk the Line."** A half court (Arya's side) with the opponents at the kitchen. The reader **drags her player** anywhere, and a live heat map underneath shows win probability for every spot, given the ball that's coming. Hit "play" and the opponent feeds a ball: the reader chooses her shot (drop / drive / reset) and **where to move next** by dragging a target during the ball's flight. The world plays out, and the heat map re-forms for the next ball. Toggle "what if I stayed back?" to see a ghost of herself who held position and how her rally turns out.
- *Why it's fun:* direct manipulation. You physically drag yourself into danger and watch the colors change, and the "cliff" is a real surprise to discover with your finger.
- *How it makes the point:* court position becomes a feeling, a landscape. Shot choice turns out to be a way of *buying time to move across it*.

**Feasibility.** The heat map is a precomputed grid (e.g. 20 × 22 cells × a handful of ball/opponent contexts), JSON of maybe 50–200 KB, drawn as a canvas image. Drag uses pointer events on canvas. The play mode reuses the engine live. Risk: low–medium. The trickiest part is making the precompute defensible (enough samples per cell) and keeping the visual clean (Arya has strong taste: no clutter, which she made clear with the Green Wave loop).

---

### Pitch C: "Coach the Robots" (design a player, find out who wins)

**Story arc.** Every pickleball player has a *style*: bangers, dinkers, the person who lobs everything. Arya wonders whether hers is costing her. So she turns herself into a robot: a handful of dials for how often she drives vs drops, how fast she charges the net, how patient she is in a dink rally, and when she speeds up. Then she makes the robots play each other thousands of times. She runs a round-robin "league" of styles, then lets an optimizer search for the best policy against each style. **Hypothesis:** there's no single best style. It's rock-paper-scissors, where bangers beat impatient dinkers, patient dinkers beat bangers, and lobbers punish teams that charge in. But **one dial dominates all matchups: patience**, meaning not speeding up below a certain ball height. It moves game win % more than any shot-type dial, which matches the real-world "most points are lost, not won." The post ends with Arya's own robot (her honest self-assessment) and the single dial change worth the most games.

**What the sim models.** The shared engine. Policy = ~5 sliders per team. Fast batch simulation to estimate rally and game win % between two policies, plus coordinate descent or simple evolutionary search for best responses.

**Which decisions matter.** The sensitivity of game win % to each dial (partial effects averaged over opponents), plus the payoff matrix between archetypes.

**Hero demo: "Build Your Player."** The reader sets five chunky dials for their team (Drive ↔ Drop, Charge ↔ Hang back, Patience, Speed-up trigger, Lob %) and picks an opponent archetype. They hit **Play** to watch a live rally on the court, or **Simulate 1,000** to watch a scoreboard and win-% bar fill up in real time. Badges unlock ("beat the Banger," "beat all four"), and a "coach's tip" arrow shows which dial is worth the most against this opponent.
- *Why it's fun:* it's a game. You tinker, you win, you share your build.
- *How it makes the point:* the dials that matter reveal themselves through play.

**Feasibility.** Simulating 1,000 games (~37 rallies each, per the 107-game count) is ~37k rallies, roughly 0.1–0.5 s in a Web Worker, which is fine. The UI is all custom canvas/DOM, no libs. Risk: medium. It's fun, but the answer to "which *in-rally decisions* matter" is more indirect (style-level, not moment-level), and it drifts toward "game" over "story."

---

## 4. Recommendation: **Pitch A, "Sliding Doors"**, with Pitch B's heat map as one static figure in the story

Why:
1. **It answers the exact question most directly.** "Which decisions matter most" *is* the leverage/counterfactual computation, and the demo shows it literally: change one decision, watch the future fan out.
2. **It's the most personal.** It starts from a real point she lost and replays it, the "it's personal, something I play" angle, even without footage of her games. If she later films a game, she can recreate one of her real rallies in the sim as a coda.
3. **Best "one great demo":** pause, rewind, pick a different shot, and 200 ghost rallies bloom out of that instant. It's a memorable, beautiful, Green-Wave-level hero moment, and the "find the costly moment" puzzle makes it replayable.
4. **It honors the real data instead of fighting it.** The sim reproduces "drop vs drive barely matters" and "deep returns matter," then goes further than the public data can (which decisions *between* those carry the win probability). That's the deep, intentional part.
5. **Feasible on the green-wave stack:** pure-TS engine, live Monte Carlo in a worker, canvas rendering, small precomputed JSON. No new dependencies.

Pitch B's court heat map (the "cliff" in transition, if it shows up) slots in as a static/light figure mid-story, so the post gets both the *moments* and the *places* without diluting the single hero demo.

**Suggested story beats (Pitch A):** the lost point → "I only ever see one rally" → what the data says (serve underdog, deep returns, drop = drive, neutrality is a coin flip) → building the toy world (and its honest limits) → the drop-vs-drive test reproduced → **Rewind demo** → the leverage ranking (the finding) → the court heat map → what I'm practicing now → if you want more detail on the model / calibration / sources.

**Open risks to flag before building:**
- Findings are only as good as the assumed shot probabilities, so the post must be explicit and humble about that (Arya liked "I'm by no means a traffic engineer…" in Green Wave; same tone here).
- The "70% kitchen-first" stat is folklore without a primary source, so the post shouldn't quote it as fact.
- Calibration targets mix amateur (Gandhi) and pro (PPA) data. Pick one target level (suggest **~4.0 amateur**, Arya's world, matching Gandhi's data) and say so.

---

## 5. Sources
- Gandhi, J. (advised by S. Powers, Rice). *Do Deep Returns Win More Rallies? What about Drives vs Drops?* The Dink, Oct 23 2024. https://www.thedinkpickleball.com/do-deep-returns-win-more-rallies-what-about-drives-vs-drops/
- Pickleball Insiders, *Pickleball Strategy: What the Rally Data Actually Shows* (summarizes Gandhi + Jim Ramsey's PPA OC Cup 2024 recap). https://pickleballinsiders.com/pickleball-tips-strategy/ and https://pickleballinsiders.com/third-shot-drop-or-drive-pro-strategy/
- pklmart, *What does the ideal return look like?* (~3,000 rallies, 4.5 to pro). https://pklmart.com/analysis_docs/Understanding_the_ideal_return.pdf
- Pickleball Analytics blog, *3rd Shot Charting* (Apr 2022). https://pickleballanalytics.blog/2022/04/26/3rd-shot-charting/
- The Dink, *Pro Pickleball 2019 vs 2022: Stats Reveal a Faster Game* (neutrality / kitchen arrival). https://www.thedinkpickleball.com/pro-pickleball-2019-vs-2022/
- The Dink, *Data Shows Early Lead Offers 89% Win Probability* (82 PPA games, 2024). https://www.thedinkpickleball.com/data-shows-early-lead-offers-89-win-probability/
- *Technical–tactical behaviour and rally structure in professional men's doubles pickleball* (2,344 points, 2023 PPA). https://doi.org/10.1177/17479541261436986
- *Notational Analysis of Men's Singles Pickleball*, Applied Sciences 2024. https://www.mdpi.com/2076-3417/14/19/8724
- *Technical and Tactical Performance in Women's Singles Pickleball*, JFMK 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC11755447/
- DeFord & Ethier, *Does the first-serving team have a structural advantage in pickleball?* https://arxiv.org/abs/2303.02942
- r/Pickleball, *I watched 107 professional pickleball matches…* **[fan charting]** https://www.reddit.com/r/Pickleball/comments/x07ib1/
- Rally Trace, *The pickleball stats worth tracking* (cites Himawan et al. 2025; side-out model). https://rallytrace.com/guides/pickleball-stats-worth-tracking/
- calebhyun, *How do I win a Pickleball Point?* (pklmart API, 2,500+ pro rallies). https://calebhyun.github.io/pickleball-point-analysis/
- PB Vision, terminology / Kitchen Arrival definition. https://help.pb.vision/articles/5987232-ultimate-terminology-and-definitions-guide and https://roadmap.pb.vision/p/true-kap-computation
- DUPR blog on the reset shot. https://www.dupr.com/post/over-50-of-people-dont-know-the-most-important-shot-in-pickleball
- timdellinger/pickl-metrics (Markov game simulator, reference implementation). https://github.com/timdellinger/pickl-metrics
- Pickleball Globe (source of the "34,000 rallies / lose 65%" claim). **[uncertain]** https://pickleballglobe.com/2024/06/08/why-advancing-to-the-kitchen-line-in-pickleball-is-crucial-tips-and-proven-strategies/
