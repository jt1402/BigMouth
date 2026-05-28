"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Common");
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(nextLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <select
      aria-label={t("locale")}
      disabled={isPending}
      value={current}
      onChange={(e) => onChange(e.target.value as Locale)}
      className="bg-transparent text-sm border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {l === "en" ? t("english") : t("korean")}
        </option>
      ))}
    </select>
  );
}
