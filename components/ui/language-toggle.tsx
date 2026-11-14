"use client";

import { useLocale } from "@/lib/i18n";

/** Compact EN | TR language switcher synced via localStorage and custom event. */
export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.nav.switchLang}
      title={t.nav.switchLang}
      className="h-9 px-2.5 rounded-lg bezel flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer select-none"
    >
      <span className={locale === "en" ? "text-[var(--accent)] font-semibold" : "opacity-55"}>
        EN
      </span>
      <span className="opacity-30">/</span>
      <span className={locale === "tr" ? "text-[var(--accent)] font-semibold" : "opacity-55"}>
        TR
      </span>
    </button>
  );
}
