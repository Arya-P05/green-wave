import { fam, pct, results } from "@/app/sliding-doors/numbers";
import type { Family } from "@/app/sliding-doors/numbers";

const ROWS: [Family, string][] = [
  ["kitchen", "at the kitchen line (dink, speed up, block, counter)"],
  ["third", "the third shot (drop, drive or lob; then in or not)"],
  ["return", "the return (deep or short)"],
  ["transition", "in no-man’s land (reset, drive or lob; then in or not)"],
];

/** Where a rally's win chance gets given away, by kind of decision. */
export function Where() {
  const max = Math.max(...ROWS.map(([f]) => fam(f).lostPerRally));
  return (
    <figure className="my-2 grid gap-y-1">
      <table className="w-full max-w-[80ch] tabular-nums [&_td]:align-top [&_td+td]:pl-[1ch] [&_th]:align-bottom [&_th+th]:pl-[1ch] sm:[&_td+td]:pl-[2ch] sm:[&_th+th]:pl-[2ch]">
        <caption className="text-left text-muted">
          Win chance a sensible 4.0 player gives away per rally, by kind of decision (points out of 100):
        </caption>
        <thead className="text-left text-muted">
          <tr>
            <th className="font-normal">decision</th>
            <th className="font-normal">per rally</th>
            <th className="hidden w-[30%] font-normal sm:table-cell" aria-hidden />
            <th className="text-right font-normal">each time</th>
            <th className="text-right font-normal">times a rally</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([f, name]) => {
            const r = fam(f);
            return (
              <tr key={f}>
                <td className="sm:pr-[2ch]">{name}</td>
                <td>{(r.lostPerRally * 100).toFixed(1)}</td>
                <td className="hidden align-middle! sm:table-cell" aria-hidden>
                  <div className="h-[6px] bg-ink" style={{ width: `${(r.lostPerRally / max) * 100}%` }} />
                </td>
                <td className="text-right text-muted">{(r.cost * 100).toFixed(1)}</td>
                <td className="text-right text-muted">{r.perRally.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="text-muted">
        From {results.sample.rallies.toLocaleString("en-US")} simulated rallies. At every decision, every option was replayed{" "}
        {results.sample.replays} times; “given away” is the best option’s win chance minus the chosen one’s. Both teams’ decisions
        count, so a rally’s total is shared between the two sides. Of the third-shot number, {pct(fam("third").move / fam("third").cost)}{" "}
        is about moving in or staying back; the rest is what to hit.
      </figcaption>
    </figure>
  );
}

const HABITS: string[] = ["attack", "patient", "deep", "drive3", "followDrive", "alwaysIn", "reset", "drop3", "holdDrive", "bang", "short", "dinkMid", "neverIn"];

/** Change one habit for your team only and play whole games against sensible opponents. */
export function Habits() {
  const base = results.policies.find((p) => p.key === "sensible")!;
  const rows = HABITS.map((k) => results.policies.find((p) => p.key === k)!).sort((a, b) => b.game - a.game);
  return (
    <figure className="my-2 grid gap-y-1">
      <table className="w-full max-w-[80ch] tabular-nums [&_td]:align-top [&_td+td]:pl-[1ch] [&_th]:align-bottom [&_th+th]:pl-[1ch] sm:[&_td+td]:pl-[2ch] sm:[&_th+th]:pl-[2ch]">
        <caption className="text-left text-muted">
          Change one habit, keep everything else, and play games to 11 against sensible opponents (you win {pct(base.game)} with
          no change):
        </caption>
        <thead className="text-left text-muted">
          <tr>
            <th className="font-normal">habit</th>
            <th className="text-right font-normal">rallies won</th>
            <th className="text-right font-normal">games won</th>
            <th className="text-right font-normal">change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const d = Math.round((p.game - base.game) * 100);
            return (
              <tr key={p.key} className={Math.abs(d) >= 5 ? "text-ink" : "text-muted"}>
                <td className="pr-[2ch]">{p.label}</td>
                <td className="text-right">{pct(p.rally)}</td>
                <td className="text-right">{pct(p.game)}</td>
                <td className="text-right">{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "0"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="text-muted">
        {results.policyRallies.toLocaleString("en-US")} rallies per habit, half on serve and half receiving, then {results.games.toLocaleString("en-US")} games of
        side-out scoring from those rally odds. Changes of 5 or more are in ink.
      </figcaption>
    </figure>
  );
}
