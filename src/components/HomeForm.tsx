"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MiniMap } from "./MiniMap";

type Coords = { lat: number; lng: number };

const MEAL_TYPES = [
  { key: "any", q: "", en: "Anything" },
  { key: "한식", q: "한식", en: "Korean" },
  { key: "일식", q: "일식", en: "Japanese" },
  { key: "중식", q: "중식", en: "Chinese" },
  { key: "양식", q: "양식", en: "Western" },
  { key: "분식", q: "분식", en: "Snacks" },
  { key: "치킨", q: "치킨", en: "Chicken" },
  { key: "회", q: "회", en: "Sashimi" },
  { key: "족발,보쌈", q: "족발,보쌈", en: "Jokbal" },
  { key: "국밥", q: "국밥", en: "Gukbap" },
  { key: "도시락", q: "도시락", en: "Lunch box" },
  { key: "패스트푸드", q: "패스트푸드", en: "Fast food" },
  { key: "베트남식", q: "베트남식", en: "Vietnamese" },
  { key: "술집", q: "술집", en: "Bar" },
  { key: "카페", q: "카페", en: "Cafe" },
  { key: "베이커리", q: "베이커리", en: "Bakery" },
  { key: "디저트", q: "디저트", en: "Dessert" },
] as const;

type Radius = 300 | 500 | 800 | 1000 | "auto";
const RADIUS_PRESETS: readonly Radius[] = [300, 500, 800, 1000, "auto"] as const;

const SORT_OPTIONS = [
  { key: "smart", label: "smart" },
  { key: "distance", label: "distance" },
  { key: "popular", label: "popular" },
  { key: "random", label: "random" },
] as const;

export function HomeForm() {
  const t = useTranslations("Home");
  const tr = useTranslations("Recommend");
  const locale = useLocale();
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ok">(
    "idle",
  );
  const [radius, setRadius] = useState<Radius>(500);
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
      r: radius === "auto" ? "auto" : String(radius),
      sort,
      ...(meal ? { q: meal } : {}),
    });
    router.push(`/recommend?${params.toString()}`);
  }

  const ready = status === "ok" && coords;

  const pillBase =
    "rounded-full py-2 text-sm font-bold transition active:translate-y-0.5";
  const pillActive =
    "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]";
  const pillIdle =
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700";

  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 shadow-[0_6px_0_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {!ready ? (
            <button
              onClick={locate}
              disabled={status === "locating"}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 px-5 py-3.5 font-bold text-base shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none transition disabled:opacity-60"
            >
              <span aria-hidden>📍</span>
              {status === "locating" ? t("locating") : t("useLocation")}
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden ring-2 ring-zinc-950/10 dark:ring-zinc-100/10">
              <MiniMap center={coords} />
              <div className="px-4 py-2 text-xs text-zinc-500 flex items-center gap-2 bg-white dark:bg-zinc-900">
                <span>📍</span>
                <span>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
                <button
                  onClick={locate}
                  className="ml-auto text-zinc-700 dark:text-zinc-300 font-semibold underline"
                >
                  {t("relocate")}
                </button>
              </div>
            </div>
          )}

          {status === "denied" && (
            <p className="text-sm font-semibold text-red-600">
              {t("locationDenied")}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold">{t("radius")}</span>
              <span className="text-xs text-zinc-500 font-semibold">
                {radius === "auto"
                  ? t("radiusAuto")
                  : t("radiusMeters", { meters: radius })}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {RADIUS_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRadius(m)}
                  className={`${pillBase} ${radius === m ? pillActive : pillIdle}`}
                >
                  {m === "auto" ? t("radiusAuto") : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold">{t("mealType")}</span>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setMeal(m.q)}
                  className={`px-4 ${pillBase} ${meal === m.q ? pillActive : pillIdle}`}
                >
                  {m.key === "any"
                    ? t("anyMeal")
                    : locale === "en"
                      ? m.en
                      : m.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold">{tr("sort.label")}</span>
            <div className="grid grid-cols-4 gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={`${pillBase} ${sort === s.key ? pillActive : pillIdle}`}
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
          className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-amber-200 dark:text-zinc-950 disabled:text-zinc-500 font-extrabold text-base py-4 transition active:translate-y-0.5 dark:bg-amber-300 dark:hover:bg-amber-400"
        >
          {t("submit")} →
        </button>
      </div>
    </div>
  );
}
