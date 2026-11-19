import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";

/** Arya's own photos live here, outside git for now. */
const DIR = "iphone-photos/story";

/**
 * One of Arya's photos, as a story beat. If the file is in public/ it's
 * shown; if not, a placeholder of the same shape stands in, with a viewfinder's
 * corner marks and a line saying which photo goes there.
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
  const here = existsSync(join(process.cwd(), "public", DIR, name));
  return (
    <figure className={`my-2 grid gap-y-1 ${narrow ? "max-w-[44ch]" : "max-w-[72ch]"}`}>
      <div className="relative w-full" style={{ aspectRatio: `${w} / ${h}` }}>
        {here ? (
          <Image
            src={`/${DIR}/${name}`}
            alt={alt}
            fill
            sizes={narrow ? "(max-width: 640px) 100vw, 400px" : "(max-width: 768px) 100vw, 700px"}
            className="object-cover"
          />
        ) : (
          <div role="img" aria-label={`Placeholder for a photo: ${alt}`} className="absolute inset-0 bg-faint/25">
            <Corners />
            <div className="absolute inset-0 grid place-content-center gap-y-1 p-2 text-center text-muted">
              <span className="text-ink">{name}</span>
              <span className="max-w-[40ch]">{alt}</span>
            </div>
          </div>
        )}
      </div>
      <figcaption className="text-muted">{children}</figcaption>
    </figure>
  );
}

/** The four corner brackets of a camera's focus box. */
function Corners() {
  const arm = "absolute h-[16px] w-[16px] border-muted";
  return (
    <>
      <span className={`${arm} top-[12px] left-[12px] border-t border-l`} />
      <span className={`${arm} top-[12px] right-[12px] border-t border-r`} />
      <span className={`${arm} bottom-[12px] left-[12px] border-b border-l`} />
      <span className={`${arm} right-[12px] bottom-[12px] border-r border-b`} />
    </>
  );
}
