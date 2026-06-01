"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RestaurantImage } from "./RestaurantImage";
import type { Candidate } from "@/lib/recommender";

type Radius = 300 | 500 | 800 | 1000 | "auto";
const RADIUS_PRESETS: readonly Radius[] = [300, 500, 800, 1000, "auto"] as const;
const SORT_OPTIONS = ["smart", "distance", "popular", "random"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

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

export function RecommendClient({
  lat,
  lng,
  radius: initialRadius,
  query: initialQuery,
  sort: initialSort,
}: {
  lat: number;
  lng: number;
  radius: Radius;
  query: string;
  sort: SortKey;
}) {
  const t = useTranslations("Recommend");
  const locale = useLocale();
  const [items, setItems] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<Radius>(initialRadius);
  const [meal, setMeal] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    setExhausted(false);
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

  async function loadMore() {
    if (!items || loadingMore || exhausted) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          radius,
          query: meal,
          sort,
          exclude: items.map((i) => i.id),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 200));
      }
      const data = (await res.json()) as { items: Candidate[] };
      if (data.items.length === 0) {
        setExhausted(true);
      } else {
        setItems((prev) => [...(prev ?? []), ...data.items]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  async function markVisited(c: Candidate, rating: number) {
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
        rating,
      }),
    });
    setItems((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    setRatingFor(null);
  }

  function kakaoWalkUrl(c: Candidate) {
    const origin = `${encodeURIComponent("내 위치")},${lat},${lng}`;
    const dest = `${encodeURIComponent(c.name)},${c.lat},${c.lng}`;
    return `https://map.kakao.com/link/by/walk/${origin}/${dest}`;
  }

  async function sharePlace(c: Candidate) {
    const url = c.link
      ? c.link.replace(/^http:\/\//, "https://")
      : `https://map.kakao.com/link/search/${encodeURIComponent(c.name)}`;
    const text = `${c.name}${c.address ? ` · ${c.address}` : ""}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: c.name, text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setToast(t("shareCopied"));
      setTimeout(() => setToast(null), 1800);
    } catch {
      setToast(t("shareFailed"));
      setTimeout(() => setToast(null), 1800);
    }
  }

  function kakaoPlaceUrl(c: Candidate) {
    if (!c.link) {
      return `https://map.kakao.com/link/search/${encodeURIComponent(c.name)}`;
    }
    return c.link.replace(/^http:\/\//, "https://");
  }

  return (
    <>
      <div className="mt-6 rounded-3xl bg-white dark:bg-zinc-900 ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{t("filtersHeader")}</span>
          <span className="text-xs text-zinc-500 font-semibold">
            {radius === "auto" ? t("radiusAuto") : `${radius}m`} ·{" "}
            {meal || t("anyMeal")}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {RADIUS_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setRadius(m)}
              className={
                "rounded-full py-2 text-xs sm:text-sm font-bold transition active:translate-y-0.5 " +
                (radius === m
                  ? "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700")
              }
            >
              {m === "auto" ? t("radiusAuto") : `${m}m`}
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
                "px-3 py-1.5 rounded-full text-xs font-bold transition active:translate-y-0.5 " +
                (meal === m.q
                  ? "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700")
              }
            >
              {m.key === "any"
                ? t("anyMeal")
                : locale === "en"
                  ? m.en
                  : m.key}
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
                "rounded-full py-2 text-xs sm:text-sm font-bold transition active:translate-y-0.5 " +
                (sort === s
                  ? "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700")
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
            onClick={() => load()}
            className="rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 px-5 py-2.5 text-sm font-bold shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition"
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
                className="rounded-3xl overflow-hidden ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 bg-white dark:bg-zinc-900 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] flex flex-col"
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
                      imageUrl={c.imageUrl}
                    />
                  </a>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => sharePlace(c)}
                      aria-label={t("share")}
                      className="size-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur flex items-center justify-center text-base shadow active:scale-95 transition"
                    >
                      ↗
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLike(c)}
                      aria-label={liked.has(c.id) ? t("unlike") : t("like")}
                      className="size-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur flex items-center justify-center text-lg shadow active:scale-95 transition"
                    >
                      {liked.has(c.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={kakaoPlaceUrl(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-extrabold text-lg leading-tight hover:underline"
                    >
                      {c.name}
                    </a>
                    <span className="text-xs text-zinc-500 font-semibold whitespace-nowrap mt-1">
                      {t("distance", { meters: c.distanceM })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 font-semibold">{c.category}</p>
                  {c.address && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {c.address}
                    </p>
                  )}
                  {c.reviewCount != null && c.reviewCount > 0 && (
                    <p className="text-xs text-zinc-500 font-semibold">
                      📝 {t("reviews", { count: c.reviewCount })}
                    </p>
                  )}
                  <div className="mt-auto pt-3 flex flex-col gap-2">
                    {ratingFor === c.id ? (
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 p-3 flex flex-col gap-2">
                        <p className="text-xs font-bold text-center text-zinc-700 dark:text-zinc-300">
                          {t("rateHowWas")}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => markVisited(c, 5)}
                            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2 shadow-[0_2px_0_0_rgba(0,0,0,0.12)] active:translate-y-0.5 active:shadow-none transition"
                          >
                            👍 {t("rateGood")}
                          </button>
                          <button
                            onClick={() => markVisited(c, 3)}
                            className="rounded-full bg-amber-300 hover:bg-amber-400 text-zinc-900 text-sm font-bold py-2 shadow-[0_2px_0_0_rgba(0,0,0,0.12)] active:translate-y-0.5 active:shadow-none transition"
                          >
                            😐 {t("rateMid")}
                          </button>
                          <button
                            onClick={() => markVisited(c, 1)}
                            className="rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold py-2 shadow-[0_2px_0_0_rgba(0,0,0,0.12)] active:translate-y-0.5 active:shadow-none transition"
                          >
                            👎 {t("rateBad")}
                          </button>
                        </div>
                        <button
                          onClick={() => setRatingFor(null)}
                          className="text-xs text-zinc-500 font-semibold underline"
                        >
                          {t("rateCancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={kakaoWalkUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 text-center shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition"
                        >
                          {t("goThere")}
                        </a>
                        <button
                          onClick={() => setRatingFor(c.id)}
                          className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2.5 shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition"
                        >
                          {t("markVisited")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-center gap-2">
            {!exhausted ? (
              <button
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 px-6 py-3 text-sm font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition disabled:opacity-60"
              >
                {loadingMore ? t("loadingMore") : `+ ${t("showMore")}`}
              </button>
            ) : (
              <p className="text-sm font-semibold text-zinc-500">
                {t("noMore")}
              </p>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-zinc-950 text-amber-200 px-4 py-2 text-sm font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
          {toast}
        </div>
      )}
    </>
  );
}
