import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * An image in a post, full width, or with side="right" out in the right margin so the text column keeps its width.
 * A margin image's place is the block just above it in the source plus `offset`: its top sits that many px below
 * the top of that block (negative is above). On screens too narrow for a margin (under 1280px) it sits right after
 * that block at text width and the offset is ignored. Written as one self-closing tag with plain props so the dev
 * edit mode (app/api/edit) can add, drag and delete it.
 */
export default function Picture({
  src,
  alt,
  width,
  height,
  caption,
  note,
  side,
  offset = 0,
}: {
  /** Path under public/, e.g. "/little-person/sketch.png". */
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** A smaller, muted line under the caption. */
  note?: string;
  /** In the right margin on screens 1280px and wider. */
  side?: "right";
  /** With side: px from the top of the block above to the image's top. */
  offset?: number;
}) {
  return (
    <figure
      data-src={src}
      data-side={side}
      style={side ? ({ "--offset": `${offset}px` } as CSSProperties) : undefined}
      className={`my-2 grid gap-y-1 ${side ? "max-w-[64ch]" : "max-w-[72ch]"}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={side ? "(max-width: 1280px) 100vw, 340px" : "(max-width: 768px) 100vw, 700px"}
        className="w-full"
      />
      {(caption || note) && (
        <figcaption className="text-muted">
          {caption}
          {note && <small className={`block text-[0.85em] opacity-80 ${caption ? "mt-1" : ""}`}>{note}</small>}
        </figcaption>
      )}
    </figure>
  );
}
