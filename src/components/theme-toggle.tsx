"use client";

import { setTheme, useTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Tema sistemului",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <rect x="2" y="3" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Tema luminoasă",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.5 1.5M14.2 14.2l1.5 1.5M4.3 15.7l1.5-1.5M14.2 5.8l1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Tema întunecată",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** System / light / dark. The choice persists in the browser; "system" is the default. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  return (
    <div role="group" aria-label="Temă" className={`flex rounded-md border border-line bg-card p-0.5 ${className}`}>
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            aria-label={o.label}
            title={o.label}
            className={`rounded px-2 py-1.5 ${active ? "bg-ink text-on-ink" : "text-muted hover:bg-hover hover:text-ink"}`}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
