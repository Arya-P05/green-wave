// Dev-only (a .dev.ts file, see next.config.ts): Arya's inline word edits, written straight back into the post's
// page.tsx so hot reload shows them. Every method is a 404 outside `next dev`.
//
// A block's rendered text is found in the source as a whole JSX text child: an opening tag's `>`, the text, `</`.
// JSX folds every run of whitespace (line wraps, indentation) into one space, so each space in the rendered text
// matches any run of whitespace in the source. A block is only editable when that finds exactly one place.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const dev = process.env.NODE_ENV === "development";
const notFound = () => new Response(null, { status: 404 });

/** "/" is app/page.tsx, "/little-person" is app/little-person/page.tsx. Anything else is refused. */
function sourceFor(pathname: unknown): string | null {
  if (typeof pathname !== "string") return null;
  if (pathname === "/") return path.join(process.cwd(), "app", "page.tsx");
  if (!/^\/[a-z0-9-]+$/.test(pathname)) return null;
  return path.join(process.cwd(), "app", pathname.slice(1), "page.tsx");
}

function pattern(text: string): RegExp {
  const body = text
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(`>(\\s*)${body}(\\s*)</`, "g");
}

/** Where `text` is the whole text of an element: right after an opening tag and right before a closing one. */
function places(source: string, text: string): RegExpExecArray[] {
  if (!text.trim()) return [];
  return [...source.matchAll(pattern(text))].filter((m) => {
    const tag = source.lastIndexOf("<", m.index);
    return tag >= 0 && source[tag + 1] !== "/" && source[m.index - 1] !== "/";
  });
}

const count = (source: string, text: string) => places(source, text).length;

async function read(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

/** { path, texts } → how many places each text is found in that post's source. Only a 1 is editable. */
export async function POST(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, texts } = await request.json();
  const file = sourceFor(pathname);
  const source = file && (await read(file));
  if (!source || !Array.isArray(texts)) return notFound();
  return Response.json(texts.map((t) => (typeof t === "string" ? count(source, t) : 0)));
}

/** { path, old, text } → replaces the one place `old` is found with `text`, or says why it can't. */
export async function PUT(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, old, text } = await request.json();
  const file = sourceFor(pathname);
  const source = file && (await read(file));
  if (!file || !source) return notFound();
  if (typeof old !== "string" || typeof text !== "string") return new Response("old and text are required", { status: 400 });
  // Straight apostrophes become the curly ones the posts already use; the rest can't sit in JSX text as typed.
  const next = text.trim().replace(/\s+/g, " ").replace(/'/g, "’");
  if (!next) return new Response("can't save an empty block", { status: 400 });
  if (/[{}<>"]/.test(next)) return new Response("can't save { } < > or \" here (use “ ” for quotes)", { status: 400 });
  const found = count(source, old);
  if (found !== 1) return new Response(`found that text ${found} times in the source, expected once`, { status: 409 });
  const [m] = places(source, old);
  const [whole, before, after] = m;
  await writeFile(file, source.slice(0, m.index) + `>${before}${next}${after}</` + source.slice(m.index + whole.length));
  return Response.json({ text: next });
}
