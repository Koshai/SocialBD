"use client";

import { usePreferences } from "./preferences-provider";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

function SegmentGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div
        role="group"
        aria-label={ariaLabel}
        className="inline-flex rounded-lg border border-border bg-background p-0.5"
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                active ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground",
              ].join(" ")}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppearanceControls() {
  const { locale, theme, setLocale, setTheme, t } = usePreferences();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-2 sm:flex-row sm:items-end sm:gap-4">
      <SegmentGroup
        label={t("appearance.language")}
        ariaLabel={t("appearance.language")}
        value={locale}
        onChange={setLocale}
        options={[
          { value: "en", label: t("appearance.english") },
          { value: "bn", label: t("appearance.bangla") },
        ]}
      />
      <SegmentGroup
        label={t("appearance.theme")}
        ariaLabel={t("appearance.theme")}
        value={theme}
        onChange={setTheme}
        options={[
          { value: "light", label: t("appearance.light") },
          { value: "dark", label: t("appearance.dark") },
          { value: "system", label: t("appearance.system") },
        ]}
      />
    </div>
  );
}
