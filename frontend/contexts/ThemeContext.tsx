"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AccentKey = "blue" | "gold" | "wine" | "mono";
export type ModeKey = "light" | "dark";

export const ACCENT_CONFIGS: Record<
  AccentKey,
  { light: string; lightFg: string; dark: string; darkFg: string; swatch: string; label: string }
> = {
  blue: { light: "#69aaff", lightFg: "#ffffff", dark: "#69aaff", darkFg: "#0a1628", swatch: "#69aaff", label: "Blue" },
  gold: { light: "#8556f5", lightFg: "#1a1a1a", dark: "#aa86fd", darkFg: "#1a0f00", swatch: "#8556f5", label: "Gold" },
  wine: { light: "#8a3b46", lightFg: "#ffffff", dark: "#b13943", darkFg: "#ffffff", swatch: "#803741", label: "Wine" },
  mono: { light: "#1a1a1a", lightFg: "#ffffff", dark: "#e0e0e0", darkFg: "#111111", swatch: "#888888", label: "B/W" },
};

interface ThemeContextValue {
  mode: ModeKey;
  accent: AccentKey;
  setMode: (m: ModeKey) => void;
  setAccent: (a: AccentKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ModeKey, accent: AccentKey) {
  const el = document.documentElement;
  const cfg = ACCENT_CONFIGS[accent];
  const color = mode === "dark" ? cfg.dark : cfg.light;
  const fg = mode === "dark" ? cfg.darkFg : cfg.lightFg;
  el.setAttribute("data-theme", mode);
  el.style.setProperty("--accent", color);
  el.style.setProperty("--accent-foreground", fg);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ModeKey>("light");
  const [accent, setAccentState] = useState<AccentKey>("wine");

  useEffect(() => {
    const savedMode = (localStorage.getItem("theme-mode") as ModeKey) ?? "light";
    const savedAccent = (localStorage.getItem("theme-accent") as AccentKey) ?? "wine";
    setModeState(savedMode);
    setAccentState(savedAccent);
    applyTheme(savedMode, savedAccent);
  }, []);

  const setMode = (m: ModeKey) => {
    setModeState(m);
    localStorage.setItem("theme-mode", m);
    applyTheme(m, accent);
  };

  const setAccent = (a: AccentKey) => {
    setAccentState(a);
    localStorage.setItem("theme-accent", a);
    applyTheme(mode, a);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
