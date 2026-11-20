// Dev-only (a .dev.ts file, see next.config.ts): Arya's inline word edits, written straight back into the post's
// page.tsx so hot reload shows them. Every method is a 404 outside `next dev`.
//
// A block's rendered text is found in the source as a whole JSX text child: an opening tag's `>`, the text, `</`.
// JSX folds every run of whitespace (line wraps, indentation) into one space, so each space in the rendered text
// matches any run of whitespace in the source. A block is only editable when that finds exactly one place.
//
// The characters JSX text can't hold as typed (or that lint flags) are written as HTML entities, which JSX turns back
// into the same characters, so what Arya types is exactly what renders and the block stays editable.
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

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "{": "&#123;",
  "}": "&#125;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A character as it can appear in the source: itself, or its entity. */
const inSource = (c: string) => (ENTITIES[c] ? `(?:${escapeRegExp(c)}|${ENTITIES[c]})` : escapeRegExp(c));

/** Text as it's written into the source. */
const encode = (text: string) => text.replace(/[&<>{}"']/g, (c) => ENTITIES[c]);

function pattern(text: string): RegExp {
  const body = text
    .trim()
    .split(/\s+/)
    .map((word) => [...word].map(inSource).join(""))
    .join("\\s+");
  return new RegExp(`>(\\s*)${body}(\\s*)</`, "g");
}

/** Where `text` is the whole text of an element: right after an opening tag and right before a closing one. */
function places(code: string, text: string): RegExpExecArray[] {
  if (!text.trim()) return [];
  return [...code.matchAll(pattern(text))].filter((m) => {
    const tag = code.lastIndexOf("<", m.index);
    return tag >= 0 && code[tag + 1] !== "/" && code[m.index - 1] !== "/";
  });
}

const count = (code: string, text: string) => places(code, text).length;

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
  const code = file && (await read(file));
  if (!code || !Array.isArray(texts)) return notFound();
  return Response.json(texts.map((t) => (typeof t === "string" ? count(code, t) : 0)));
}

/** { path, old, text } → replaces the one place `old` is found with `text`, or says why it can't. */
export async function PUT(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, old, text } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code) return notFound();
  if (typeof old !== "string" || typeof text !== "string") return new Response("old and text are required", { status: 400 });
  const next = text.trim().replace(/\s+/g, " ");
  if (!next) return new Response("can't save an empty paragraph (deleting a whole paragraph isn't supported)", { status: 400 });
  const found = places(code, old);
  if (found.length !== 1) {
    return new Response(`the original words are in the source ${found.length} times, expected once`, { status: 409 });
  }
  const [m] = found;
  const [whole, before, after] = m;
  await writeFile(file, code.slice(0, m.index) + `>${before}${encode(next)}${after}</` + code.slice(m.index + whole.length));
  return Response.json({ text: next });
}
