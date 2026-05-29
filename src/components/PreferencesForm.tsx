"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "./InfoTooltip";

type Initial = {
  favoriteCuisines: string[];
  dislikedCuisines: string[];
  dietary: string[];
  historyWindowDays: number;
};

const DIETARY_KEYS = [
  "vegetarian",
  "vegan",
  "halal",
  "gluten_free",
  "no_pork",
  "no_beef",
] as const;

export function PreferencesForm({ initial }: { initial: Initial }) {
  const t = useTranslations("Preferences");
  const [favorites, setFavorites] = useState(initial.favoriteCuisines.join(", "));
  const [dislikes, setDislikes] = useState(initial.dislikedCuisines.join(", "));
  const [dietary, setDietary] = useState<string[]>(initial.dietary);
  const [windowDays, setWindowDays] = useState(initial.historyWindowDays);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function toggleDietary(key: string) {
    setDietary((d) =>
      d.includes(key) ? d.filter((x) => x !== key) : [...d, key],
    );
  }

  async function save() {
    setStatus("saving");
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        favoriteCuisines: favorites
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        dislikedCuisines: dislikes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        dietary,
        historyWindowDays: windowDays,
      }),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  const inputCls =
    "rounded-2xl ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 bg-white dark:bg-zinc-900 px-4 py-2.5 font-semibold focus:ring-amber-300 focus:outline-none transition";

  return (
    <div className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">{t("favorites")}</span>
        <input
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          placeholder={t("cuisinePlaceholder")}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">{t("dislikes")}</span>
        <input
          value={dislikes}
          onChange={(e) => setDislikes(e.target.value)}
          placeholder={t("cuisinePlaceholder")}
          className={inputCls}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{t("dietary")}</span>
          <InfoTooltip message={t("dietaryHint")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_KEYS.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => toggleDietary(k)}
              className={
                "px-4 py-1.5 rounded-full text-sm font-bold transition active:translate-y-0.5 " +
                (dietary.includes(k)
                  ? "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700")
              }
            >
              {t(`dietaryOptions.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">{t("historyWindow")}</span>
        <input
          type="number"
          min={0}
          max={90}
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className={`${inputCls} w-32`}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 px-6 py-3 text-sm font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition disabled:opacity-60"
        >
          {t("save")}
        </button>
        {status === "saved" && (
          <span className="text-sm font-bold text-emerald-600">
            ✓ {t("saved")}
          </span>
        )}
      </div>
    </div>
  );
}
