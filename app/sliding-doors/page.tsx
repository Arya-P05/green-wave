import type { Metadata } from "next";
import Link from "next/link";
import { Habits, Where } from "@/components/pickleball/Ledger";
import NoMansLand from "@/components/pickleball/NoMansLand";
import Rewind from "@/components/pickleball/Rewind";
import Nerds from "@/components/shared/Nerds";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import type { Entry } from "@/components/shared/Toc";
import { PARAMS } from "@/lib/pickleball/params";
import { baseline, cal, fam, gameGain, n, pct, pct1, policy, pts, results, signed, storyPoint } from "./numbers";

export const metadata: Metadata = {
  title: "sliding doors",
  description:
    "How do pickleball rallies really get won? A small doubles simulation, tuned to real stats, that replays a point with one decision changed.",
};

const CODE = "https://github.com/Arya-P05/green-wave";

/** The published numbers the post leans on. */
const SRC = {
  gandhi: "https://www.thedinkpickleball.com/do-deep-returns-win-more-rallies-what-about-drives-vs-drops/",
  ppa: "https://doi.org/10.1177/17479541261436986",
  reddit: "https://www.reddit.com/r/Pickleball/comments/x07ib1/",
  rallytrace: "https://rallytrace.com/guides/pickleball-stats-worth-tracking/",
  neutral: "https://www.thedinkpickleball.com/pro-pickleball-2019-vs-2022/",
  markov: "https://arxiv.org/abs/2303.02942",
  pbvision: "https://help.pb.vision/articles/5987232-ultimate-terminology-and-definitions-guide",
};

