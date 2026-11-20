"use client";

// Dev-only inline editing: toggle "edit", then click a paragraph or heading and change its words in place. On blur
// (or enter) the new words go to app/api/edit, which writes them into the post's page.tsx; hot reload does the rest.
// Hovering or focusing a block shows "× delete", which (after a confirm) removes the whole block from page.tsx.
// Section headings come from <Section title="…">: editing one rewrites that title (and its contents-list entry), and
// deleting one removes just the heading, never the section's paragraphs.
// "+ image" by any block picks a file and adds it as a <Picture /> right after that block; images (dashed outline)
// get "full / right" to sit full width or in the right margin beside the block above them, and "× delete".
// Only plain-text blocks the route finds exactly once in the source are editable (dotted underline). If a save fails,
// the words stay as typed, the block turns red, and the reason shows right under it; esc puts the saved words back.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = "/api/edit";
const WIDTH = 320;
const TEXT = "main p, main li, main h1, main h2, main h3, main dt, main dd, main figcaption, main td, main th";
/** The heading Section renders from its title prop (components/shared/Post.tsx). */
const HEADING = 'main section > h2[id$="-title"]';

type Spot = { left: number; top: number };
type Problem = Spot & { message: string };
type Kind = "text" | "heading" | "picture";
type Side = "full" | "right";
type Target = Spot & { el: HTMLElement; kind: Kind; side: Side };
type Actions = { remove: (el: HTMLElement) => void; add: (el: HTMLElement) => void; side: (el: HTMLElement, side: Side) => void };
const SIDES: Side[] = ["full", "right"];
const CONTROL = "border border-faint bg-canvas px-[6px] text-muted hover:text-ink";

/** Blocks with nothing but text inside: links, emphasis or figures inside a block make it read-only. */
function plainBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(TEXT)].filter(
    (el) =>
      !el.matches(HEADING) &&
      el.childNodes.length > 0 &&
      [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE) &&
      el.textContent!.trim(),
  );
}

const headings = () => [...document.querySelectorAll<HTMLElement>(HEADING)];
const figures = () => [...document.querySelectorAll<HTMLElement>("main figure[data-src]")];
const sideOf = (el: HTMLElement): Side => (el.dataset.side === "right" ? "right" : "full");

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

/** Just right of the block's top, or inside its right edge when there's no room. */
function beside(el: HTMLElement): Spot {
  const rect = el.getBoundingClientRect();
  return { left: Math.min(rect.right + 8, window.innerWidth - 130) + window.scrollX, top: rect.top + window.scrollY };
}

/** Resolves once `done()` is true (hot reload has shown the change), or after 5s. */
async function until(done: () => boolean) {
  for (let t = 0; t < 50 && !done(); t++) await new Promise((r) => setTimeout(r, 100));
}

