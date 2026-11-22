import type { Metadata } from "next";
import Link from "next/link";
import { Habits, Where } from "@/components/pickleball/Ledger";
import NoMansLand from "@/components/pickleball/NoMansLand";
import Rewind from "@/components/pickleball/Rewind";
import Nerds from "@/components/shared/Nerds";
import Picture from "@/components/shared/Picture";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import { requireReleased } from "../writings";
import type { Entry } from "@/components/shared/Toc";
import { PARAMS } from "@/lib/pickleball/params";
import { baseline, cal, fam, gameGain, n, pct, pct1, policy, pts, results, signed, storyPoint } from "./numbers";

export const metadata: Metadata = {
  title: "sliding doors",
  description:
    "how do pickleball rallies really get won? a small doubles simulation, tuned to real stats, that replays a point with one decision changed.",
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
  { id: "point", title: "the version that didn’t happen" },
  { id: "data", title: "what we already know" },
  { id: "court", title: "a pretend court" },
  { id: "real", title: "but is it pickleball?" },
  { id: "rewind", title: "rewind" },
  { id: "matters", title: "what actually matters" },
  { id: "land", title: "no-man’s land" },
  { id: "habits", title: "habits, over a whole game" },
  { id: "meaning", title: "what i learned" },
  { id: "next", title: "what’s next" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
  ["tools", "TypeScript, Next.js, a canvas and a web worker, no libraries"],
  ["data", "published rally stats (sources in the notes); the simulation is mine"],
  ["code", <a key="code" href={CODE}>github.com/Arya-P05/green-wave</a>],
];

export default function SlidingDoors() {
  requireReleased("sliding-doors");
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
              how do pickleball rallies really get won?
            </p>
          </div>
          {/* <!-- ARYA-TWEAK --> */}
          <p className="arrive" style={order(3)}>
            last saturday, 9–9, my serve. their return came back short, i drove the third shot, followed it in, and a few
            shots later the ball was past me and we’d lost the serve. i replayed that point in my head the whole drive home.
            was it the drive? should i have dropped it? should i have stayed back instead of following it in?
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p className="arrive" style={order(4)}>
            i play pickleball most weekends, and i lose a lot of points i can’t explain. so i built a pretend version of
            doubles: four little players on a court, a ball, and simple rules for what happens when someone hits it. i tuned it
            until its rallies looked like real ones, using numbers people have published from real matches. then i used it to
            do the one thing you can’t do on a real court: go back to a moment in a point, choose something different, and see
            what would have happened.
          </p>
          <p className="arrive" style={order(5)}>
            the question i wanted to answer: which decisions in a rally actually matter? (spoiler: not the one i spent the
            drive home on.) along the way you can rewind a few points yourself.
          </p>
        </header>

        <Section id="point" title="the version that didn’t happen">
          <Picture src="/sliding-doors/two-futures.png" alt="A line sketch: a stick figure with a paddle hits a ball, and the ball's path splits into two arcs over a low net, one solid and one dotted, each ending in its own ball." width={1000} height={257} priority />
          <p>
            the annoying part is that there’s no way to know. you only ever get to see the one rally that happened. the
            version where i dropped instead doesn’t exist, so “i should have dropped it” is just a feeling.
          </p>
          <p>
            that’s the idea behind the title. in the movie <i>sliding doors</i>, one life splits into two at a single moment
            (she catches the train, or she doesn’t) and you get to watch both. i wanted that, but for a pickleball point.
          </p>
          <p>
            robert frost had the same complaint about two roads in a yellow wood: “And sorry I could not travel both / And be
            one traveler.” except he only got to pick one road. a simulation gets to walk down both.
          </p>
        </Section>

        <Section id="data" title="what we already know">
          <p>
            before building anything, i went looking for what’s already known. a few people have sat down and charted
            thousands of real rallies (respect), and some of what they found surprised me.
          </p>
          <p>
            <span className="text-ink">serving is a disadvantage.</span> which sounds backwards, because in pickleball only
            the serving team can score. but it’s the receiving team that wins most rallies:
          </p>
          <ul className="grid gap-y-1">
            <li>
              a study of 2,344 points from the 2023 pro tour found receivers won <a href={SRC.ppa}>55.5% of them</a>;
            </li>
            <li>
              one fan who charted 107 pro games found servers winning <a href={SRC.reddit}>45.7%</a>;
            </li>
            <li>
              and a 2025 study of amateur doubles put servers at about <a href={SRC.rallytrace}>42%</a>.
            </li>
          </ul>
          <p>
            the reason is the two-bounce rule. the return has to bounce, and so does the third shot. so the receiving team
            gets to walk up to the net (the kitchen line) while the serving team is stuck at the back, waiting.
          </p>
          <Picture src="/sliding-doors/the-head-start.png" alt="A top-down line sketch of a pickleball doubles court: two stick figures stand side by side at the kitchen line near the net in the top half, and two stand at the baseline at the bottom." width={554} height={931} side="right" offset={-6} note="The head start, from above. After the return, the receiving team (top) is already at the kitchen line. The serving team (bottom) is still at the back, waiting for the ball to bounce." />
          <p>
            <span className="text-ink">a deep return is worth a lot.</span> jayan gandhi watched almost 2,000 amateur rallies
            and found that at DUPR 3.5 and up, the returning team won <a href={SRC.gandhi}>about 70% of rallies</a> after a
            deep return, and about 50% after a short one. a short return basically throws away the receiver’s head start.
          </p>
          <p>
            <span className="text-ink">the famous argument doesn’t matter (much).</span> every pickleball player has an
            opinion on whether to drop or drive the third shot. in the same data, the two won{" "}
            <a href={SRC.gandhi}>about equally at every level</a>, and both failed at least a fifth of the time.
          </p>
          <p>
            <span className="text-ink">getting to the net is the fight.</span> in charted pro matches, once the serving team
            made it safely to the kitchen line, they won <a href={SRC.neutral}>roughly half</a> of those rallies. being there
            makes it even. the hard part is getting there.
          </p>
          <p>
            all of that is about what happened, on average, over thousands of points. none of it can tell me about the point
            that didn’t happen. for that, i needed rallies i could rewind.
          </p>
        </Section>

        <Section id="court" title="a pretend court">
          <p>
            so i made a pretend court. it isn’t physics: nobody’s simulating spin or paddle angles. each shot is just two
            things, a choice and a roll of the dice.
          </p>
          <p>
            <span className="text-ink">the choice</span> is what to hit (soft, like a drop or a dink; hard, like a drive or a
            speed-up; or a lob) and whether to move in toward the net afterwards or stay where you are.
          </p>
          <p>
            <span className="text-ink">the dice</span> decide whether it goes in, and if it does, how nice a ball it leaves
            for the other side: low and hard to attack, attackable, or a sitter. the odds depend on three things everyone who
            plays already knows matter: how far from the net you are (a soft shot from the baseline is much harder than one
            from the kitchen line), how fast the ball came at you, and whether you were still running when you hit it.
          </p>
          <p>
            while the ball is in the air, everyone moves. a soft shot hangs up there long enough for you to take a few steps
            in; a drive gets there before you’ve moved much. that one rule is what ties shot choice to court position.
          </p>
          <p>
            every player is the same: a made-up “sensible 4.0” who mostly does what coaches teach, with some randomness,
            because nobody plays the same way twice. they drop the third about {pct(cal.dropShare)} of the time, follow a drop
            in most of the time and a drive in about half the time, and mostly dink at the kitchen line until they get a ball
            worth attacking.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            quick disclaimer: i’m by no means a coach, and i’m a long way from a pro. i just wanted to poke at a question i
            care about, so take all of this as me learning as i go.
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

        <Section id="real" title="but is it pickleball?">
          <p>
            a pretend court is only worth listening to if it behaves like a real one. so i tuned the made-up numbers until
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
            it’s close but not perfect. the deep return is worth a bit less in the model than in real life, third-shot drives
            fail a bit more often, and the serving team makes it to the kitchen more often ({pct(cal.serveArrive)} of rallies
            that last five shots) than i suspect real 4.0 players do. i decided that was close enough to be interesting, as long
            as i kept saying so. (so: i’m saying so.)
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
            ok, here’s the sliding doors part. take any moment in a rally, freeze it, and play it out hundreds of times. the
            dice come out differently each time, so you win some of those rallies and lose some, and the share you win is your
            chance from that moment.
          </p>
          <p>
            now change one decision and play it out again, with exactly the same dice. whatever changes is down to the
            decision, not luck. that’s the whole trick.
          </p>
          <Rewind />
          <p>
            rally 1 is my saturday point, more or less: my serve, a short return, a drive on the third, following it in. i was
            sure the drive was the mistake. it wasn’t. right before it, our chance of winning the point was{" "}
            {pct(story.beforeThird)}; right after it, {pct(story.afterThird)}.{" "}
            {Math.round(story.thirdCost * 100) === 0
              ? "nothing else i could have hit there did better in the replays."
              : `the best other option would have added only ${pts(story.thirdCost)} points.`}{" "}
            the point actually slipped at shot {story.worst.shot}, when they sped it up and i tried to{" "}
            {story.worstName} it softly. a {story.bestName} would have won {pct(story.worst.bestWin)} of the replays instead of{" "}
            {pct(story.worst.win)}.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            which, honestly, is the part of my game i never think about. i spent the whole drive home on the third shot and
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

        <Section id="matters" title="what actually matters">
          <p>
            one point is a story. to answer the real question i needed lots of them. so i let the sensible players play{" "}
            {n(results.sample.rallies)} rallies, and at every single decision in every rally, i replayed every option
            {` ${results.sample.replays}`} times and wrote down how much win chance the chosen one gave away compared with the
            best one.
          </p>
          <Where />
          <p>
            i expected the third shot to top this list. it’s where all the arguing happens! it doesn’t. each decision at the
            kitchen line is small ({(kitchen.cost * 100).toFixed(1)} points on average, against{" "}
            {(third.cost * 100).toFixed(1)} for the third shot), but there are {kitchen.perRally.toFixed(1)} of them in an
            average rally, and they add up to {(kitchen.lostPerRally * 100).toFixed(1)} points a rally: more than the return,
            the third shot and no-man’s land put together ({(others * 100).toFixed(1)}).
          </p>
          <p>
            it’s like money, kind of. one coffee doesn’t matter, a coffee every day does.
          </p>
          <p>
            and the thing i thought might be the secret, moving in or staying back after the third shot, turned out to be
            the smaller half even of the third shot: most of what the third shot gives away is what you hit, not where you go
            after.
          </p>
        </Section>

        <Section id="land" title="no-man’s land">
          <p>
            every coach says to get to the kitchen and not to get caught in between, in “no-man’s land”. so here’s how much
            each step is worth in the model, if you and your partner are standing at one depth and they’re already at the
            line.
          </p>
          <NoMansLand />
          <p>
            against a soft ball at your feet, every step forward helps, from {pct(soft[soft.length - 1])} at the baseline to{" "}
            {pct(soft[0])} at the kitchen line. against a hard ball it’s flatter and lower: about {pct(hard[0])} anywhere in
            front of {ds[hardBest]} ft, and a little better ({pct(hard[hardBest])}) just behind it, where you can let the ball
            bounce.
          </p>
          <p>
            so getting caught in the middle by a hard ball is bad, but in this model it’s no worse than being at the line for
            it. the real danger of no-man’s land is the soft ball you have to hit up from far away.
          </p>
        </Section>

        <Section id="habits" title="habits, over a whole game">
          <p>
            last, the version that matters on a saturday: whole games. i gave one team a single changed habit, kept everyone
            else sensible, and played games to 11 with real side-out scoring. small differences per rally grow a lot over a
            game, because only the serving team scores (a nice paper on that is{" "}
            <a href={SRC.markov}>DeFord &amp; Ethier</a>).
          </p>
          <Habits />
          <p>
            the two biggest are both at the kitchen line, and they’re two halves of the same rule:
          </p>
          <ul className="grid gap-y-1">
            <li>attack a ball that comes to you at net height ({signed(gameGain("attack"))} games out of 100),</li>
            <li>and don’t speed up a ball that’s below the net ({signed(gameGain("patient"))}).</li>
          </ul>
          <p>
            keep dinking the net-height balls and you lose {pts(gameGain("dinkMid"))}. aiming every return deep is worth{" "}
            {signed(gameGain("deep"))}. staying back after every shot costs {pts(gameGain("neverIn"))}.
          </p>
          <p>
            and drop or drive? always driving the third came out a little ahead of always dropping it (
            {pct(policy("drive3").game)} against {pct(policy("drop3").game)} of games), from rally odds that differ by about
            one point. that matches the real data, where at 4.0 the drive was very slightly ahead, and it’s still much smaller
            than the kitchen habits.
          </p>
        </Section>

        <Section id="meaning" title="what i learned">
          <p>
            <span className="text-ink">it’s mostly the kitchen.</span> the decisions that give away the most aren’t the
            dramatic ones. they’re the dozen small dink-or-attack choices in the middle of a rally, each worth a couple of
            points.
          </p>
          <p>
            <span className="text-ink">the third-shot argument is mostly noise.</span> the model agrees with the real data:
            drop and drive come out about even. what you do three shots later matters more.
          </p>
          <p>
            <span className="text-ink">moving in is a habit, not a moment.</span> any single choice to move in or stay back
            is worth little, but never moving in is one of the most expensive habits on the list.
          </p>
          <p>
            <span className="text-ink">all of this is about a model.</span> every number in it is made up and then tuned to
            match a handful of real stats. the ranking feels right to me, and it lines up with what coaches say, but the sizes
            (like {signed(gameGain("attack"))} games) depend on assumptions i chose, especially how hard a speed-up is to keep
            in and to handle. treat them as “bigger” and “smaller,” not as facts about your game.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            so this weekend i’m not thinking about the third shot at all. i’m going to be patient with low balls and actually
            pull the trigger on high ones, which is what my friends have been telling me for a year.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="next" title="what’s next">
          <p>
            put me in it. film a few of my own games, chart them with something like <a href={SRC.pbvision}>PB Vision</a>,
            and give one of the pretend players my real numbers instead of the sensible ones. then the question gets personal
            in the best way: which of my decisions give away the most?
          </p>
        </Section>

        <Section id="notes" title="notes">
          <p className="text-muted">
            Method: a shot-by-shot doubles model (choice plus dice, everyone moving while the ball is in the air), every player
            the same, tuned to published 3.5–5.0 stats. Decision costs: {n(results.sample.rallies)} rallies, every option at
            every decision replayed {results.sample.replays} times with shared seeds, best option picked on half the replays
            and scored on the other half. Habits: {n(results.policyRallies)} rallies each, turned into games with side-out
            scoring to 11. Baseline game win: {pct(baseline.game)}. The two line sketches are AI-generated. Code and data: <a href={CODE}>github.com/Arya-P05/green-wave</a>.
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