const SECTIONS: Entry[] = [
  { id: "point", title: "the point" },
  { id: "data", title: "what the data says" },
  { id: "court", title: "a pretend court" },
  { id: "real", title: "is it pickleball?" },
  { id: "rewind", title: "rewind" },
  { id: "matters", title: "what matters" },
  { id: "land", title: "no-man’s land" },
  { id: "habits", title: "habits" },
  { id: "meaning", title: "what it means" },
  { id: "next", title: "next" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
  ["when", "November 2026"],
  ["tools", "TypeScript, Next.js, a canvas and a web worker, no libraries"],
  ["data", "published rally stats (sources in the notes); the simulation is mine"],
  ["code", <a key="code" href={CODE}>github.com/Arya-P05/green-wave</a>],
];

export default function SlidingDoors() {
  const story = storyPoint();
  const kitchen = fam("kitchen");
  const third = fam("third");
  const others = fam("third").lostPerRally + fam("return").lostPerRally + fam("transition").lostPerRally;
  const { ds, soft, hard } = results.depth;
  const hardBest = hard.indexOf(Math.max(...hard));
  return (
    <main className="grid gap-x-4 px-1 py-4 sm:px-4 md:grid-cols-[18ch_minmax(0,1fr)]">
      <nav aria-label="contents" className="hidden md:block">
        <div className="sticky top-4">
          <Toc entries={SECTIONS} />
        </div>
      </nav>

      <article className="max-w-[96ch]">
        <header className="grid gap-y-1">
          <div>
            <Link href="/" aria-label="back to writing" className="arrive text-muted" style={{ ...order(0), textDecoration: "none" }}>
              ←
            </Link>
            <h1 className="arrive mt-1" style={order(1)}>
              sliding doors
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              How do pickleball rallies really get won?
            </p>
          </div>
          <p className="arrive" style={order(3)}>
            I play pickleball most weekends, and I lose a lot of points I can’t explain. So I built a pretend version of
            doubles: four little players on a court, a ball, and simple rules for what happens when someone hits it. I tuned
            it until its rallies looked like real ones, using numbers people have published from real matches. Then I used it
            to do the one thing you can’t do on a real court: go back to a moment in a point, choose something different, and
            see what would have happened.
          </p>
          <p className="arrive" style={order(4)}>
            The question I wanted to answer is which decisions in a rally actually matter. Along the way you can rewind a few
            points yourself.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="point" title="the point">
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            Last Saturday, 9–9, my serve. Their return came back short, I drove the third shot, followed it in, and a few
            shots later the ball was past me and we’d lost the serve. I replayed that point in my head the whole drive home.
            Was it the drive? Should I have dropped it? Should I have stayed back instead of following it in?
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            The annoying part is that there’s no way to know. You only ever get to see the one rally that happened. The
            version where I dropped instead doesn’t exist, so “I should have dropped it” is just a feeling.
          </p>
          <p>
            That’s the idea behind the title. In the movie <i>Sliding Doors</i>, one life splits into two at a single moment
            (she catches the train, or she doesn’t) and you get to watch both. I wanted that for a pickleball point.
          </p>
        </Section>

        <Section id="data" title="what the data says">
          <p>
            Before building anything I went looking for what’s already known. A few people have sat and charted thousands of
            real rallies, and some of what they found surprised me.
          </p>
          <p>
            <span className="text-ink">Serving is a disadvantage.</span> In pickleball only the serving team can score, but
            it’s the receiving team that wins most rallies. A study of 2,344 points from the 2023 pro tour found receivers won{" "}
            <a href={SRC.ppa}>55.5% of them</a>; one fan who charted 107 pro games found servers winning{" "}
            <a href={SRC.reddit}>45.7%</a>; a 2025 study of amateur doubles put it at about{" "}
            <a href={SRC.rallytrace}>42%</a>. The reason is the two-bounce rule: the return has to bounce, and so does the
            third shot. So the receiving team gets to walk up to the net (the kitchen line) while the serving team is stuck at
            the back, waiting.
          </p>
          <p>
            <span className="text-ink">A deep return is worth a lot.</span> Jayan Gandhi watched almost 2,000 amateur rallies
            and found that at DUPR 3.5 and up, the returning team won <a href={SRC.gandhi}>about 70% of rallies</a> after a
            deep return and about 50% after a short one. A short return throws away the receiver’s head start.
          </p>
          <p>
            <span className="text-ink">The famous argument doesn’t matter (much).</span> Every pickleball player has an
            opinion on whether to drop or drive the third shot. In the same data, the two won{" "}
            <a href={SRC.gandhi}>about equally at every level</a>, and both failed at least a fifth of the time.
          </p>
          <p>
            <span className="text-ink">Getting to the net is the fight.</span> In charted pro matches, once the serving team
            made it safely to the kitchen line, they won <a href={SRC.neutral}>roughly half</a> of those rallies. Being there
            makes it even; the hard part is getting there.
          </p>
          <p>
            All of that is about what happened, on average, over thousands of points. None of it can tell me about the point
            that didn’t happen. For that I needed rallies I could rewind.
          </p>
        </Section>

        <Section id="court" title="a pretend court">
          <p>
            So I made a pretend court. It isn’t physics: nobody’s simulating spin or paddle angles. Each shot is two things, a
            choice and a roll of the dice.
          </p>
          <p>
            <span className="text-ink">The choice</span> is what to hit (soft, like a drop or a dink; hard, like a drive or a
            speed-up; or a lob) and whether to move in toward the net afterwards or stay where you are.
          </p>
          <p>
            <span className="text-ink">The dice</span> decide whether it goes in, and if it does, how nice a ball it leaves
            for the other side: low and hard to attack, attackable, or a sitter. The odds depend on three things everyone who
            plays already knows matter: how far from the net you are (a soft shot from the baseline is much harder than one from
            the kitchen line), how fast the ball came at you, and whether you were still running when you hit it.
          </p>
          <p>
            While the ball is in the air, everyone moves. A soft shot hangs up there long enough for you to take a few steps
            in; a drive gets there before you’ve moved much. That one rule is what ties shot choice to court position.
          </p>
          <p>
            Every player is the same: a made-up “sensible 4.0” who mostly does what coaches teach, with some randomness,
            because nobody plays the same way twice. They drop the third about {pct(cal.dropShare)} of the time, follow a drop
            in most of the time and a drive in about half the time, and mostly dink at the kitchen line until they get a ball
            worth attacking.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I’m by no means a coach, and I’m a long way from a pro. I just wanted to poke at a question I care about, so take
            all of this as me learning as I go.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <Nerds title="how the model works">
            <p>
              Positions are in feet on a 20 × 44 court. A player’s depth is their distance from the net (7 at the kitchen line,
              22 at the baseline). The serve and return have to bounce. Partners move as a pair. Players cover {PARAMS.speed} ft
              per second between shots (split-steps and all), and the hitter loses {PARAMS.recover} s finishing the swing.
            </p>
            <p>
              Difficulty grows with distance from the net as D = ((depth − 7.5) / 14.5)^{PARAMS.reachPow}, so the last few feet
              before the baseline are the worst. A soft shot misses with probability {PARAMS.soft.err} + {PARAMS.soft.errD}·D +{" "}
              {PARAMS.soft.errPace}·pace + …, where pace is 0 for a soft ball and up to 1 for a hard one from close range. Hard
              shots, lobs and returns have their own versions. Every number is in <code>lib/pickleball/params.ts</code>.
            </p>
            <p>
              Things it leaves out: spin, left- and right-handedness, stacking, poaching, partners covering the middle,
              targeting the weaker player, nerves, and the score. Every player has exactly the same skill.
            </p>
          </Nerds>
        </Section>

        <Section id="real" title="is it pickleball?">
          <p>
            A pretend court is only worth listening to if it behaves like a real one. I tuned the made-up numbers until
            sensible players on it reproduced the stats above, over {n(cal.rallies)} simulated rallies:
          </p>
          <table className="w-full max-w-[80ch] tabular-nums [&_td]:align-top [&_td+td]:pl-[1ch] [&_th+th]:pl-[1ch] sm:[&_td+td]:pl-[2ch] sm:[&_td+td]:whitespace-nowrap sm:[&_th+th]:pl-[2ch]">
            <thead className="text-left text-muted">
              <tr>
                <th className="font-normal">measure</th>
                <th className="text-right font-normal">real</th>
                <th className="text-right font-normal">the model</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>serving team wins the rally</td>
                <td className="text-right text-muted">
                  <a href={SRC.rallytrace}>42%</a>–<a href={SRC.reddit}>46%</a>
                </td>
                <td className="text-right">{pct1(cal.serveWin)}</td>
              </tr>
              <tr>
                <td>returns that land deep</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>about 50%</a>
                </td>
                <td className="text-right">{pct1(cal.deepShare)}</td>
              </tr>
              <tr>
                <td>returning team wins after a deep return</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>67–70%</a>
                </td>
                <td className="text-right">{pct1(cal.afterDeep)}</td>
              </tr>
              <tr>
                <td>… after a short return</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>47–51%</a>
                </td>
                <td className="text-right">{pct1(cal.afterShort)}</td>
              </tr>
              <tr>
                <td>returning team wins against a third-shot drop / drive</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>62% / 60%</a>
                </td>
                <td className="text-right">
                  {pct(cal.vsDrop)} / {pct(cal.vsDrive)}
                </td>
              </tr>
              <tr>
                <td>third shot fails (drop / drive)</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>22–33% / 18–33%</a>
                </td>
                <td className="text-right">
                  {pct(cal.dropFail)} / {pct(cal.driveFail)}
                </td>
              </tr>
              <tr>
                <td>shots per rally</td>
                <td className="text-right text-muted">
                  <a href={SRC.gandhi}>7.0–7.9</a>
                </td>
                <td className="text-right">{cal.meanLength.toFixed(1)}</td>
              </tr>
              <tr>
                <td>servers win once they’re both at the kitchen</td>
                <td className="text-right text-muted">
                  <a href={SRC.neutral}>47–53% (pros)</a>
                </td>
                <td className="text-right">{pct(cal.winWhenArrived)}</td>
              </tr>
            </tbody>
          </table>
          <p>
            It’s close but not perfect. The deep return is worth a bit less in the model than in real life, third-shot drives
            fail a bit more often, and the serving team makes it to the kitchen more often ({pct(cal.serveArrive)} of rallies
            that last five shots) than I suspect real 4.0 players do. I decided that was close enough to be interesting, as long
            as I kept saying so.
          </p>
          <Nerds title="the tuning">
            <p>
              The real numbers are from 3.5–5.0 amateurs (Gandhi), except where marked as pros. I tuned about 25 of the
              model’s numbers with a small random search against these targets, then rounded them. The model is seeded, so every
              number on this page comes out the same every time; <code>lib/pickleball/calibration.test.ts</code> fails if a
              change pushes the model outside these ranges.
            </p>
            <p>
              “Fails” follows Gandhi: a drive that misses, or a drop whose team loses the rally by the fifth shot. Rally length
              counts the serve and the shot that missed.
            </p>
          </Nerds>
        </Section>

        <Section id="rewind" title="rewind">
          <p>
            Here’s the sliding doors part. Take any moment in a rally, freeze it, and play it out hundreds of times. The
            dice come out differently each time, so some of those rallies you win and some you lose, and the share you win is
            your chance from that moment. Now change one decision and play it out again, with exactly the same dice. Whatever
            changes is down to the decision, not luck.
          </p>
          <Rewind />
          <p>
            Rally 1 is my Saturday point, more or less: my serve, a short return, a drive on the third, following it in. I was
            sure the drive was the mistake. It wasn’t. Right before it, our chance of winning the point was{" "}
            {pct(story.beforeThird)}; right after it, {pct(story.afterThird)}.{" "}
            {Math.round(story.thirdCost * 100) === 0
              ? "Nothing else I could have hit there did better in the replays."
              : `The best other option would have added only ${pts(story.thirdCost)} points.`}{" "}
            The point slipped at shot {story.worst.shot}, when they sped it up and I tried to{" "}
            {story.worstName} it softly. A {story.bestName} would have won {pct(story.worst.bestWin)} of the replays instead of{" "}
            {pct(story.worst.win)}.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            Which, honestly, is the part of my game I never think about. I spend the whole drive home on the third shot and
            not a second on the hands battle that actually lost it.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <Nerds title="the replays">
            <p>
              The line under the court is each moment replayed {n(results.replays.meter)} times. A “what if” is replayed{" "}
              {n(results.replays.decision)} times, and each replay uses the same seed as the matching replay of what you
              actually did, so {n(results.replays.decision)} strokes of luck are shared between
              the two choices. The replays run in a web worker so the court keeps moving while they do. The puzzle mode picks
              the best option on the first {n(results.replays.decision / 2)} replays and scores it on the other{" "}
              {n(results.replays.decision / 2)}, so luck can’t make a decision look
              worse than it was.
            </p>
          </Nerds>
        </Section>

        <Section id="matters" title="what matters">
          <p>
            One point is a story. To answer the real question I needed lots of them. So I let the sensible players play{" "}
            {n(results.sample.rallies)} rallies, and at every single decision in every rally, I replayed every option
            {` ${results.sample.replays}`} times and wrote down how much win chance the chosen one gave away compared with the
            best one.
          </p>
          <Where />
          <p>
            I expected the third shot to top this list. It’s where all the arguing happens. It doesn’t. Each decision at the
            kitchen line is small ({(kitchen.cost * 100).toFixed(1)} points on average, against{" "}
            {(third.cost * 100).toFixed(1)} for the third shot), but there are {kitchen.perRally.toFixed(1)} of them in an
            average rally, and they add up to {(kitchen.lostPerRally * 100).toFixed(1)} points a rally: more than the return,
            the third shot and no-man’s land put together ({(others * 100).toFixed(1)}).
          </p>
          <p>
            And the thing I thought might be the secret, moving in or staying back after the third shot, turned out to be
            the smaller half even of the third shot: most of what the third shot gives away is what you hit, not where you go
            after.
          </p>
        </Section>

        <Section id="land" title="no-man’s land">
          <p>
            Every coach says to get to the kitchen and not to get caught in between, in “no-man’s land”. Here’s how much each
            step is worth in the model, if you and your partner are standing at one depth and they’re already at the line.
          </p>
          <NoMansLand />
          <p>
            Against a soft ball at your feet, every step forward helps, from {pct(soft[soft.length - 1])} at the baseline to{" "}
            {pct(soft[0])} at the kitchen line. Against a hard ball it’s flatter and lower: about {pct(hard[0])} anywhere in
            front of {ds[hardBest]} ft, and a little better ({pct(hard[hardBest])}) just behind it, where you can let the ball
            bounce. So getting caught in the middle by a hard ball is bad, but in this model it’s no worse than being at the line
            for it. The danger of no-man’s land is the soft ball you have to hit up from far away.
          </p>
        </Section>

        <Section id="habits" title="habits">
          <p>
            Last, the version that matters on a Saturday: whole games. I gave one team a single changed habit, kept everyone
            else sensible, and played games to 11 with real side-out scoring. Small differences per rally grow a lot over a
            game, because only the serving team scores (a nice paper on that is{" "}
            <a href={SRC.markov}>DeFord &amp; Ethier</a>).
          </p>
          <Habits />
          <p>
            The two biggest are both at the kitchen line, and they’re two halves of the same rule. Attack a ball that comes to
            you at net height ({signed(gameGain("attack"))} games out of 100), and don’t speed up a ball that’s below the net (
            {signed(gameGain("patient"))}). Keep dinking the net-height balls and you lose {pts(gameGain("dinkMid"))}. Aiming
            every return deep is worth {signed(gameGain("deep"))}. Staying back after every shot costs{" "}
            {pts(gameGain("neverIn"))}.
          </p>
          <p>
            Drop or drive? Always driving the third came out a little ahead of always dropping it ({pct(policy("drive3").game)}{" "}
            against {pct(policy("drop3").game)} of games), from rally odds that differ by about one point. That matches the real
            data, where at 4.0 the drive was very slightly ahead, and it’s still much smaller than the kitchen habits.
          </p>
        </Section>

        <Section id="meaning" title="what it means">
          <p>
            <span className="text-ink">It’s mostly the kitchen.</span> The decisions that give away the most aren’t the
            dramatic ones. They’re the dozen small dink-or-attack choices in the middle of a rally, each worth a couple of
            points.
          </p>
          <p>
            <span className="text-ink">The third-shot argument is mostly noise.</span> The model agrees with the real data:
            drop and drive come out about even. What you do three shots later matters more.
          </p>
          <p>
            <span className="text-ink">Moving in is a habit, not a moment.</span> Any single choice to move in or stay back is
            worth little, but never moving in is one of the most expensive habits on the list.
          </p>
          <p>
            <span className="text-ink">All of this is about a model.</span> Every number in it is made up and then tuned to
            match a handful of real stats. The ranking feels right to me, and it lines up with what coaches say, but the sizes
            (like {signed(gameGain("attack"))} games) depend on assumptions I chose, especially how hard a speed-up is to keep in
            and to handle. Treat them as “bigger” and “smaller,” not as facts about your game.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            So this weekend I’m not thinking about the third shot at all. I’m going to be patient with low balls and actually
            pull the trigger on high ones, which is what my friends have been telling me for a year.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="next" title="next">
          <p>
            Put me in it. Film a few of my own games, chart them with something like <a href={SRC.pbvision}>PB Vision</a>,
            and give one of the pretend players my real numbers instead of the sensible ones. Then the question gets personal
            in the best way: which of my decisions give away the most?
          </p>
        </Section>

        <Section id="notes" title="notes">
          <p className="text-muted">
            Method: a shot-by-shot doubles model (choice plus dice, everyone moving while the ball is in the air), every player
            the same, tuned to published 3.5–5.0 stats. Decision costs: {n(results.sample.rallies)} rallies, every option at
            every decision replayed {results.sample.replays} times with shared seeds, best option picked on half the replays
            and scored on the other half. Habits: {n(results.policyRallies)} rallies each, turned into games with side-out
            scoring to 11. Baseline game win: {pct(baseline.game)}. Code and data: <a href={CODE}>github.com/Arya-P05/green-wave</a>.
          </p>
          <ol className="grid gap-y-1 text-muted">
            <li>
              Gandhi, J. (2024). <a href={SRC.gandhi}>Do Deep Returns Win More Rallies? What about Drives vs Drops?</a> The Dink.
            </li>
            <li>
              <a href={SRC.ppa}>Technical–tactical behaviour and rally structure in professional men’s doubles pickleball</a>.
              International Journal of Sports Science &amp; Coaching.
            </li>
            <li>
              u/r/Pickleball. <a href={SRC.reddit}>I watched 107 professional pickleball matches to learn about score distributions</a>.
            </li>
            <li>
              Rally Trace. <a href={SRC.rallytrace}>The pickleball stats worth tracking</a> (citing Himawan et al., 2025).
            </li>
            <li>
              The Dink. <a href={SRC.neutral}>Pro Pickleball 2019 vs 2022: Stats Reveal a Faster Game</a>.
            </li>
            <li>
              DeFord, D. &amp; Ethier, S. N. (2023). <a href={SRC.markov}>Does the first-serving team have a structural advantage in pickleball?</a>
            </li>
          </ol>
        </Section>

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
