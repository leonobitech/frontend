"use client";

import { useEffect, useState } from "react";

export type ThemeValue = "light" | "dark" | "system";

export function useThemeWatcher() {
  const getInitial = (): ThemeValue =>
    (localStorage.getItem("theme") as ThemeValue) || "system";

  const [theme, setThemeState] = useState<ThemeValue>(getInitial);

  // 🔁 Verifica cambios externos en localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getInitial();
      setThemeState((prev) => (prev !== current ? current : prev));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // 🔄 Actualiza estado + localStorage
  const setTheme = (newTheme: ThemeValue) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  // 🔃 Rota el estado entre system → dark → light
  const toggleTheme = () => {
    setTheme(
      theme === "system" ? "dark" : theme === "dark" ? "light" : "system"
    );
  };

  return { theme, setTheme, toggleTheme };
}
