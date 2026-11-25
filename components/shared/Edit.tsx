"use client";

// Dev-only inline editing: toggle "edit" (or press E), then click a paragraph or heading and change its words in place. On blur
// (or enter) the new words go to app/api/edit, which writes them into the post's page.tsx; hot reload does the rest.
// Hovering or focusing a block shows "× delete", which (after a confirm) removes the whole block from page.tsx.
// Section headings come from <Section title="…">: editing one rewrites that title (and its contents-list entry), and
// deleting one removes just the heading, never the section's paragraphs.
// "+ image" by any block picks a file and adds it as a <Picture /> right after that block; images (dashed outline)
// get "full / right" to sit full width or in the right margin, and "× delete".
// Shift+enter in a paragraph splits it at the cursor: the words after it become a new paragraph right below (same tag),
// and the cursor moves there. At the very end it opens an empty paragraph, saved on blur only if something was typed.
// The right margin (screens 1280px and wider) is a free column: hovering it shows "+ image here" at that height, and
// margin images drag up and down. Either way the image is stored after the block it starts beside, with offset = px
// from that block's top (see Picture); on narrower screens it shows right after that block.
// Image captions and notes (Picture's props) are editable the same way, on one line (shift+enter just saves).
// Only plain-text blocks the route finds exactly once in the source are editable (dotted underline). If a save fails,
// the words stay as typed, the block turns red, and the reason shows right under it; esc puts the saved words back.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetPath, stripBasePath } from "@/lib/shared/basePath";

const API = assetPath("/api/edit");
const WIDTH = 320;
/** Image captions and notes: the text of a Picture prop, not of a JSX child. */
const PROP = "main figure[data-src] [data-prop]";
const TEXT = "main p, main li, main h1, main h2, main h3, main dt, main dd, main figcaption, main td, main th";
/** The heading Section renders from its title prop (components/shared/Post.tsx). */
const HEADING = 'main section > h2[id$="-title"]';

type Spot = { left: number; top: number };
type Problem = Spot & { message: string };
type Kind = "text" | "heading" | "picture";
type Side = "full" | "right";
type Target = Spot & { el: HTMLElement; kind: Kind; side: Side };
type Actions = {
  remove: (el: HTMLElement) => void;
  add: (el: HTMLElement) => void;
  side: (el: HTMLElement, side: Side) => void;
  addAt: (y: number) => void;
};
/** "+ image here" in the margin: where it's drawn, and the page y (px from the top of the document) it adds at. */
type Slot = Spot & { y: number };
/** Below this the margin column doesn't exist (globals.css, 80rem). */
const MARGIN_MIN = 1280;
const SIDES: Side[] = ["full", "right"];
const CONTROL = "border border-faint bg-canvas px-[6px] text-muted hover:text-ink";

/** Blocks with nothing but text inside: links, emphasis or figures inside a block make it read-only. */
function plainBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`${TEXT}, ${PROP}`)].filter(
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
const pageTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
const hasMargin = () => window.innerWidth >= MARGIN_MIN;

/** Where the text column ends: the right edge of the widest paragraph (they all share the 64ch measure). */
function textRight(): number | null {
  const rights = [...document.querySelectorAll<HTMLElement>("main section > p")].map((p) => p.getBoundingClientRect().right);
  return rights.length ? Math.max(...rights) : null;
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

/** Just right of the block's top, or inside its right edge when there's no room. */
function beside(el: HTMLElement): Spot {
  const rect = el.getBoundingClientRect();
  return { left: Math.min(rect.right + 8, window.innerWidth - 130) + window.scrollX, top: rect.top + window.scrollY };
}

/** Where the selection starts and ends in el, as character offsets into its text, or null if it isn't inside el. */
function caret(el: HTMLElement): [number, number] | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const upTo = document.createRange();
  upTo.selectNodeContents(el);
  upTo.setEnd(range.startContainer, range.startOffset);
  const start = upTo.toString().length;
  upTo.setEnd(range.endContainer, range.endOffset);
  return [start, upTo.toString().length];
}

/** Focus el with the cursor at its start or end. */
function focusAt(el: HTMLElement, end: boolean) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(!end);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
}

