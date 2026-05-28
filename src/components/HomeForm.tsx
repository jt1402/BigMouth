"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MiniMap } from "./MiniMap";

type Coords = { lat: number; lng: number };

const MEAL_TYPES = [
  { key: "any", q: "" },
  { key: "한식", q: "한식" },
  { key: "일식", q: "일식" },
  { key: "중식", q: "중식" },
  { key: "양식", q: "양식" },
  { key: "분식", q: "분식" },
  { key: "치킨", q: "치킨" },
  { key: "카페", q: "카페" },
] as const;

const RADIUS_PRESETS = [300, 500, 800, 1000] as const;

const SORT_OPTIONS = [
  { key: "smart", label: "smart" },
  { key: "distance", label: "distance" },
  { key: "popular", label: "popular" },
  { key: "random", label: "random" },
] as const;

export function HomeForm() {
  const t = useTranslations("Home");
  const tr = useTranslations("Recommend");
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ok">(
    "idle",
  );
  const [radius, setRadius] = useState(500);
  const [meal, setMeal] = useState<(typeof MEAL_TYPES)[number]["q"]>("");
  const [sort, setSort] =
    useState<(typeof SORT_OPTIONS)[number]["key"]>("smart");

  function locate() {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("ok");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  function submit() {
    if (!coords) return;
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      r: String(radius),
      sort,
      ...(meal ? { q: meal } : {}),
    });
    router.push(`/recommend?${params.toString()}`);
  }

  const ready = status === "ok" && coords;

  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {!ready ? (
            <button
              onClick={locate}
              disabled={status === "locating"}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-4 font-medium text-base shadow-sm active:scale-[0.98] transition disabled:opacity-60"
            >
              <span aria-hidden>📍</span>
              {status === "locating" ? t("locating") : t("useLocation")}
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800">
              <MiniMap center={coords} />
              <div className="px-4 py-2 text-xs text-zinc-500 flex items-center gap-2">
                <span>📍</span>
                <span>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
                <button
                  onClick={locate}
                  className="ml-auto text-zinc-700 dark:text-zinc-300 underline"
                >
                  {t("relocate")}
                </button>
              </div>
            </div>
          )}

          {status === "denied" && (
            <p className="text-sm text-red-600">{t("locationDenied")}</p>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{t("radius")}</span>
              <span className="text-xs text-zinc-500">
                {t("radiusMeters", { meters: radius })}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {RADIUS_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRadius(m)}
                  className={
                    "rounded-xl py-2 text-sm font-medium transition " +
                    (radius === m
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:bg-zinc-200 dark:active:bg-zinc-700")
                  }
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{t("mealType")}</span>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setMeal(m.q)}
                  className={
                    "px-4 py-2 rounded-full text-sm font-medium transition " +
                    (meal === m.q
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:bg-zinc-200 dark:active:bg-zinc-700")
                  }
                >
                  {m.key === "any" ? t("anyMeal") : m.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{tr("sort.label")}</span>
            <div className="grid grid-cols-4 gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={
                    "rounded-xl py-2 text-sm font-medium transition " +
                    (sort === s.key
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:bg-zinc-200 dark:active:bg-zinc-700")
                  }
                >
                  {tr(`sort.${s.label}` as const)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!ready}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold text-base py-4 transition"
        >
          {t("submit")}
        </button>
      </div>
    </div>
  );
}
