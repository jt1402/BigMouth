"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { NaverMap } from "./NaverMap";
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

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radius, query }),
      });
      if (!res.ok) throw new Error(await res.text());
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

  if (error) return <p className="mt-6 text-red-600">{error}</p>;
  if (!items) return <p className="mt-6 text-zinc-500">{t("loading")}</p>;
  if (items.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-zinc-500">{t("empty")}</p>
        <button
          onClick={() => setNonce((n) => n + 1)}
          className="mt-4 rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2"
        >
          {t("again")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_1fr] gap-6">
      <ul className="flex flex-col gap-3">
        {items.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{c.name}</h3>
                <p className="text-sm text-zinc-500">{c.category}</p>
                <p className="text-sm text-zinc-500 mt-1">{c.address}</p>
              </div>
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                {t("distance", { meters: c.distanceM })}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => markVisited(c)}
                className="text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5"
              >
                {t("markVisited")}
              </button>
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5"
                >
                  ↗
                </a>
              )}
            </div>
          </li>
        ))}
        <button
          onClick={() => setNonce((n) => n + 1)}
          className="mt-2 self-start rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
        >
          {t("again")}
        </button>
      </ul>
      <div className="h-[480px] lg:h-auto lg:min-h-[480px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <NaverMap center={{ lat, lng }} places={items} />
      </div>
    </div>
  );
}
