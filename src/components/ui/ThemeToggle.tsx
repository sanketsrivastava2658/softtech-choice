"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * Flips the `data-theme` attribute on <html> and persists to localStorage.
 * The no-flash script in the root layout sets the initial value before paint;
 * this component just syncs its label to whatever is already there.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("ot-theme", next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="cursor-pointer rounded-input border border-line bg-surface px-3 py-[6px] font-mono text-[12px] text-muted transition-colors hover:border-line-strong hover:text-text"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      ◑ {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
