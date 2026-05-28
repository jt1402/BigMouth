"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

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

export function HomeForm() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ok">(
    "idle",
  );
  const [radius, setRadius] = useState(800);
  const [meal, setMeal] = useState<(typeof MEAL_TYPES)[number]["q"]>("");

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
      ...(meal ? { q: meal } : {}),
    });
    router.push(`/recommend?${params.toString()}`);
  }

  return (
    <div className="mt-10 w-full max-w-md flex flex-col gap-5">
      {status !== "ok" ? (
        <button
          onClick={locate}
          disabled={status === "locating"}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3 font-medium disabled:opacity-60"
        >
          {status === "locating" ? t("locating") : t("useLocation")}
        </button>
      ) : (
        <div className="text-sm text-zinc-500">
          📍 {coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}
        </div>
      )}
      {status === "denied" && (
        <p className="text-sm text-red-600">{t("locationDenied")}</p>
      )}

      <label className="flex flex-col gap-2 text-left">
        <span className="text-sm font-medium">{t("radius")}</span>
        <input
          type="range"
          min={300}
          max={3000}
          step={100}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <span className="text-xs text-zinc-500">
          {t("radiusMeters", { meters: radius })}
        </span>
      </label>

      <div className="flex flex-col gap-2 text-left">
        <span className="text-sm font-medium">{t("mealType")}</span>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => setMeal(m.q)}
              className={
                "px-3 py-1.5 rounded-full border text-sm transition " +
                (meal === m.q
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                  : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800")
              }
            >
              {m.key === "any" ? t("anyMeal") : m.key}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!coords}
        className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </div>
  );
}
