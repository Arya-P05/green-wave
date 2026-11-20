"use client";

// Dev-only inline editing: toggle "edit", then click a paragraph or heading and change its words in place. On blur
// (or enter) the new words go to app/api/edit, which writes them into the post's page.tsx; hot reload does the rest.
// Only plain-text blocks the route finds exactly once in the source are editable (dotted underline).
import { useEffect, useState } from "react";

const API = "/api/edit";
const TEXT = "main p, main li, main h1, main h2, main h3, main dt, main dd, main figcaption, main td, main th";

/** Blocks with nothing but text inside: links, emphasis or figures inside a block make it read-only. */
function plainBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(TEXT)].filter(
    (el) => el.childNodes.length > 0 && [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE) && el.textContent!.trim(),
  );
}

const words = (el: HTMLElement) => el.textContent!.replace(/\s+/g, " ").trim();

function DevEdit() {
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!on) return;
    const original = new Map<HTMLElement, string>();
    let cancelled = false;

    async function enable() {
      const blocks = plainBlocks();
      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify({ path: location.pathname, texts: blocks.map(words) }),
      });
      if (cancelled) return;
      if (!res.ok) return setStatus("no source file for this page");
      const counts: number[] = await res.json();
      blocks.forEach((el, i) => {
        if (counts[i] !== 1) return;
        original.set(el, words(el));
        el.contentEditable = "plaintext-only";
        el.dataset.editable = "";
      });
      setStatus(`${original.size} editable`);
    }

    async function save(el: HTMLElement) {
      const old = original.get(el)!;
      const text = words(el);
      if (text === old) return;
      setStatus("saving…");
      const res = await fetch(API, { method: "PUT", body: JSON.stringify({ path: location.pathname, old, text }) });
      if (!res.ok) {
        el.textContent = old;
        return setStatus(await res.text());
      }
      const saved: string = (await res.json()).text;
      if (saved !== text) el.textContent = saved;
      original.set(el, saved);
      setStatus("saved");
    }

    const onBlur = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (original.has(el)) save(el);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!original.has(el)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      } else if (e.key === "Escape") {
        el.textContent = original.get(el)!;
        el.blur();
      }
    };

    enable();
    document.addEventListener("focusout", onBlur);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("keydown", onKey);
      for (const el of original.keys()) {
        el.removeAttribute("contenteditable");
        delete el.dataset.editable;
      }
      setStatus("");
    };
  }, [on]);

  return (
    <div className="flex items-center gap-x-[8px]">
      {status && <span className="text-muted">{status}</span>}
      <button
        onClick={() => setOn(!on)}
        className={`border border-faint bg-canvas px-[8px] py-[2px] hover:text-ink ${on ? "text-ink" : "text-muted"}`}
      >
        {on ? "done editing" : "edit"}
      </button>
    </div>
  );
}

// Gated here as well as in Review (itself dev-only) so a production bundle drops the whole tool.
export const Edit = process.env.NODE_ENV === "development" ? DevEdit : () => null;
