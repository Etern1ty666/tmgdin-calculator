import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";

// Persisted mode: 'system' | 'light' | 'dark'
const STORAGE_KEY = "theme-mode";

const ThemeCtx = createContext({
  mode: "system",
  theme: "light", // resolved theme: 'light' | 'dark'
  toggle: () => {},
  setMode: (_m) => {},
});

export const useAntdTheme = () => useContext(ThemeCtx);

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function AntdThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });

  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "light" || saved === "dark") return saved;
    return getSystemTheme();
  });

  // Watch system changes only when in system mode
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (mode === "system") setTheme(e.matches ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener && mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener && mq.removeListener(handler);
    };
  }, [mode]);

  useEffect(() => {
    // Persist explicit mode (system/light/dark)
    localStorage.setItem(STORAGE_KEY, mode === "system" ? "system" : theme);
  }, [mode, theme]);
  // Compact mode toggled by viewport width
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 700);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", onResize);
      }
    };
  }, []);

  // Algorithm(s) selection
  const baseAlgorithm = theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
  const algorithms = useMemo(
    () => (isCompact ? [baseAlgorithm, antdTheme.compactAlgorithm] : [baseAlgorithm]),
    [baseAlgorithm, isCompact]
  );

  // Optional: you can customize brand tokens for both themes
  const token = useMemo(() => {
    if (theme === "dark") {
      return {
        colorPrimary: "#32789B",
        colorBgBase: "#1B1B1B",
        colorTextBase: "#fff",
        borderRadius: 12,
      };
    }
    return {
      colorPrimary: "#5894B3",
      colorBgBase: "#ffffff",
      colorTextBase: "#000",
      borderRadius: 12,
    };
  }, [theme]);

  // Apply body background and text color to follow AntD tokens and set data-theme attribute
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBg = document.body.style.background;
    const prevColor = document.body.style.color;
    const prevDataTheme = document.documentElement.getAttribute("data-theme");
    document.body.style.background = token.colorBgBase || "";
    document.body.style.color = token.colorTextBase || "";
    document.documentElement.setAttribute("data-theme", theme);
    // Hint the browser about light/dark for form controls
    try {
      document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    } catch (e) {
      /* ignore */
    }
    return () => {
      document.body.style.background = prevBg;
      document.body.style.color = prevColor;
      if (prevDataTheme) document.documentElement.setAttribute("data-theme", prevDataTheme);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, [token, theme]);

  const toggle = () => {
    // Toggle between light and dark explicitly. Use explicit mode so UI (Appearance panel)
    // can reflect the chosen value ('light' or 'dark') instead of an opaque 'user'.
    const next = theme === "dark" ? "light" : "dark";
    setMode(next);
    setTheme(next);
  };

  // Helper to set theme mode from UI: 'system' | 'light' | 'dark'
  const setThemeMode = (value) => {
    if (value === "system") {
      setMode("system");
      setTheme(getSystemTheme());
    } else if (value === "light" || value === "dark") {
      setMode(value);
      setTheme(value);
    }
  };

  const ctx = useMemo(() => ({ mode, theme, toggle, setMode, setThemeMode }), [mode, theme]);

  // Set global dayjs locale to Russian
  try {
    dayjs.locale("ru");
  } catch (e) {
    /* ignore */
  }

  return (
    <ThemeCtx.Provider value={ctx}>
      <ConfigProvider theme={{ algorithm: algorithms, token }} locale={ruRU}>
        {children}
      </ConfigProvider>
    </ThemeCtx.Provider>
  );
}
