"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RestaurantImage } from "./RestaurantImage";
import type { Favorite } from "@/db/schema";

export function FavoritesList({ initial }: { initial: Favorite[] }) {
  const t = useTranslations("Favorites");
  const [rows, setRows] = useState(initial);

  async function remove(f: Favorite) {
    setRows((prev) => prev.filter((x) => x.kakaoPlaceId !== f.kakaoPlaceId));
    await fetch(
      `/api/favorites?kakaoPlaceId=${encodeURIComponent(f.kakaoPlaceId)}`,
      { method: "DELETE" },
    );
  }

  function placeUrl(f: Favorite) {
    if (f.link) return f.link.replace(/^http:\/\//, "https://");
    return `https://map.kakao.com/link/search/${encodeURIComponent(f.name)}`;
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-zinc-500">{t("empty")}</p>;
  }

  return (
    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {rows.map((f) => (
        <li
          key={f.id}
          className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col"
        >
          <div className="relative">
            <a
              href={placeUrl(f)}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <RestaurantImage
                id={f.kakaoPlaceId}
                name={f.name}
                center={{ lat: f.lat ?? 0, lng: f.lng ?? 0 }}
              />
            </a>
            <button
              type="button"
              onClick={() => remove(f)}
              aria-label={t("remove")}
              className="absolute top-2 right-2 size-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur flex items-center justify-center text-lg shadow active:scale-95 transition"
            >
              ❤️
            </button>
          </div>
          <div className="p-4 flex flex-col gap-1 flex-1">
            <a
              href={placeUrl(f)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-lg leading-tight hover:underline"
            >
              {f.name}
            </a>
            {f.category && (
              <p className="text-sm text-zinc-500">{f.category}</p>
            )}
            {f.address && (
              <p className="text-xs text-zinc-500 line-clamp-2">{f.address}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
