"use client";

import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
      onClick={() => {
        const html = document.documentElement;
        const next = html.classList.contains("dark") ? "light" : "dark";
        html.classList.toggle("dark", next === "dark");
        localStorage.setItem("pesosense-theme", next);
      }}
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </button>
  );
}
