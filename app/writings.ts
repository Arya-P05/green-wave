/** Every post in this repo, newest first. The index page lists these. */
export type Writing = { slug: string; title: string; line: string; date: string };

export const WRITINGS: Writing[] = [
  {
    slug: "green-wave",
    title: "green wave",
    line: "Can traffic lights find the green wave on their own?",
    date: "November 2026",
  },
];