/** The picked image's file and size, or null if nothing was picked. */
function pickImage(): Promise<{ file: File; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/gif,image/webp,image/avif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const bitmap = await createImageBitmap(file).catch(() => null);
      resolve(bitmap ? { file, width: bitmap.width, height: bitmap.height } : { file, width: 0, height: 0 });
      bitmap?.close();
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function DevEdit() {
  const [on, setOn] = useState(false);
  const [scan, setScan] = useState(0);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const actions = useRef<Actions | null>(null);

  useEffect(() => {
    if (!on) return;
    const saved = new Map<HTMLElement, string>();
    // Headings, by the id of the section whose title they are.
    const sections = new Map<HTMLElement, string>();
    // Images, by their src.
    const pictures = new Map<HTMLElement, string>();
    let cancelled = false;
    const kind = (el: HTMLElement): Kind => (pictures.has(el) ? "picture" : sections.has(el) ? "heading" : "text");
    const path = location.pathname;

    /** Shows why something failed right under the block; nothing was changed. */
    async function refuse(el: HTMLElement, what: string, res: Response | null) {
      const why = res ? (await res.text()) || `error ${res.status}` : "dev server unreachable";
      setStatus(`not ${what}`);
      setProblem({ ...below(el), message: `not ${what}: ${why}. Nothing was changed.` });
    }

    /** After a change that adds, moves or removes blocks: wait for hot reload, then look at the page again. */
    async function rescan(done: () => boolean) {
      setTarget(null);
      setProblem(null);
      await until(done);
      if (!cancelled) setScan((n) => n + 1);
    }

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
      const titles = headings();
      const images = figures();
      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          path,
          texts: blocks.map(words),
          titles: titles.map((el) => ({ section: el.parentElement!.id, title: words(el) })),
          pictures: images.map((el) => el.dataset.src),
        }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res?.ok) return setStatus(res ? `can't edit this page (no app${location.pathname}/page.tsx)` : "dev server unreachable");
      const counts: { texts: number[]; titles: number[]; pictures: number[] } = await res.json();
      const editable = (el: HTMLElement) => {
        saved.set(el, words(el));
        el.contentEditable = "plaintext-only";
        el.dataset.editable = "";
      };
      blocks.forEach((el, i) => counts.texts[i] === 1 && editable(el));
      titles.forEach((el, i) => {
        if (counts.titles[i] !== 1) return;
        sections.set(el, el.parentElement!.id);
        editable(el);
      });
      images.forEach((el, i) => {
        if (counts.pictures[i] !== 1) return;
        pictures.set(el, el.dataset.src!);
        el.dataset.picture = "";
      });
      setStatus(`${saved.size} editable${pictures.size ? `, ${pictures.size} image${pictures.size > 1 ? "s" : ""}` : ""}`);
    }

    async function save(el: HTMLElement) {
      const old = saved.get(el)!;
      const text = words(el);
      if (text === old) return clear(el);
      setStatus("saving…");
      const body = JSON.stringify({ path, section: sections.get(el), old, text });
      const res = await fetch(API, { method: "PUT", body }).catch(() => null);
      if (!res) return fail(el, "dev server unreachable");
      if (!res.ok) return fail(el, (await res.text()) || `error ${res.status}`);
      saved.set(el, (await res.json()).text);
      clear(el);
      setStatus("saved");
    }

    async function remove(el: HTMLElement) {
      const src = pictures.get(el);
      const old = saved.get(el);
      const quote = old && (old.length > 140 ? old.slice(0, 140) + "…" : old);
      const question =
        src !== undefined
          ? `Delete this image from the page?\n\n${src}\n\nIts file stays in public/.`
          : sections.has(el)
            ? `Delete the heading “${quote}”?\n\nOnly the heading (and its line in the contents) goes. The section’s paragraphs stay.`
            : `Delete this block from the page?\n\n“${quote}”`;
      if (!window.confirm(question)) return;
      setStatus("deleting…");
      const body = JSON.stringify(src !== undefined ? { path, picture: src } : { path, section: sections.get(el), old });
      const res = await fetch(API, { method: "DELETE", body }).catch(() => null);
      if (!res?.ok) return refuse(el, "deleted", res);
      setStatus("deleted");
      // Hot reload removes the block; then look again, since React may have handed its element to the next block.
      const shown = src ?? words(el);
      await rescan(() => !el.isConnected || (src !== undefined ? el.dataset.src : words(el)) !== shown);
    }

    async function add(el: HTMLElement) {
      const picked = await pickImage();
      if (!picked) return;
      const alt = window.prompt("Describe the image for someone who can’t see it (alt text):")?.trim();
      if (!alt) return;
      const caption = window.prompt("Caption (optional, shown under the image):") ?? "";
      const anchor =
        kind(el) === "picture"
          ? { picture: pictures.get(el) }
          : kind(el) === "heading"
            ? { section: sections.get(el), title: saved.get(el) }
            : { text: saved.get(el) };
      const form = new FormData();
      form.set("path", path);
      form.set("after", JSON.stringify(anchor));
      form.set("file", picked.file);
      form.set("alt", alt);
      form.set("caption", caption);
      form.set("width", String(picked.width));
      form.set("height", String(picked.height));
      setStatus("adding image…");
      const res = await fetch(API, { method: "POST", body: form }).catch(() => null);
      if (!res?.ok) return refuse(el, "added", res);
      const { src } = await res.json();
      setStatus("image added");
      await rescan(() => !!document.querySelector(`main figure[data-src="${CSS.escape(src)}"]`));
    }

    async function side(el: HTMLElement, to: Side) {
      const src = pictures.get(el);
      if (src === undefined || sideOf(el) === to) return;
      setStatus("moving…");
      const res = await fetch(API, { method: "PUT", body: JSON.stringify({ path, picture: src, side: to }) }).catch(() => null);
      if (!res?.ok) return refuse(el, "moved", res);
      setStatus(to === "full" ? "full width" : "in the right margin");
      await rescan(() => {
        const now = document.querySelector<HTMLElement>(`main figure[data-src="${CSS.escape(src)}"]`);
        return !!now && sideOf(now) === to;
      });
    }

    actions.current = { remove, add, side };

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
      const el = (e.target as Element).closest<HTMLElement>("[data-editable], [data-picture]");
      if (el && (saved.has(el) || pictures.has(el))) setTarget({ el, kind: kind(el), side: sideOf(el), ...beside(el) });
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
      for (const el of pictures.keys()) delete el.dataset.picture;
      actions.current = null;
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
          <div
            data-review
            // Keep focus (and any unsaved words) in the block until a button has done its thing.
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-50 grid justify-items-start gap-y-[4px] text-[13px] leading-[20px]"
            style={{ left: target.left, top: target.top }}
          >
            {target.kind === "picture" && (
              <div className="flex border border-faint bg-canvas">
                {SIDES.map((s) => (
                  <button
                    key={s}
                    onClick={() => actions.current?.side(target.el, s)}
                    className={`px-[6px] hover:text-ink ${target.side === s ? "bg-faint text-ink" : "text-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => actions.current?.add(target.el)} className={CONTROL}>
              + image
            </button>
            <button onClick={() => actions.current?.remove(target.el)} className={`${CONTROL} hover:border-red hover:text-red`}>
              {target.kind === "heading" ? "× delete heading" : "× delete"}
            </button>
          </div>,
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
