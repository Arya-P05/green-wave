// Dev-only (a .dev.ts file, see next.config.ts): Arya’s review comments while reading the post, kept in review/comments.json
// (gitignored). Every method is a 404 outside `next dev`.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export type ReviewComment = {
  id: string;
  at: string;
  quote: string;
  section: string;
  figure?: string;
  text: string;
};

const DIR = path.join(process.cwd(), "review");
const FILE = path.join(DIR, "comments.json");
const dev = process.env.NODE_ENV === "development";
const notFound = () => new Response(null, { status: 404 });

async function load(): Promise<ReviewComment[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function save(comments: ReviewComment[]): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(comments, null, 2) + "\n");
}

export async function GET() {
  if (!dev) return notFound();
  return Response.json(await load());
}

export async function POST(request: Request) {
  if (!dev) return notFound();
  const { quote, section, figure, text } = await request.json();
  if (typeof text !== "string" || !text.trim()) return new Response("text is required", { status: 400 });
  const comment: ReviewComment = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    quote: String(quote ?? ""),
    section: String(section ?? ""),
    ...(figure ? { figure: String(figure) } : {}),
    text: text.trim(),
  };
  await save([...(await load()), comment]);
  return Response.json(comment);
}

export async function DELETE(request: Request) {
  if (!dev) return notFound();
  const id = new URL(request.url).searchParams.get("id");
  const comments = await load();
  const kept = comments.filter((c) => c.id !== id);
  if (kept.length === comments.length) return notFound();
  await save(kept);
  return new Response(null, { status: 204 });
}
