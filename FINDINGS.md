# Findings, phase 1

Real numbers from `data/experiment.json` (`npm run experiment`) and
`data/cliff.json` (`npm run data:cliff`). Notes for the write-up, not the
write-up itself.

## Setup in one paragraph

Spadina Avenue, eight signals from Fort York Blvd to College St (2.0 km),
demand from the City of Toronto's counts on Wed 23 Apr 2025, per lane. Single
lane each way, no turns. Nagel-Schreckenberg cells (7.5 m, 1 s, vmax 54 km/h,
p = 0.1), 3 s amber + 1 s all-red at every change. Free-flow corridor trip:
about 205 s. Each point: 8 seeds, 15 min warm-up, 60 min measured, demand held
at that hour's average.

Controllers: **fixed** (Webster cycle on the busiest light, all lights start
together), **green wave** (same timing, offsets for northbound at free speed;
northbound is the busier direction all day), **actuated** (min 6 s, max 40 s,
gap-out on a 37.5 m detector), **max-pressure** (Varaiya: stopped queue in
minus stopped queue out, re-decided each second after a 6 s minimum green).

Wave measure: the HCM **platoon ratio** at lights 2 to 8: arrivals on green
divided by what chance would give (the light's green share). 1 = lights ignore
each other, above 1 = a wave, below 1 = cars arrive on red.

## 1. Does max-pressure form waves? No. It forms anti-waves.

Platoon ratio, day average (14 hours):

| controller   | northbound | southbound |
|--------------|-----------:|-----------:|
| fixed        | 0.90 | 1.27 |
| green wave   | **2.51** | 0.77 |
| actuated     | 1.40 | 1.48 |
| max-pressure | **0.76** | **0.79** |

Max-pressure is below 1 in both directions in every one of the 14 hours
(0.68 to 0.90). Cars reach its lights on red more often than chance. The
mechanism: it only counts cars that are standing still, so it can't see a
platoon until the platoon has stopped. It turns green after the cars arrive,
by construction.

Exploratory check (4 seeds, peak hour, not in experiment.json): if the same
rule counts every car on the link (moving too), the platoon ratio flips to
1.28, so it does start to form weak waves. But with the downstream term also
counting moving cars, delay doubles (16.1 → 31.5 s) because a busy road ahead
looks "backed up" to it. Dropping the downstream term entirely: 1.28 and 16.4 s.

## 2. The hand-tuned wave works, for one direction

Day average, vs plain fixed-time with no offsets:

| | fixed | green wave |
|---|---:|---:|
| northbound trip | 294 s | **225 s** (-23%) |
| northbound stops/trip | 6.35 | **2.16** |
| southbound trip | 273 s | 291 s (+7%) |
| southbound stops/trip | 4.88 | 6.47 |
| delay, every car | 17.2 s | 13.4 s |

Band score (no stop at all, end to end) is 8.6% northbound with the wave and
0% for everything else. With side streets at a quarter of measured demand the
wave carries 31.6% of northbound cars through all eight lights without a stop.

## 3. Actuated wins overall

Day average delay per car (all cars, side streets included):
actuated **8.9 s**, green wave 13.4 s, max-pressure 13.9 s, fixed 17.2 s.
Actuated is best in every hour and in every side-street scale. It's also the
only controller with a platoon ratio above 1 in both directions (1.40 / 1.48):
its detector sees cars about 2.5 s before the stop line, so it holds the green
for arriving platoons. Trip times 240 s / 237 s, about 35 s over free flow.

## 4. Where max-pressure wins and loses

- Beats plain fixed-time on delay in every hour (13.9 vs 17.2 s average) and
  on side streets (7.6 vs 8.8 s).
- Loses to actuated everywhere, and to the green wave on northbound trips
  (267 vs 225 s).
- Worst when side streets are quiet: at a quarter of measured side demand its
  delay is 26.9 s (fixed 22.5, actuated 13.1). Spadina's downstream queues
  cancel its upstream ones, so a single stopped car on a side street outweighs
  the main street. The side streets drain off the map and never cancel.
- At double side demand it falls apart on the main street: northbound trip
  530 s, 13.2 stops (actuated 284 s).

## 5. The Cliff (one intersection, 60/40 main/side)

Mean delay per car, 8 seeds, one hour:

| demand Y | fixed | actuated | max-pressure | Webster formula |
|---:|---:|---:|---:|---:|
| 0.50 | 10.2 | 6.7 | 10.3 | 12.1 |
| 0.70 | 16.4 | 10.7 | 22.4 | 21.0 |
| 0.80 | 23.8 | 15.1 | 59.2 | 32.9 |
| 0.85 | 30.9 | 19.2 | 172.9 | 45.4 |
| 0.90 | 35.9 | 25.8 | 239.8 | 83.2 |
| 1.00 | 55.4 | 111.4 | 419.9 | n/a |

Max-pressure goes over the edge first, around Y = 0.75 to 0.8: with a 6 s
minimum green it switches so often that the 4 s of amber and all-red per change
eats its capacity. Its proof assumes switching is free. Exploratory check at
one intersection: a 20 s minimum moves its cliff out (Y = 0.9: 36.5 s with a
20 s minimum vs 241 s with 6 s). On the corridor a longer minimum does not help
(peak-hour delay 16.1 s at 6 s, 22.5 s at 20 s, 30.5 s at 30 s).

The sim tracks Webster's formula closely at low demand and beats it near
capacity because the sim's fixed plan is capped at a 120 s cycle and arrivals
are Bernoulli, not the formula's assumptions.

## Caveats to say out loud

- No turns, one lane, no pedestrians, no streetcar, no right turn on red.
- Per-lane demand uses an approximate lane count per approach.
- Stops are generous: Nagel-Schreckenberg's random slowdown makes queues
  stop-and-go, so stops per trip are high for everyone. Band score is harsh
  for the same reason, and because the first light catches random arrivals.
- Max-pressure is the textbook version with one knob (6 s minimum green). Known
  fixes exist (capacity-aware, position-weighted backpressure); none tried.
