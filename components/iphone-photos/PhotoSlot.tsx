import Image from "next/image";
import { assetPath } from "@/lib/shared/basePath";

/** Arya's own photos (resized, metadata stripped). */
const DIR = "iphone-photos/story";

/**
 * One of Arya's photos, as a story beat.
 */
export default function PhotoSlot({
  name,
  ratio,
  alt,
  children,
  narrow = false,
}: {
  /** File name in public/iphone-photos/story/, e.g. "monkey.jpg". */
  name: string;
  /** Width and height, e.g. [4, 3]. */
  ratio: [number, number];
  alt: string;
  /** The caption. */
  children: React.ReactNode;
  /** Portrait photos sit narrower so they don't fill a whole screen. */
  narrow?: boolean;
}) {
  const [w, h] = ratio;
  return (
    <figure className={`my-2 grid gap-y-1 ${narrow ? "max-w-[44ch]" : "max-w-[72ch]"}`}>
      <div className="relative w-full" style={{ aspectRatio: `${w} / ${h}` }}>
        <Image
          src={assetPath(`/${DIR}/${name}`)}
          alt={alt}
          fill
          sizes={narrow ? "(max-width: 640px) 100vw, 400px" : "(max-width: 768px) 100vw, 700px"}
          className="object-cover"
        />
      </div>
      <figcaption className="text-muted">{children}</figcaption>
    </figure>
  );
}

