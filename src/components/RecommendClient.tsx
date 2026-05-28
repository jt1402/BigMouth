"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RestaurantImage } from "./RestaurantImage";
import type { Candidate } from "@/lib/recommender";

const RADIUS_PRESETS = [300, 500, 800, 1000] as const;
const SORT_OPTIONS = ["smart", "distance", "popular", "random"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

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

export function RecommendClient({
  lat,
  lng,
  radius: initialRadius,
  query: initialQuery,
  sort: initialSort,
}: {
  lat: number;
  lng: number;
  radius: number;
  query: string;
  sort: SortKey;
}) {
  const t = useTranslations("Recommend");
  const [items, setItems] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [radius, setRadius] = useState(initialRadius);
  const [meal, setMeal] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((data: { favorites: { kakaoPlaceId: string }[] }) => {
        if (cancelled) return;
        setLiked(new Set(data.favorites.map((f) => f.kakaoPlaceId)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleLike(c: Candidate) {
    const isLiked = liked.has(c.id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
    if (isLiked) {
      await fetch(`/api/favorites?kakaoPlaceId=${encodeURIComponent(c.id)}`, {
        method: "DELETE",
      });
    } else {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kakaoPlaceId: c.id,
          name: c.name,
          address: c.address,
          category: c.category,
          lat: c.lat,
          lng: c.lng,
          link: c.link,
        }),
      });
    }
  }

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radius, query: meal, sort }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 200));
      }
      const data = (await res.json()) as { items: Candidate[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [lat, lng, radius, meal, sort]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  async function markVisited(c: Candidate) {
    await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        naverPlaceId: c.id,
        name: c.name,
        address: c.address,
        category: c.category,
        lat: c.lat,
        lng: c.lng,
      }),
    });
    setItems((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
  }

  function kakaoWalkUrl(c: Candidate) {
    const origin = `${encodeURIComponent("내 위치")},${lat},${lng}`;
    const dest = `${encodeURIComponent(c.name)},${c.lat},${c.lng}`;
    return `https://map.kakao.com/link/by/walk/${origin}/${dest}`;
  }

  function kakaoPlaceUrl(c: Candidate) {
    if (!c.link) {
      return `https://map.kakao.com/link/search/${encodeURIComponent(c.name)}`;
    }
    return c.link.replace(/^http:\/\//, "https://");
  }

  return (
    <>
      {kakaoKey && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
          strategy="afterInteractive"
        />
      )}

      <div className="mt-6 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t("filtersHeader")}</span>
          <span className="text-xs text-zinc-500">
            {radius}m · {meal || t("anyMeal")}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {RADIUS_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setRadius(m)}
              className={
                "rounded-xl py-2 text-xs sm:text-sm font-medium transition " +
                (radius === m
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300")
              }
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => setMeal(m.q)}
              className={
                "px-3 py-1.5 rounded-full text-xs font-medium transition " +
                (meal === m.q
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300")
              }
            >
              {m.key === "any" ? t("anyMeal") : m.key}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={
                "rounded-xl py-2 text-xs sm:text-sm font-medium transition " +
                (sort === s
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300")
              }
            >
              {t(`sort.${s}` as const)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 text-red-600 text-sm">{error}</p>}

      {!items && !error && (
        <p className="mt-6 text-zinc-500">{t("loading")}</p>
      )}

      {items && items.length === 0 && (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-zinc-500">{t("empty")}</p>
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm"
          >
            {t("again")}
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col"
              >
                <div className="relative">
                  <a
                    href={kakaoPlaceUrl(c)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <RestaurantImage
                      id={c.id}
                      name={c.name}
                      center={{ lat: c.lat, lng: c.lng }}
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleLike(c)}
                    aria-label={liked.has(c.id) ? t("unlike") : t("like")}
                    className="absolute top-2 right-2 size-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur flex items-center justify-center text-lg shadow active:scale-95 transition"
                  >
                    {liked.has(c.id) ? "❤️" : "🤍"}
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={kakaoPlaceUrl(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-lg leading-tight hover:underline"
                    >
                      {c.name}
                    </a>
                    <span className="text-xs text-zinc-500 whitespace-nowrap mt-1">
                      {t("distance", { meters: c.distanceM })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">{c.category}</p>
                  {c.address && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {c.address}
                    </p>
                  )}
                  {c.reviewCount != null && c.reviewCount > 0 && (
                    <p className="text-xs text-zinc-500">
                      📝 {t("reviews", { count: c.reviewCount })}
                    </p>
                  )}
                  <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => markVisited(c)}
                      className="rounded-full bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium py-2.5"
                    >
                      {t("markVisited")}
                    </button>
                    <a
                      href={kakaoWalkUrl(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-medium py-2.5 text-center active:bg-zinc-100 dark:active:bg-zinc-800"
                    >
                      {t("goThere")}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setNonce((n) => n + 1)}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-2.5 text-sm font-medium"
            >
              {t("again")}
            </button>
          </div>
        </>
      )}
    </>
  );
}
