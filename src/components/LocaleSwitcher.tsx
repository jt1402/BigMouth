"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = {
  en: "EN",
  ko: "한",
};

export function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(nextLocale: Locale) {
    if (nextLocale === current) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={
        "inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 p-0.5 text-sm font-medium " +
        (isPending ? "opacity-60" : "")
      }
    >
      {routing.locales.map((l) => {
        const active = l === current;
        return (
          <button
            key={l}
            type="button"
            disabled={isPending}
            onClick={() => switchTo(l)}
            aria-pressed={active}
            className={
              "px-3 py-1 rounded-full transition " +
              (active
                ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200")
            }
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
