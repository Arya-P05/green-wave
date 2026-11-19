/**
 * The court, in feet. x runs across (0 to 20), y runs the length (0 to 44)
 * with the net at y = 22. Team 0 ("you") plays the near half, y < 22.
 *
 * A player's depth d is their distance from the net on their own side: 0 at
 * the net, 7 at the kitchen line, 22 at the baseline.
 */
export const COURT_W = 20;
export const COURT_L = 44;
export const NET_Y = 22;
export const KITCHEN = 7;
export const BASELINE = 22;

/** Where a player "at the kitchen line" stands: toes just behind it. */
export const AT_LINE = 7.5;
/** Where a player waiting at the back stands: just behind the baseline. */
export const AT_BACK = 22.5;

export type Team = 0 | 1;
export type Zone = "kitchen" | "transition" | "back";

/** The three bands of the court a player can be in. */
export function zone(d: number): Zone {
  if (d <= 9.5) return "kitchen";
  if (d <= 17) return "transition";
  return "back";
}

export const teamOf = (player: number): Team => (player < 2 ? 0 : 1);
export const partnerOf = (player: number) => player ^ 1;

/** A point on the court from a team's side and a depth. */
export function y(team: Team, d: number): number {
  return team === 0 ? NET_Y - d : NET_Y + d;
}
