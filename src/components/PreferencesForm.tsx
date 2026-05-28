"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Initial = {
  favoriteCuisines: string[];
  dislikedCuisines: string[];
  dietary: string[];
  defaultRadiusM: number;
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
  const [radius, setRadius] = useState(initial.defaultRadiusM);
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
        defaultRadiusM: radius,
        historyWindowDays: windowDays,
      }),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("favorites")}</span>
        <input
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          placeholder={t("cuisinePlaceholder")}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("dislikes")}</span>
        <input
          value={dislikes}
          onChange={(e) => setDislikes(e.target.value)}
          placeholder={t("cuisinePlaceholder")}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("dietary")}</span>
        <div className="flex flex-wrap gap-2">
          {DIETARY_KEYS.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => toggleDietary(k)}
              className={
                "px-3 py-1.5 rounded-full border text-sm " +
                (dietary.includes(k)
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                  : "border-zinc-300 dark:border-zinc-700")
              }
            >
              {t(`dietaryOptions.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("defaultRadius")}</span>
        <input
          type="number"
          min={300}
          max={5000}
          step={100}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 w-32"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("historyWindow")}</span>
        <input
          type="number"
          min={0}
          max={90}
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 w-32"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-medium disabled:opacity-60"
        >
          {t("save")}
        </button>
        {status === "saved" && (
          <span className="text-sm text-emerald-600">{t("saved")}</span>
        )}
      </div>
    </div>
  );
}
