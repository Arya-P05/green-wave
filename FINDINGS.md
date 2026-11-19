# Findings

Real numbers from `data/experiment.json` (`npm run experiment`) and
`data/cliff.json` (`npm run data:cliff`). Notes for the write-up, not the
write-up itself.

## Setup in one paragraph

Spadina Avenue, eight signals from Fort York Blvd to College St (2.0 km),
demand from the City of Toronto's counts on Wed 23 Apr 2025, per lane, with
every approach's lane count read from OpenStreetMap (way ids in
`scripts/toronto.ts`). Single lane each way, no turns. Nagel-Schreckenberg
cells (7.5 m, 1 s, vmax 54 km/h, p = 0.1), 3 s amber + 1 s all-red at every
change. Free-flow corridor trip: about 205 s. Each point: 8 seeds, 15 min
warm-up, 60 min measured, demand held at that hour's average.

Controllers: **fixed** (Webster cycle on the busiest light, all lights start
together), **green wave** (same timing, offsets for northbound at free speed;
northbound is the busier direction all day), **actuated** (min 6 s, max 40 s,
gap-out on a 37.5 m detector), **max-pressure** (Varaiya 2013: stopped queue
in minus stopped queue out, re-decided each second after a 6 s minimum green),
**max-pressure+** (the same, but upstream counts every car on the link,
moving or not, and every green lasts at least 10 s).

Measures:
- **Stops per drive** (the headline): how many times a car driving the whole
  corridor comes to a halt. Eight lights, so 0 is a perfect wave. Can exceed 8
  in stop-and-go queues.
