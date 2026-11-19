"use client";

import { useEffect, useState } from "react";

export type Entry = { id: string; title: string };

/** The contents, with the section you're reading in ink. */
export default function Toc({ entries }: { entries: Entry[] }) {
  const [active, setActive] = useState(entries[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (seen) => {
        const top = seen.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const e of entries) {
      const el = document.getElementById(e.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [entries]);

  return (
    <ol>
      {entries.map((e) => (
        <li key={e.id}>
          <a
            href={`#${e.id}`}
            className={`no-underline transition-colors duration-[160ms] ${e.id === active ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {e.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
