"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MiniMap } from "./MiniMap";
import type { Candidate } from "@/lib/recommender";

export function RecommendClient({
  lat,
  lng,
  radius,
  query,
}: {
  lat: number;
  lng: number;
  radius: number;
  query: string;
}) {
  const t = useTranslations("Recommend");
  const [items, setItems] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radius, query }),
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
  }, [lat, lng, radius, query]);

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

  function kakaoRouteUrl(c: Candidate) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(c.name)},${c.lat},${c.lng}`;
  }

  return (
    <>
      {kakaoKey && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
          strategy="afterInteractive"
        />
      )}

      {error && (
        <p className="mt-6 text-red-600 text-sm">{error}</p>
      )}

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
                <MiniMap center={{ lat: c.lat, lng: c.lng }} />
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-lg leading-tight">
                      {c.name}
                    </h3>
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
                  <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => markVisited(c)}
                      className="rounded-full bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium py-2.5"
                    >
                      {t("markVisited")}
                    </button>
                    <a
                      href={kakaoRouteUrl(c)}
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
