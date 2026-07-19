"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
