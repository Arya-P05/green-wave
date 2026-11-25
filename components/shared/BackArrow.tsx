"use client";

import type { CSSProperties } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { BASE_PATH } from "@/lib/shared/basePath";

const STORAGE_KEY = "arya-writing-from";

// Tracks SPA navigation from /writing -> /writing/[slug] within the same document runtime,
// where document.referrer still holds the previous cross-document referrer (e.g. "/").
let visitedIndexInSession = false;

const subscribe = () => () => {};
const getServerSnapshot = () => false;

function isFromHome(): boolean {
  if (visitedIndexInSession) return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "home") return true;
  } catch {
    // Ignore storage access errors in restricted contexts.
  }
  if (document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === location.origin && ref.pathname === "/") return true;
    } catch {
      // Ignore malformed referrer URLs.
    }
  }
  return false;
}

export default function BackArrow({
  mode,
  className,
  style,
}: {
  mode: "essay" | "index";
  className?: string;
  style?: CSSProperties;
}) {
  const fromHome = useSyncExternalStore(
    subscribe,
    mode === "essay" ? isFromHome : getServerSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (mode !== "index") return;
    visitedIndexInSession = true;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors in restricted contexts.
    }
  }, [mode]);

  const href = mode === "index" || fromHome ? "/" : BASE_PATH;
  const label = mode === "index" || fromHome ? "Back to home" : "Back to writing";
  const classes = className ? `back-arrow ${className}` : "back-arrow";

  return (
    <a href={href} aria-label={label} className={classes} style={style}>
      ←
    </a>
  );
}
