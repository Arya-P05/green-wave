import Link from "next/link";
import Signature from "@/components/shared/Signature";
import { WRITINGS } from "./writings";

/** The index: every writing, one line each, in the style of arya-site's sidequests. */
export default function Writing() {
  return (
    <main className="px-1 py-4 sm:px-4">
      <h1>writing</h1>

      <ol className="mt-2 max-w-[68ch] space-y-1">
        {WRITINGS.map(({ slug, title, line, date, released }, i) => (
          <li key={slug} className="grid grid-cols-[4ch_1fr]">
            <span aria-hidden className="text-muted tabular-nums">
              {String(WRITINGS.length - i).padStart(2, "0")}
            </span>
            <div className={released ? undefined : "cursor-default select-none blur-[5px]"}>
              <h2>{released ? <Link href={`/${slug}`}>{title}</Link> : title}</h2>
              <p className="text-muted">{line}</p>
              <p className="text-muted">{date}</p>
              {!released && <span className="sr-only">coming soon</span>}
            </div>
          </li>
        ))}
      </ol>

      <footer className="mt-4">
        <Signature />
      </footer>
    </main>
  );
}
