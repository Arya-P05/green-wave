// Dev-only (a .dev.ts file, see next.config.ts): Arya's inline word edits, written straight back into the post's
// page.tsx so hot reload shows them, or whole blocks deleted from it. Every method is a 404 outside `next dev`.
//
// A block's rendered text is found in the source as a whole JSX text child: an opening tag's `>`, the text, `</`.
// JSX folds every run of whitespace (line wraps, indentation) into one space, so each space in the rendered text
// matches any run of whitespace in the source. A block is only editable when that finds exactly one place.
//
// The characters JSX text can't hold as typed (or that lint flags) are written as HTML entities, which JSX turns back
// into the same characters, so what Arya types is exactly what renders and the block stays editable.
//
// Images are <Picture src="…" … /> tags (components/shared/Picture.tsx), found by their src: they can be added after
// any editable block (the file is copied into public/<post>/), set full width or beside the text, and deleted.
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
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

/** The element a place is the text of, from its `<tag` to its `</tag>`, or null if the tag doesn't close there. */
function elementAt(code: string, m: RegExpExecArray): [number, number] | null {
  const start = code.lastIndexOf("<", m.index);
  const name = /^<([A-Za-z][\w.]*)/.exec(code.slice(start))?.[1];
  const close = m.index + m[0].length;
  if (!name || !code.startsWith(`${name}>`, close)) return null;
  return [start, close + name.length + 1];
}

/** The same, widened to its line(s) for removal. */
function element(code: string, m: RegExpExecArray): [number, number] | null {
  const span = elementAt(code, m);
  return span && withLine(code, ...span);
}

