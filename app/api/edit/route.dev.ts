// Dev-only (a .dev.ts file, see next.config.ts): Arya's inline word edits, written straight back into the post's
// page.tsx so hot reload shows them, or whole blocks deleted from it. Every method is a 404 outside `next dev`.
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

/** Widen [from, to) to its whole line(s) when nothing else is on them, so a removal leaves no blank line behind. */
function withLine(code: string, from: number, to: number): [number, number] {
  const lineStart = code.lastIndexOf("\n", from - 1) + 1;
  const newline = code.indexOf("\n", to);
  const lineEnd = newline === -1 ? code.length : newline;
  if (code.slice(lineStart, from).trim() || code.slice(to, lineEnd).trim()) return [from, to];
  return [lineStart, newline === -1 ? code.length : newline + 1];
}

/** The whole element a place is the text of, from its `<tag` to its `</tag>`, or null if the tag doesn't close there. */
function element(code: string, m: RegExpExecArray): [number, number] | null {
  const start = code.lastIndexOf("<", m.index);
  const name = /^<([A-Za-z][\w.]*)/.exec(code.slice(start))?.[1];
  const close = m.index + m[0].length;
  if (!name || !code.startsWith(`${name}>`, close)) return null;
  return withLine(code, start, close + name.length + 1);
}

/** Text exactly as written in a JSX attribute string, which takes entities but no whitespace folding. */
const inAttribute = (text: string) => [...text].map(inSource).join("");

/** Only `&` and `"` need entities inside title="…". */
const encodeAttribute = (text: string) => text.replace(/[&"]/g, (c) => ENTITIES[c]);

/** A section's title: the `title="…"` on `<Section id="…">`. Groups: everything before it, and the title itself. */
const titlePattern = (section: string, title: string) =>
  new RegExp(`(<Section\\s+id="${escapeRegExp(section)}")(\\s+title="${inAttribute(title)}")`, "g");

/** Its entry in the post's contents list, `{ id: "…", title: "…" }`. Groups: before the title, the title, after. */
const entryPattern = (section: string, title: string) =>
  new RegExp(`(\\{\\s*id:\\s*"${escapeRegExp(section)}",\\s*title:\\s*)(${escapeRegExp(JSON.stringify(title))})(\\s*\\})`, "g");

const countTitle = (code: string, section: string, title: string) =>
  title.trim() ? [...code.matchAll(titlePattern(section, title))].length : 0;

/**
 * A title change: `title="…"` must be found exactly once; the contents-list entry is updated with it when there's
 * exactly one with the same id and title (a post can have no contents list, or a different label there).
 */
function retitle(code: string, section: string, old: string, next: string | null): string | Response {
  const tags = [...code.matchAll(titlePattern(section, old))];
  if (tags.length !== 1) return notOnce(tags.length);
  const entries = [...code.matchAll(entryPattern(section, old))];
  if (entries.length > 1) return notOnce(entries.length);
  const [tag] = tags;
  const replacement = next === null ? tag[1] : `${tag[1]} title="${encodeAttribute(next)}"`;
  let out = code.slice(0, tag.index) + replacement + code.slice(tag.index + tag[0].length);
  if (entries.length === 1) {
    const [entry] = [...out.matchAll(entryPattern(section, old))];
    let [from, to] = [entry.index, entry.index + entry[0].length];
    if (next === null) {
      if (out[to] === ",") to++;
      [from, to] = withLine(out, from, to);
      out = out.slice(0, from) + out.slice(to);
    } else {
      out = out.slice(0, from) + entry[1] + JSON.stringify(next) + entry[3] + out.slice(to);
    }
  }
  return out;
}

async function read(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

type Title = { section: string; title: string };
const isTitle = (t: unknown): t is Title =>
  typeof t === "object" && t !== null && typeof (t as Title).section === "string" && typeof (t as Title).title === "string";

/**
 * { path, texts, titles } → how many places each block's text, and each section title, is found in that post's
 * source. Only a 1 is editable.
 */
export async function POST(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, texts, titles = [] } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!code || !Array.isArray(texts) || !Array.isArray(titles)) return notFound();
  return Response.json({
    texts: texts.map((t) => (typeof t === "string" ? count(code, t) : 0)),
    titles: titles.map((t) => (isTitle(t) ? countTitle(code, t.section, t.title) : 0)),
  });
}

const notOnce = (n: number) => new Response(`the original words are in the source ${n} times, expected once`, { status: 409 });

/**
 * { path, old, text } → replaces the one place `old` is found with `text`, or says why it can't.
 * With `section`, `old` is that section's title and only the title (and its contents-list entry) changes.
 */
export async function PUT(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, section, old, text } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code) return notFound();
  if (typeof old !== "string" || typeof text !== "string") return new Response("old and text are required", { status: 400 });
  const next = text.trim().replace(/\s+/g, " ");
  if (!next) return new Response("can't save it empty (use × delete to remove it)", { status: 400 });
  if (typeof section === "string") {
    const out = retitle(code, section, old, next);
    if (out instanceof Response) return out;
    await writeFile(file, out);
    return Response.json({ text: next });
  }
  const found = places(code, old);
  if (found.length !== 1) return notOnce(found.length);
  const [m] = found;
  const [whole, before, after] = m;
  await writeFile(file, code.slice(0, m.index) + `>${before}${encode(next)}${after}</` + code.slice(m.index + whole.length));
  return Response.json({ text: next });
}

/**
 * { path, old } → removes the whole element (tag and all) whose text is `old`, from the one place it's found.
 * With `section`, only that section's title goes (and its contents-list entry); its paragraphs stay.
 */
export async function DELETE(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, section, old } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code) return notFound();
  if (typeof old !== "string") return new Response("old is required", { status: 400 });
  if (typeof section === "string") {
    const out = retitle(code, section, old, null);
    if (out instanceof Response) return out;
    await writeFile(file, out);
    return new Response(null, { status: 204 });
  }
  const found = places(code, old);
  if (found.length !== 1) return notOnce(found.length);
  const span = element(code, found[0]);
  if (!span) return new Response("couldn't find where that block's tag closes", { status: 409 });
  await writeFile(file, code.slice(0, span[0]) + code.slice(span[1]));
  return new Response(null, { status: 204 });
}
