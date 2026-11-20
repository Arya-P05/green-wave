import Image from "next/image";

/**
 * An image in a post, full width or beside the text that follows it. Written as one self-closing tag with plain
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
  /** Beside the next paragraph (about 40% wide) on wider screens; full width on phones. */
  side?: "left" | "right";
}) {
  return (
    <figure data-src={src} data-side={side} className="my-2 grid max-w-[72ch] gap-y-1">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={side ? "(max-width: 768px) 100vw, 240px" : "(max-width: 768px) 100vw, 700px"}
        className="w-full"
      />
      {caption && <figcaption className="text-muted">{caption}</figcaption>}
    </figure>
  );
}
