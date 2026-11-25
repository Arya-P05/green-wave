"use client";

// Dev-only review tool: select text (or click a paragraph) to leave a comment on it.
// Comments go to review/comments.json through app/api/review. Rendered only in `next dev`.
import { useEffect, useRef, useState } from "react";
import type { ReviewComment } from "@/app/api/review/route.dev";
import { assetPath } from "@/lib/shared/basePath";
import { Edit } from "./Edit";

type Draft = Pick<ReviewComment, "quote" | "section" | "figure"> & { left: number; top: number };

const API = assetPath("/api/review");
const WIDTH = 320;
const TEXT = "p, li, h1, h2, h3, dt, dd, figcaption, td, th";
const INTERACTIVE = "button, a, input, select, textarea, label, canvas, svg, [data-review], [contenteditable]";

function draftAt(target: Element): Draft | null {
  if (target.closest(INTERACTIVE)) return null;
  const selection = window.getSelection();
  const selected = selection?.toString().trim() ?? "";
  const block = target.closest(TEXT);
  if (!selected && !block) return null;
  const rect = selected ? selection!.getRangeAt(0).getBoundingClientRect() : block!.getBoundingClientRect();
  const figure = target.closest("figure");
  const figures = [...document.querySelectorAll("figure")];
  const text = selected || block!.textContent!.trim();
  return {
    quote: text.length > 200 ? text.slice(0, 200) + "…" : text,
    section: target.closest("section")?.querySelector("h2")?.textContent?.trim() ?? "top",
    figure: figure ? `figure ${figures.indexOf(figure) + 1}` : undefined,
    left: Math.max(8, Math.min(rect.left, window.innerWidth - WIDTH - 8)) + window.scrollX,
    top: rect.bottom + window.scrollY + 6,
  };
}

function DevReview() {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then(setComments);
  }, []);

  useEffect(() => {
    const onUp = (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-review]")) return;
      setDraft(draftAt(e.target as Element));
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDraft(null);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => input.current?.focus(), [draft]);

  async function add(text: string) {
    if (!draft || !text.trim()) return;
    const { quote, section, figure } = draft;
    const res = await fetch(API, { method: "POST", body: JSON.stringify({ quote, section, figure, text }) });
    setComments([...comments, await res.json()]);
    setDraft(null);
    window.getSelection()?.removeAllRanges();
  }

  async function remove(id: string) {
    await fetch(`${API}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setComments(comments.filter((c) => c.id !== id));
  }

  return (
    <div data-review className="text-[13px] leading-[20px]">
      {draft && (
        <form
          className="absolute z-50 grid gap-y-[6px] border border-faint bg-canvas p-[10px] shadow-sm"
          style={{ left: draft.left, top: draft.top, width: WIDTH }}
          onSubmit={(e) => {
            e.preventDefault();
            add(input.current!.value);
          }}
        >
          <span className="line-clamp-2 text-muted">
            {draft.section}
            {draft.figure && ` · ${draft.figure}`} · “{draft.quote}”
          </span>
          <input
            ref={input}
            placeholder="comment, enter to save, esc to close"
            className="border-b border-faint bg-transparent py-[2px] text-ink outline-none placeholder:text-muted focus:border-ink"
          />
        </form>
      )}
      <div className="fixed right-[16px] bottom-[16px] z-50 grid justify-items-end gap-y-[6px]">
        {open && (
          <ol className="grid max-h-[60vh] w-[340px] gap-y-[10px] overflow-y-auto border border-faint bg-canvas p-[10px]">
            {comments.length === 0 && <li className="text-muted">select text or click a paragraph to comment</li>}
            {comments.map((c) => (
              <li key={c.id} className="grid gap-y-[2px]">
                <span className="line-clamp-2 text-muted">
                  {c.section}
                  {c.figure && ` · ${c.figure}`} · “{c.quote}”
                </span>
                <span className="text-ink">{c.text}</span>
                <button onClick={() => remove(c.id)} className="justify-self-start text-muted underline hover:text-red">
                  delete
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="flex items-center gap-x-[8px]">
          <Edit />
          <button
            onClick={() => setOpen(!open)}
            className="border border-faint bg-canvas px-[8px] py-[2px] text-muted hover:text-ink"
          >
            comments ({comments.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// Gated here as well as in the layout so a production bundle drops the whole tool, not just its render.
export const Review = process.env.NODE_ENV === "development" ? DevReview : () => null;
