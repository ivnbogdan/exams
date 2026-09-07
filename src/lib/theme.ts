"use client";

import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "theme";
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Applies the choice to <html>. "system" removes the override so prefers-color-scheme decides. */
export function applyTheme(t: Theme) {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
}

export function setTheme(t: Theme) {
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // storage unavailable: the choice still applies for this page
  }
  applyTheme(t);
  listeners.forEach((l) => l());
}

/** Current choice; "system" during server rendering and hydration. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "system");
}

/** Inline script for <head>: applies a stored choice before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})();`;
