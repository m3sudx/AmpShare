import { useCallback, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "ampshare-theme";

// The saved choice, or the computer's setting on a first visit
export function getPreferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage blocked */
  }
  return "light"; // default, even if the computer is set to dark
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* the theme still applies for this visit */
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}

// Call this on pages that must always stay light (the landing page).
// It removes dark mode while the page is open and restores the saved choice on leave.
export function useLightOnly() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    return () => {
      if (getPreferredTheme() === "dark") root.classList.add("dark");
    };
  }, []);
}