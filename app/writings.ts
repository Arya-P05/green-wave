import { notFound } from "next/navigation";

/** Every post in this repo, in the order the index lists them. The index page lists these. */
/** `released: false` shows on the index blurred and unclickable: people see more is coming. */
export type Writing = { slug: string; title: string; line: string; released: boolean };

export const WRITINGS: Writing[] = [
  {
    slug: "little-person",
    title: "the little person",
    line: "Why is it so embarrassing to say I want to be great?",
    released: true,
  },
  {
    slug: "green-wave",
    title: "green wave",
    line: "Can traffic lights find the green wave on their own?",
    released: false,
  },
  {
    slug: "iphone-photos",
    title: "almost good",
    line: "How do you take really good iPhone photos?",
    released: false,
  },
  {
    slug: "sliding-doors",
    title: "sliding doors",
    line: "How do pickleball rallies really get won?",
    released: false,
  },
];

/** Call at the top of a piece's page: an unreleased piece is a 404 in production (it still opens in `next dev`). */
export function requireReleased(slug: string) {
  if (process.env.NODE_ENV === "production" && !WRITINGS.find((w) => w.slug === slug)?.released) notFound();
}
