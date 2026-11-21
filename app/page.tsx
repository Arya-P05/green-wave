import Link from "next/link";
import Signature from "@/components/shared/Signature";
import { WRITINGS } from "./writings";

/** The index: every writing, one line each, in the style of arya-site's sidequests. */
export default function Writing() {
  return (
    <main className="px-1 py-4 sm:px-4">
      <ol className="max-w-[68ch] space-y-1">
        {WRITINGS.map(({ slug, title, line, date }, i) => (
          <li key={slug} className="grid grid-cols-[4ch_1fr]">
            <span aria-hidden className="text-muted tabular-nums">
              {String(WRITINGS.length - i).padStart(2, "0")}
            </span>
            <div>
              <h2>
                <Link href={`/${slug}`}>{title}</Link>
              </h2>
              <p className="text-muted">{line}</p>
              <p className="text-muted">{date}</p>
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
