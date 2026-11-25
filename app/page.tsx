import type { Metadata } from "next";
import Link from "next/link";
import BackArrow from "@/components/shared/BackArrow";
import Signature from "@/components/shared/Signature";
import { WRITINGS } from "./writings";

export const metadata: Metadata = {
  alternates: { canonical: "/writing" },
};

/** The index: every writing, one line each, in the style of arya-site's sidequests. */
export default function Writing() {
  return (
    <main className="px-1 py-4 sm:px-4">
      <BackArrow mode="index" />
      <h1 className="mt-1">writing</h1>

      <ol className="mt-2 max-w-[68ch] space-y-1">
        {WRITINGS.map(({ slug, title, line, released }, i) => (
          <li key={slug} className="grid grid-cols-[4ch_1fr]">
            <span aria-hidden className="text-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={released ? undefined : "cursor-default select-none blur-[5px]"}>
              <h2>{released ? <Link href={`/${slug}`}>{title}</Link> : title}</h2>
              <p className="text-muted">{line}</p>
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
