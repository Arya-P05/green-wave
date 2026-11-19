# sliding doors: findings

Everything below is from `npm run pickleball:experiment` (seeded, so it
reproduces exactly) and lives in `data/pickleball/results.json`. It's a model:
the odds are made up and then tuned to a handful of published stats, so read
the sizes as "bigger" and "smaller", not as facts about anyone's game.

## Is it pickleball? (200,000 rallies, sensible 4.0 players)

| measure | published | model |
|---|---|---|
| serving team wins the rally | 42–46% | 43.2% |
| returns that land deep | about 50% | 50.9% |
| returning team wins after a deep return | 67–70% | 63.8% |
| … after a short return | 47–51% | 53.9% |
| returning team wins vs third-shot drop / drive | 62% / 60% | 59.2% / 57.3% |
| third shot fails (drop / drive) | 22–33% / 18–33% | 30.0% / 38.6% |
| shots per rally | 7.0–7.9 | 7.1 |
| serving team wins once both are at the kitchen | 47–53% (pros) | 45.5% |

Misses, stated in the post too: the deep return is worth less than in real
data (a 10-point gap against about 20), third-shot drives fail more often than
the published range, and the serving team reaches the kitchen line in 79% of
rallies that last five shots, which is probably more than real 4.0 play.

## Which decisions give away the most (2,000 rallies, 240 replays per option)

Win chance given away versus the best option, in points out of 100. Split-half:
the best option is picked on half the replays and scored on the other half.

| decision | per rally | each time | times a rally |
|---|---|---|---|
| at the kitchen line (dink, speed up, block, counter) | 7.7 | 2.1 | 3.7 |
| the third shot (drop, drive or lob; then in or not) | 2.3 | 2.6 | 0.9 |
| the return (deep or short) | 1.7 | 1.7 | 1.0 |
| no-man's land (reset, drive or lob; then in or not) | 1.5 | 3.1 | 0.5 |

Kitchen decisions are individually small but frequent, and add up to more than
the other three combined (5.4). Of the third shot's 2.6, about 0.8 is moving in
or staying back; the rest is what to hit.

## Habits (one team changes one habit; 200,000 rallies, then 100,000 games to 11)

| habit | rallies won | games won | change |
|---|---|---|---|
| at the kitchen, attack every ball at net height | 51.8% | 60.9% | +10.7 |
| at the kitchen, never speed up a ball below the net | 51.4% | 58.5% | +8.3 |
| aim every return deep | 51.0% | 55.7% | +5.5 |
| always drive the third | 50.8% | 54.9% | +4.7 |
| always move in after every shot | 50.6% | 53.6% | +3.4 |
| always follow a drive in | 50.3% | 51.9% | +1.7 |
| in no-man's land, always reset soft | 50.3% | 51.8% | +1.6 |
| a sensible 4.0 player (baseline) | 50.0% | 50.2% | 0 |
| never follow a drive in | 49.8% | 48.9% | −1.3 |
| always drop the third | 49.8% | 48.9% | −1.3 |
| in no-man's land, always drive | 49.5% | 47.1% | −3.1 |
| just get every return in | 48.9% | 43.6% | −6.6 |
| at the kitchen, keep dinking even balls at net height | 48.5% | 41.2% | −9.0 |
| stay back after every shot | 48.5% | 41.1% | −9.1 |

Drop versus drive is close to a wash (the drive slightly ahead, as in Gandhi's
4.0 data). Side-out scoring turns a 1–2 point rally edge into 5–10 points of
games.

## No-man's land (8,000 replays per spot)

Your team at one depth, theirs at the kitchen line, your shot:

- a soft ball at your feet: 48% at the kitchen line, falling steadily to 26%
  at the baseline. Every step forward helps.
- a hard ball at you: about 29–31% anywhere in front of 17.5 ft, a little
  better (36%) just behind it where the ball can bounce, then down to 27% at
  the baseline.

## The story rally (seed 43, rally 1 in the demo)

You serve, they return short, you drive the third and follow it in: your
chance goes from 49% before the third to 65% after it, and no other option
there did better. The point slips at shot 9: they speed it up and you block;
a counter wins 37% of the replays instead of 29%.

## The biggest assumption

How hard a speed-up is to keep in, and to handle, drives most of the kitchen
results (`params.ts`: `hard.err*`, `soft.errPace`). Change those and the sizes
will move; I haven't run a proper sensitivity check on the ordering.