const fold = (text: string) => text.replace(/\s+/g, " ").trim();

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
  const [slot, setSlot] = useState<Slot | null>(null);
  const actions = useRef<Actions | null>(null);
  // A paragraph a split just made: focused (at its start, or its end) once hot reload shows it and it's editable again.
  const focusNext = useRef<{ text: string; end: boolean } | null>(null);

  // E (no modifiers) turns edit mode on and off, except while typing in a field or an editable block.
  useEffect(() => {
    const onE = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "e" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.isContentEditable || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setOn((v) => !v);
    };
    document.addEventListener("keydown", onE);
    return () => document.removeEventListener("keydown", onE);
  }, []);

  useEffect(() => {
    if (!on) return;
    const saved = new Map<HTMLElement, string>();
    // Headings, by the id of the section whose title they are.
    const sections = new Map<HTMLElement, string>();
    // Picture captions and notes, by the prop they are.
    const props = new Map<HTMLElement, string>();
    // Images, by their src.
    const pictures = new Map<HTMLElement, string>();
    let cancelled = false;
    // Set when hot reload has just rewritten the page: blocks then hold the new source's words, not ours to put back.
    let reloaded = false;
    const kind = (el: HTMLElement): Kind => (pictures.has(el) ? "picture" : sections.has(el) ? "heading" : "text");
    const path = stripBasePath(location.pathname);

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
      reloaded = true;
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
          texts: blocks.map((el) => (el.dataset.prop ? "" : words(el))),
          props: blocks.map((el) => ({ prop: el.dataset.prop ?? "", text: words(el) })),
          titles: titles.map((el) => ({ section: el.parentElement!.id, title: words(el) })),
          pictures: images.map((el) => el.dataset.src),
        }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res?.ok) return setStatus(res ? `can't edit this page (no app${path === "/" ? "" : path}/page.tsx)` : "dev server unreachable");
      const counts: { texts: number[]; props: number[]; titles: number[]; pictures: number[] } = await res.json();
      const editable = (el: HTMLElement) => {
        saved.set(el, words(el));
        el.contentEditable = "plaintext-only";
        el.dataset.editable = "";
      };
      blocks.forEach((el, i) => {
        const prop = el.dataset.prop;
        if ((prop ? counts.props[i] : counts.texts[i]) !== 1) return;
        if (prop) props.set(el, prop);
        editable(el);
      });
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
      const next = focusNext.current;
      focusNext.current = null;
      const made = next && [...saved].find(([el, text]) => !sections.has(el) && text === next.text)?.[0];
      if (made) focusAt(made, next.end);
      setStatus(`${saved.size} editable${pictures.size ? `, ${pictures.size} image${pictures.size > 1 ? "s" : ""}` : ""}`);
    }

    // Empty paragraphs opened by shift+enter at the end of a block, by that block; only in the page until saved.
    const drafts = new Map<HTMLElement, HTMLElement>();
    // Drafts left with shift+enter: once saved, the cursor goes to the end of the new paragraph, ready for another.
    const again = new Set<HTMLElement>();
    let saving: Promise<void> = Promise.resolve();

    /**
     * Saves el as `head` plus a new paragraph after it holding `tail`, then moves the cursor to the new one's start or
     * end (or leaves focus alone, with null).
     */
    async function splitSave(el: HTMLElement, head: string, tail: string, end: boolean | null): Promise<boolean> {
      setStatus("saving…");
      const body = JSON.stringify({ path, old: saved.get(el), text: head, split: tail });
      const res = await fetch(API, { method: "PUT", body }).catch(() => null);
      if (!res) return (fail(el, "dev server unreachable"), false);
      if (!res.ok) return (fail(el, (await res.text()) || `error ${res.status}`), false);
      const { text, split } = await res.json();
      saved.set(el, text);
      setWords(el, text);
      clear(el);
      setStatus("new paragraph");
      focusNext.current = end === null ? null : { text: split, end };
      await rescan(() => plainBlocks().some((b) => b.dataset.draft === undefined && words(b) === split));
      return true;
    }

    /** Shift+enter: split at the cursor, or at the very end open an empty paragraph below to type into. */
    async function split(el: HTMLElement) {
      const at = caret(el);
      if (!at) return;
      const raw = el.textContent ?? "";
      const [head, tail] = [fold(raw.slice(0, at[0])), fold(raw.slice(at[1]))];
      if (!head) return setStatus("can't split at the very start");
      if (tail) return void splitSave(el, head, tail, false);
      const draft = document.createElement(el.tagName);
      draft.className = el.className;
      draft.contentEditable = "plaintext-only";
      draft.dataset.editable = "";
      draft.dataset.draft = "";
      el.after(draft);
      drafts.set(draft, el);
      draft.focus();
    }

    /** A draft lost focus: gone if it's empty, otherwise added as a new paragraph after its block. */
    async function commitDraft(draft: HTMLElement) {
      const el = drafts.get(draft)!;
      const tail = words(draft);
      if (!tail) {
        drafts.delete(draft);
        return draft.remove();
      }
      await saving;
      const ok = await splitSave(el, saved.get(el)!, tail, again.has(draft) ? true : null);
      if (!ok) setProblem((p) => p && { ...p, message: `${p.message.replace(/ Fix it.*$/, "")} Your new paragraph wasn't added.` });
    }

    async function save(el: HTMLElement) {
      const old = saved.get(el)!;
      const text = words(el);
      if (text === old) return clear(el);
      setStatus("saving…");
      const body = JSON.stringify({ path, section: sections.get(el), prop: props.get(el), old, text });
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

    /** How the route finds a block to put an image after. */
    const anchorOf = (el: HTMLElement) =>
      kind(el) === "picture"
        ? { picture: pictures.get(el) }
        : kind(el) === "heading"
          ? { section: sections.get(el), title: saved.get(el) }
          : { text: saved.get(el) };

    /**
     * The block a margin image whose top is at page y starts beside: the last block (paragraph, heading or full-width
     * image directly in a section, that the route can find) whose top is at or above y, or the first one.
     */
    function anchorAt(y: number): { el: HTMLElement; top: number } | null {
      const blocks = [...saved.keys(), ...pictures.keys()]
        .filter((el) => el.parentElement?.tagName === "SECTION" && el.isConnected && !(pictures.has(el) && sideOf(el) === "right"))
        .map((el) => ({ el, top: pageTop(el) }))
        .sort((a, b) => a.top - b.top);
      return blocks.filter((b) => b.top <= y).at(-1) ?? blocks[0] ?? null;
    }

    async function add(el: HTMLElement, margin?: { offset: number }) {
      const picked = await pickImage();
      if (!picked) return;
      const alt = window.prompt("Describe the image for someone who can’t see it (alt text):")?.trim();
      if (!alt) return;
      const caption = window.prompt("Caption (optional, shown under the image):") ?? "";
      const anchor = anchorOf(el);
      const form = new FormData();
      form.set("path", path);
      form.set("after", JSON.stringify(anchor));
      form.set("file", picked.file);
      form.set("alt", alt);
      form.set("caption", caption);
      form.set("width", String(picked.width));
      form.set("height", String(picked.height));
      if (margin) {
        form.set("side", "right");
        form.set("offset", String(margin.offset));
      }
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

    /** "+ image here" in the margin at page y. */
    async function addAt(y: number) {
      const at = anchorAt(y);
      if (!at) return setStatus("nothing on this page to place an image beside");
      setSlot(null);
      await add(at.el, { offset: Math.round(y - at.top) });
    }

    /** Dropping a dragged margin image: its new top decides the block it's after and the offset from that block. */
    async function drop(el: HTMLElement, top: number) {
      const src = pictures.get(el)!;
      const at = anchorAt(top);
      const undrag = () => (el.style.transform = "");
      if (!at) return undrag();
      const offset = Math.round(top - at.top);
      setStatus("moving…");
      const body = JSON.stringify({ path, picture: src, after: anchorOf(at.el), offset });
      const res = await fetch(API, { method: "PUT", body }).catch(() => null);
      if (!res?.ok) {
        undrag();
        return refuse(el, "moved", res);
      }
      setStatus("moved");
      await rescan(() => {
        const now = document.querySelector<HTMLElement>(`main figure[data-src="${CSS.escape(src)}"]`);
        return !!now && now.style.getPropertyValue("--offset") === `${offset}px`;
      });
      undrag();
    }

    actions.current = { remove, add, side, addAt };

    const onBlur = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (saved.has(el)) saving = save(el);
      else if (drafts.has(el)) commitDraft(el);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (drafts.has(el)) {
        if (e.key === "Escape") el.textContent = "";
        if (e.key === "Enter" && e.shiftKey) again.add(el);
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          el.blur();
        }
        return;
      }
      if (!saved.has(el)) return;
      if (e.key === "Enter" && e.shiftKey && !sections.has(el) && !props.has(el)) {
        e.preventDefault();
        split(el);
      } else if (e.key === "Enter") {
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
      if (el && !props.has(el) && (saved.has(el) || pictures.has(el))) setTarget({ el, kind: kind(el), side: sideOf(el), ...beside(el) });
    };

    // Dragging a margin image: it follows the pointer up and down, and is saved where it's let go.
    let dragging: { el: HTMLElement; startY: number; top: number } | null = null;

    // "+ image here" follows the pointer down the empty margin, beside the article, but not over images or controls.
    const onMove = (e: MouseEvent) => {
      const over = e.target as Element;
      if (over.closest("[data-slot]") || dragging) return;
      const right = textRight();
      const main = document.querySelector("main section")?.closest("main, article");
      const box = main?.getBoundingClientRect();
      const inMargin =
        hasMargin() &&
        right !== null &&
        box &&
        e.clientX > right + 12 &&
        e.clientY > box.top &&
        e.clientY < box.bottom &&
        !over.closest("[data-picture], [data-review], a, button");
      setSlot(inMargin ? { left: right + 24 + window.scrollX, top: e.pageY - 10, y: e.pageY } : null);
    };

    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-picture]");
      if (!el || !pictures.has(el) || sideOf(el) !== "right" || !hasMargin() || e.button !== 0) return;
      e.preventDefault();
      dragging = { el, startY: e.pageY, top: pageTop(el) };
      setTarget(null);
      setSlot(null);
    };
    const onDrag = (e: PointerEvent) => {
      if (dragging) dragging.el.style.transform = `translateY(${e.pageY - dragging.startY}px)`;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      const { el, startY, top } = dragging;
      dragging = null;
      const dy = e.pageY - startY;
      if (Math.abs(dy) < 3) el.style.transform = "";
      else drop(el, top + dy);
    };

    enable();
    document.addEventListener("focusout", onBlur);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mouseover", onPoint);
    document.addEventListener("focusin", onPoint);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onDrag);
    document.addEventListener("pointerup", onUp);
    return () => {
      cancelled = true;
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mouseover", onPoint);
      document.removeEventListener("focusin", onPoint);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onDrag);
      document.removeEventListener("pointerup", onUp);
      for (const [el, text] of saved) {
        // Turning edit mode off drops unsaved words; after a reload, React may have reused this element for another block.
        if (!reloaded && words(el) !== text) setWords(el, text);
        el.removeAttribute("contenteditable");
        delete el.dataset.editable;
        delete el.dataset.unsaved;
      }
      for (const el of pictures.keys()) delete el.dataset.picture;
      for (const draft of drafts.keys()) draft.remove();
      actions.current = null;
      setStatus("");
      setProblem(null);
      setTarget(null);
      setSlot(null);
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
            {target.side !== "right" && (
              <button onClick={() => actions.current?.add(target.el)} className={CONTROL}>
                + image
              </button>
            )}
            <button onClick={() => actions.current?.remove(target.el)} className={`${CONTROL} hover:border-red hover:text-red`}>
              {target.kind === "heading" ? "× delete heading" : "× delete"}
            </button>
          </div>,
          document.body,
        )}
      {slot &&
        createPortal(
          <button
            data-review
            data-slot
            onClick={() => actions.current?.addAt(slot.y)}
            className={`absolute z-50 text-[13px] leading-[20px] ${CONTROL}`}
            style={{ left: slot.left, top: slot.top }}
          >
            + image here
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