/** The indentation of the line `i` is on, if only whitespace comes before it there. */
function indentAt(code: string, i: number): string {
  const lead = code.slice(code.lastIndexOf("\n", i - 1) + 1, i);
  return lead.trim() ? "" : lead;
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

const PICTURE_IMPORT = 'import Picture from "@/components/shared/Picture";';

/** Props on tags the editor writes: `&`, `"`, `<` and `>` as entities, so the tag itself never holds a raw `>`. */
const encodeProp = (text: string) => text.replace(/[&"<>]/g, (c) => ENTITIES[c]);

const picturePattern = (src: string) => new RegExp(`<Picture\\s[^>]*?src="${inAttribute(src)}"[^>]*?/>`, "g");
const pictures = (code: string, src: string) => (src ? [...code.matchAll(picturePattern(src))] : []);

/** Adds the Picture import after the last import when it's missing, or drops it when no Picture is left. */
function pictureImport(code: string): string {
  const has = code.includes(PICTURE_IMPORT);
  const used = /<Picture\s/.test(code);
  if (has && !used) return code.replace(`${PICTURE_IMPORT}\n`, "");
  if (has || !used) return code;
  const last = [...code.matchAll(/^import [^;]*;\n/gm)].at(-1);
  const at = last ? last.index + last[0].length : 0;
  return code.slice(0, at) + PICTURE_IMPORT + "\n" + code.slice(at);
}

/** Full width (no prop) or side="left" / side="right" on the one Picture with this src. */
function setSide(code: string, src: string, side: unknown): string | Response {
  if (side !== "full" && side !== "left" && side !== "right") return new Response("side is full, left or right", { status: 400 });
  const found = pictures(code, src);
  if (found.length !== 1) return notOnce(found.length, "that image");
  const [m] = found;
  const bare = m[0].replace(/\s+side="[^"]*"/, "");
  const tag = side === "full" ? bare : bare.replace(/\s*\/>$/, ` side="${side}" />`);
  return code.slice(0, m.index) + tag + code.slice(m.index + m[0].length);
}

function removePicture(code: string, src: string): string | Response {
  const found = pictures(code, src);
  if (found.length !== 1) return notOnce(found.length, "that image");
  const [from, to] = withLine(code, found[0].index, found[0].index + found[0][0].length);
  return pictureImport(code.slice(0, from) + code.slice(to));
}

type Anchor = { text?: unknown; section?: unknown; title?: unknown; picture?: unknown };

/** Where a new image goes after a block: after its closing tag, after a section's opening tag, or after a Picture. */
function after(code: string, anchor: Anchor): { at: number; indent: string } | Response {
  if (typeof anchor.picture === "string") {
    const found = pictures(code, anchor.picture);
    if (found.length !== 1) return notOnce(found.length, "that image");
    return { at: found[0].index + found[0][0].length, indent: indentAt(code, found[0].index) };
  }
  if (typeof anchor.section === "string" && typeof anchor.title === "string") {
    const found = [...code.matchAll(titlePattern(anchor.section, anchor.title))];
    if (found.length !== 1) return notOnce(found.length, "that heading");
    const end = code.indexOf(">", found[0].index + found[0][0].length) + 1;
    return { at: end, indent: indentAt(code, found[0].index) + "  " };
  }
  if (typeof anchor.text === "string") {
    const found = places(code, anchor.text);
    if (found.length !== 1) return notOnce(found.length);
    const span = elementAt(code, found[0]);
    if (!span) return new Response("couldn't find where that block's tag closes", { status: 409 });
    return { at: span[1], indent: indentAt(code, span[0]) };
  }
  return new Response("say which block the image goes after", { status: 400 });
}

const IMAGE = /\.(png|jpe?g|gif|webp|avif)$/i;

/** A safe, unused file name in dir: lowercase letters, digits and dashes, plus the extension. */
async function freeName(dir: string, original: string): Promise<string> {
  const ext = IMAGE.exec(original)![0].toLowerCase();
  const stem = original.slice(0, -ext.length).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  for (let n = 1; ; n++) {
    const name = n === 1 ? `${stem}${ext}` : `${stem}-${n}${ext}`;
    try {
      await access(path.join(dir, name));
    } catch {
      return name;
    }
  }
}

/** Multipart { path, after, file, alt, caption, width, height } → copies the file into public/<post>/ and adds it. */
async function addImage(request: Request): Promise<Response> {
  const form = await request.formData();
  const pathname = form.get("path");
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code || typeof pathname !== "string") return notFound();
  const image = form.get("file");
  const alt = String(form.get("alt") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (!(image instanceof File) || !IMAGE.test(image.name)) return new Response("pick a png, jpg, gif, webp or avif", { status: 400 });
  if (!alt) return new Response("alt text is required", { status: 400 });
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    return new Response("couldn't read the image's size", { status: 400 });
  }
  let anchor: Anchor;
  try {
    anchor = JSON.parse(String(form.get("after")));
  } catch {
    return new Response("say which block the image goes after", { status: 400 });
  }
  const spot = after(code, anchor ?? {});
  if (spot instanceof Response) return spot;
  const post = pathname === "/" ? "index" : pathname.slice(1);
  const dir = path.join(process.cwd(), "public", post);
  await mkdir(dir, { recursive: true });
  const name = await freeName(dir, image.name);
  const src = `/${post}/${name}`;
  const props = [`src="${src}"`, `alt="${encodeProp(alt)}"`, `width={${width}}`, `height={${height}}`];
  if (caption) props.push(`caption="${encodeProp(caption)}"`);
  const tag = `\n${spot.indent}<Picture ${props.join(" ")} />`;
  await writeFile(path.join(dir, name), Buffer.from(await image.arrayBuffer()));
  try {
    await writeFile(file, pictureImport(code.slice(0, spot.at) + tag + code.slice(spot.at)));
  } catch (e) {
    await unlink(path.join(dir, name));
    throw e;
  }
  return Response.json({ src });
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
 * { path, texts, titles, pictures } → how many places each block's text, section title and image src is found in
 * that post's source. Only a 1 is editable. A multipart body adds an image instead (see addImage).
 */
export async function POST(request: Request) {
  if (!dev) return notFound();
  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) return addImage(request);
  const { path: pathname, texts, titles = [], pictures: srcs = [] } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!code || !Array.isArray(texts) || !Array.isArray(titles) || !Array.isArray(srcs)) return notFound();
  return Response.json({
    texts: texts.map((t) => (typeof t === "string" ? count(code, t) : 0)),
    titles: titles.map((t) => (isTitle(t) ? countTitle(code, t.section, t.title) : 0)),
    pictures: srcs.map((src) => (typeof src === "string" ? pictures(code, src).length : 0)),
  });
}

const notOnce = (n: number, what = "the original words") =>
  new Response(`found ${what} ${n} times in the source, expected once`, { status: 409 });

/**
 * { path, old, text } → replaces the one place `old` is found with `text`, or says why it can't.
 * With `picture` (a src), sets that image's `side` instead: full, left or right.
 * With `section`, `old` is that section's title and only the title (and its contents-list entry) changes.
 */
export async function PUT(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, section, old, text, picture, side } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code) return notFound();
  if (typeof picture === "string") {
    const out = setSide(code, picture, side);
    if (out instanceof Response) return out;
    await writeFile(file, out);
    return Response.json({ side });
  }
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
 * With `picture` (a src), that <Picture /> goes; its file stays in public/.
 */
export async function DELETE(request: Request) {
  if (!dev) return notFound();
  const { path: pathname, section, old, picture } = await request.json();
  const file = sourceFor(pathname);
  const code = file && (await read(file));
  if (!file || !code) return notFound();
  if (typeof picture === "string") {
    const out = removePicture(code, picture);
    if (out instanceof Response) return out;
    await writeFile(file, out);
    return new Response(null, { status: 204 });
  }
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
