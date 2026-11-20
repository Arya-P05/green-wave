"use client";

// Dev-only inline editing: toggle "edit", then click a paragraph or heading and change its words in place. On blur
// (or enter) the new words go to app/api/edit, which writes them into the post's page.tsx; hot reload does the rest.
// Hovering or focusing a block shows "× delete", which (after a confirm) removes the whole block from page.tsx.
// Only plain-text blocks the route finds exactly once in the source are editable (dotted underline). If a save fails,
// the words stay as typed, the block turns red, and the reason shows right under it; esc puts the saved words back.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = "/api/edit";
const WIDTH = 320;
const TEXT = "main p, main li, main h1, main h2, main h3, main dt, main dd, main figcaption, main td, main th";

type Spot = { left: number; top: number };
type Problem = Spot & { message: string };
type Target = Spot & { el: HTMLElement };

/** Blocks with nothing but text inside: links, emphasis or figures inside a block make it read-only. */
function plainBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(TEXT)].filter(
    (el) => el.childNodes.length > 0 && [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE) && el.textContent!.trim(),
  );
}

const words = (el: HTMLElement) => el.textContent!.replace(/\s+/g, " ").trim();

/** Put words back without swapping out the text node React rendered, so hot reload can still update it. */
function setWords(el: HTMLElement, text: string) {
  const node = el.firstChild;
  if (el.childNodes.length === 1 && node?.nodeType === Node.TEXT_NODE) (node as Text).data = text;
  else el.textContent = text;
}

function below(el: HTMLElement): Spot {
  const rect = el.getBoundingClientRect();
  return {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - WIDTH - 8)) + window.scrollX,
    top: rect.bottom + window.scrollY + 6,
  };
}

/** Just right of the block's first line, or inside its right edge when there's no room. */
function beside(el: HTMLElement): Spot {
  const rect = el.getBoundingClientRect();
  return { left: Math.min(rect.right + 8, window.innerWidth - 90) + window.scrollX, top: rect.top + window.scrollY };
}

/** Resolves once hot reload has taken the block away (or reused its element for the next block), or after 5s. */
async function gone(el: HTMLElement, shown: string) {
  for (let t = 0; t < 50 && el.isConnected && words(el) === shown; t++) await new Promise((r) => setTimeout(r, 100));
}

function DevEdit() {
  const [on, setOn] = useState(false);
  const [scan, setScan] = useState(0);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const remove = useRef<(el: HTMLElement) => void>(() => {});

  useEffect(() => {
    if (!on) return;
    const saved = new Map<HTMLElement, string>();
    let cancelled = false;

    function fail(el: HTMLElement, message: string) {
      el.dataset.unsaved = "";
      setStatus("not saved");
      setProblem({ ...below(el), message: `not saved: ${message}. Fix it and click away to retry, or esc to undo.` });
    }

    function clear(el: HTMLElement) {
      delete el.dataset.unsaved;
      setProblem(null);
    }

    async function enable() {
      const blocks = plainBlocks();
      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify({ path: location.pathname, texts: blocks.map(words) }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res?.ok) return setStatus(res ? `can't edit this page (no app${location.pathname}/page.tsx)` : "dev server unreachable");
      const counts: number[] = await res.json();
      blocks.forEach((el, i) => {
        if (counts[i] !== 1) return;
        saved.set(el, words(el));
        el.contentEditable = "plaintext-only";
        el.dataset.editable = "";
      });
      setStatus(`${saved.size} editable`);
    }

    async function save(el: HTMLElement) {
      const old = saved.get(el)!;
      const text = words(el);
      if (text === old) return clear(el);
      setStatus("saving…");
      const res = await fetch(API, { method: "PUT", body: JSON.stringify({ path: location.pathname, old, text }) }).catch(
        () => null,
      );
      if (!res) return fail(el, "dev server unreachable");
      if (!res.ok) return fail(el, (await res.text()) || `error ${res.status}`);
      saved.set(el, (await res.json()).text);
      clear(el);
      setStatus("saved");
    }

    remove.current = async (el: HTMLElement) => {
      const old = saved.get(el);
      if (old === undefined) return;
      const quote = old.length > 140 ? old.slice(0, 140) + "…" : old;
      if (!window.confirm(`Delete this block from the page?\n\n“${quote}”`)) return;
      setStatus("deleting…");
      const res = await fetch(API, { method: "DELETE", body: JSON.stringify({ path: location.pathname, old }) }).catch(
        () => null,
      );
      if (!res?.ok) {
        const why = res ? (await res.text()) || `error ${res.status}` : "dev server unreachable";
        setStatus("not deleted");
        return setProblem({ ...below(el), message: `not deleted: ${why}. Nothing was changed.` });
      }
      setTarget(null);
      setProblem(null);
      setStatus("deleted");
      // Hot reload removes the block; then look again, since React may have handed its element to the next block.
      await gone(el, words(el));
      if (!cancelled) setScan((n) => n + 1);
    };

    const onBlur = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (saved.has(el)) save(el);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!saved.has(el)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      } else if (e.key === "Escape") {
        setWords(el, saved.get(el)!);
        clear(el);
        el.blur();
      }
    };
    const onPoint = (e: Event) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-editable]");
      if (el && saved.has(el)) setTarget({ el, ...beside(el) });
    };

    enable();
    document.addEventListener("focusout", onBlur);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mouseover", onPoint);
    document.addEventListener("focusin", onPoint);
    return () => {
      cancelled = true;
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mouseover", onPoint);
      document.removeEventListener("focusin", onPoint);
      for (const [el, text] of saved) {
        if (words(el) !== text) setWords(el, text);
        el.removeAttribute("contenteditable");
        delete el.dataset.editable;
        delete el.dataset.unsaved;
      }
      remove.current = () => {};
      setStatus("");
      setProblem(null);
      setTarget(null);
    };
  }, [on, scan]);

  return (
    <>
      {/* In the page, not the fixed corner, so these sit by the block and scroll with it. */}
      {problem &&
        createPortal(
          <p
            role="alert"
            data-review
            className="absolute z-50 border border-red bg-canvas p-[10px] text-[13px] leading-[20px] text-red"
            style={{ left: problem.left, top: problem.top, width: WIDTH }}
          >
            {problem.message}
          </p>,
          document.body,
        )}
      {target &&
        createPortal(
          <button
            data-review
            // Keep focus (and any unsaved words) in the block until the confirm.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => remove.current(target.el)}
            className="absolute z-50 border border-faint bg-canvas px-[6px] text-[13px] leading-[20px] text-muted hover:border-red hover:text-red"
            style={{ left: target.left, top: target.top }}
          >
            × delete
          </button>,
          document.body,
        )}
      <div className="flex items-center gap-x-[8px]">
        {status && <span className={problem ? "text-red" : "text-muted"}>{status}</span>}
        <button
          onClick={() => setOn(!on)}
          className={`border border-faint bg-canvas px-[8px] py-[2px] hover:text-ink ${on ? "text-ink" : "text-muted"}`}
        >
          {on ? "done editing" : "edit"}
        </button>
      </div>
    </>
  );
}

// Gated here as well as in Review (itself dev-only) so a production bundle drops the whole tool.
export const Edit = process.env.NODE_ENV === "development" ? DevEdit : () => null;
