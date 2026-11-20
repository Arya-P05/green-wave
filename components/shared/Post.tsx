import type { CSSProperties } from "react";
import Signature from "./Signature";

/** The intro arrives once, in reading order: give each piece its place in line. */
export const order = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * One section of a post: a muted heading (if it has a title), then its paragraphs and figures. Without a title it
 * starts one paragraph gap below the section before, so it reads as that section carrying on.
 */
export function Section({ id, title, children }: { id: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={`${title ? "mt-4" : "mt-1"} grid scroll-mt-4 gap-y-1`}>
      {title && (
        <h2 id={`${id}-title`} className="text-muted">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/** The when / tools / data / code list at the bottom of a post. */
export function Meta({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mt-4 grid grid-cols-[8ch_minmax(0,1fr)] text-muted">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Arya's signature and "remember life", as on arya-site. */
export function SignOff() {
  return (
    <footer className="mt-2 flex items-end gap-[2ch]">
      <Signature />
      <p className="text-muted italic">remember life</p>
    </footer>
  );
}
