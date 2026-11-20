import Image from "next/image";

/**
 * An image in a post, full width, or with side="right" centred beside the block just above it, out in the right margin so the
 * text column keeps its width (on screens too narrow for that, it sits below the block at text width). Written as one self-closing tag with plain
 * props so the dev edit mode (app/api/edit) can add, move and delete it.
 */
export default function Picture({
  src,
  alt,
  width,
  height,
  caption,
  side,
}: {
  /** Path under public/, e.g. "/little-person/sketch.png". */
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** In the right margin, centred on the block above, on screens 1280px and wider. */
  side?: "right";
}) {
  return (
    <figure data-src={src} data-side={side} className={`my-2 grid gap-y-1 ${side ? "max-w-[64ch]" : "max-w-[72ch]"}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={side ? "(max-width: 1280px) 100vw, 340px" : "(max-width: 768px) 100vw, 700px"}
        className="w-full"
      />
      {caption && <figcaption className="text-muted">{caption}</figcaption>}
    </figure>
  );
}
