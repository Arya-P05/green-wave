import Link from "next/link";
import Signature from "@/components/shared/Signature";
import { WRITINGS } from "./writings";

/** Where "Arya Patel" points. TODO(arya): her site's URL once these live there. */
const SITE = "https://github.com/Arya-P05";

/** The index: every writing, one line each, in the style of arya-site's sidequests. */
export default function Writing() {
  return (
    <main className="px-1 py-4 sm:px-4">
      <a href={SITE}>Arya Patel</a>
      <h1 className="mt-1">writing</h1>
      <p className="text-muted">Questions I got curious about, worked out with small simulations you can play with.</p>

      <ol className="mt-2 max-w-[68ch] space-y-1">
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

      <footer className="mt-4 flex items-end gap-[2ch]">
        <Signature />
        <p className="text-muted italic">remember life</p>
      </footer>
    </main>
  );
}