- **Trip time**, end to end, per direction.
- **Delay per car**: every car, side streets included, against free speed.
- **Platoon ratio** (HCM): at lights 2 to 8, arrivals on green divided by what
  chance would give (the light's green share). 1 = lights ignore each other,
  above 1 = a wave, below 1 = cars arrive on red.

## 1. Textbook max-pressure makes you stop at almost every light

Day average (14 hours):

| controller    | stops nb | stops sb | trip nb | trip sb | platoon nb | platoon sb | delay | side delay |
|---------------|---:|---:|---:|---:|---:|---:|---:|---:|
| fixed         | 5.49 | 4.52 | 272 s | 261 s | 0.93 | 1.16 | 18.1 s | 9.8 s |
| green wave    | **1.82** | 5.84 | **222 s** | 273 s | **2.13** | 0.80 | 14.3 s | 9.8 s |
| actuated      | 4.74 | 4.30 | 236 s | **234 s** | 1.38 | 1.40 | **9.3 s** | **5.5 s** |
| max-pressure  | **7.30** | **6.85** | 266 s | 261 s | **0.77** | **0.78** | 15.3 s | 7.2 s |
| max-pressure+ | 4.95 | 4.39 | 258 s | 253 s | 1.24 | 1.29 | 16.1 s | 9.8 s |

Max-pressure's platoon ratio is below 1 in both directions in every one of the
14 hours (0.68 to 0.89). Cars reach its lights on red more often than chance.
The mechanism: it only counts cars that are standing still, so it can't see a
platoon until the platoon has stopped. It turns green after the cars arrive,
by construction.

## 2. The fix: count the cars that are coming

Max-pressure+ changes two things. Upstream it counts every car on the link
(Varaiya's own model counts vehicles on a link, not stopped vehicles; cf.
position-weighted backpressure, Li & Jabari 2019). It holds every green at
least 10 s, because the proof assumes switching is free and here each switch
costs 4 s (cf. capacity-aware backpressure, Gregoire et al. 2015). Downstream
it still counts only stopped cars; counting moving cars there too made peak
delay double in exploratory runs (16.1 → 31.5 s) because a busy road ahead
looks backed up.

Day averages, textbook → plus:
- stops per drive 7.30 → 4.95 northbound, 6.85 → 4.39 southbound (-1/3);
- platoon ratio 0.77 → 1.24 and 0.78 → 1.29: anti-waves become weak waves,
  above 1 in every hour (1.19 to 1.32);
- trip times 266 → 258 s and 261 → 253 s;
- but delay per car 15.3 → 16.1 s, because side-street delay rises 7.2 → 9.8 s.
  Plus is better than textbook on delay in only 1 of 14 hours.

So the fix trades side-street waiting for main-street flow. It's what makes a
drive down Spadina feel better, not a free lunch.

The minimum green alone doesn't do it (peak hour, textbook rule):

| min green | delay | trip nb | stops nb | platoon nb |
|---:|---:|---:|---:|---:|
| 6 s | 18.1 s | 273 s | 7.71 | 0.78 |
| 10 s | 18.8 s | 269 s | 7.49 | 0.87 |
| 15 s | 23.5 s | 292 s | 7.86 | 0.64 |
| 20 s | 25.8 s | 301 s | 8.02 | 0.72 |
| 30 s | 35.6 s | 338 s | 9.20 | 0.55 |

The change that matters is what it counts.

Variants tried and dropped (4 seeds, peak hour, not in experiment.json):
dropping the downstream term (stops 5.11, but then it isn't max-pressure);
cyclic max-pressure, Le et al. 2015 (delay 21.5 s).

## 3. The hand-tuned wave works, for one direction

| | fixed | green wave |
|---|---:|---:|
| northbound trip | 272 s | **222 s** (-18%) |
| northbound stops | 5.49 | **1.82** |
| southbound trip | 261 s | 273 s (+5%) |
| southbound stops | 4.52 | 5.84 |
| delay, every car | 18.1 s | 14.3 s |

Band score (no stop at all, end to end) is 11.3% northbound with the wave and
under 0.5% for everything else. A wave is a choice of direction.

## 4. Actuated wins overall

Best delay in every one of the 14 hours and at every side-street scale. Its
detector sees cars about 2.5 s before the stop line, so it holds the green
for arriving platoons: platoon ratio 1.38 / 1.40, both directions. Max-pressure+
nearly matches it on stops (4.95 / 4.39 vs 4.74 / 4.30) but not on delay.

## 5. Side-street sweep (peak hour, side streets × 0.25 to × 2)

Delay per car:

| side × | fixed | green wave | actuated | max-pressure | max-pressure+ |
|---:|---:|---:|---:|---:|---:|
| 0.25 | 23.1 | 17.7 | 13.8 | 30.8 | 25.3 |
| 1 | 18.4 | 16.8 | 10.8 | 18.1 | 18.0 |
| 2 | 41.4 | 33.0 | 16.7 | 34.6 | 22.6 |

Northbound trip at × 2: fixed 463 s, green wave 290 s, actuated 259 s,
max-pressure 477 s (12.5 stops), max-pressure+ 355 s (8.3 stops).
Textbook max-pressure is worst when side streets are quiet: one stopped car on
a side street outweighs Spadina, whose downstream queues cancel its upstream
ones, while side streets drain off the map and never cancel.

## 6. The Cliff (one intersection, 60/40 main/side)

Mean delay per car, 8 seeds, one hour:

| demand Y | fixed | actuated | max-pressure | max-pressure+ | Webster formula |
|---:|---:|---:|---:|---:|---:|
| 0.50 | 10.2 | 6.7 | 10.3 | 10.4 | 12.1 |
| 0.70 | 16.4 | 10.7 | 22.4 | 14.0 | 21.0 |
| 0.80 | 23.8 | 15.1 | 59.2 | 20.7 | 32.9 |
| 0.85 | 30.9 | 19.2 | **172.9** | 30.6 | 45.4 |
| 0.90 | 35.9 | 25.8 | 239.8 | 63.7 | 83.2 |
| 1.00 | 55.4 | 111.4 | 419.9 | 219.4 | n/a |

Textbook max-pressure goes over the edge first, around Y = 0.75 to 0.8: with
a 6 s minimum green it switches so often that the 4 s of clearance per change
eats its capacity. Max-pressure+ moves the edge out to about 0.9, level with
fixed-time up to 0.85. At low demand it is slightly worse than textbook
(8.3 vs 5.4 s at 0.2), the price of a 10 s minimum.

The sim tracks Webster's formula closely at low demand and beats it near
capacity because the sim's fixed plan is capped at a 120 s cycle and arrivals
are Bernoulli, not the formula's assumptions.

## Caveats to say out loud

- No turns, one lane, no pedestrians, no streetcar, no right turn on red.
- Lane counts are OpenStreetMap's, read off the approach way nearest each
  light; a two-way street with only `lanes` tagged is split evenly.
- Stops are generous: Nagel-Schreckenberg's random slowdown makes queues
  stop-and-go, so stops per trip are high for everyone. Band score is harsh
  for the same reason, and because the first light catches random arrivals.
