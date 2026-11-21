/** Every post in this repo, newest first. The index page lists these. */
/** `released: false` shows on the index blurred and unclickable: people see more is coming. */
export type Writing = { slug: string; title: string; line: string; date: string; released: boolean };

export const WRITINGS: Writing[] = [
  {
    slug: "little-person",
    title: "the little person",
    line: "Why is it so embarrassing to say I want to be great?",
    date: "November 2026",
    released: true,
  },
  {
    slug: "iphone-photos",
    title: "almost good",
    line: "How do you take really good iPhone photos?",
    date: "November 2026",
    released: false,
  },
  {
    slug: "sliding-doors",
    title: "sliding doors",
    line: "How do pickleball rallies really get won?",
    date: "November 2026",
    released: false,
  },
  {
    slug: "green-wave",
    title: "green wave",
    line: "Can traffic lights find the green wave on their own?",
    date: "November 2026",
    released: false,
  },
];
