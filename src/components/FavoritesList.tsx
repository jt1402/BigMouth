"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import type { Favorite } from "@/db/schema";

export function FavoritesList({ initial }: { initial: Favorite[] }) {
  const t = useTranslations("Favorites");
  const fmt = useFormatter();
  const [rows, setRows] = useState(initial);
  const [confirmClear, setConfirmClear] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600_000 },
    );
  }, []);

  async function remove(f: Favorite) {
    setRows((prev) => prev.filter((x) => x.kakaoPlaceId !== f.kakaoPlaceId));
    await fetch(
      `/api/favorites?kakaoPlaceId=${encodeURIComponent(f.kakaoPlaceId)}`,
      { method: "DELETE" },
    );
  }

  async function clearAll() {
    setRows([]);
    setConfirmClear(false);
    await fetch("/api/favorites", { method: "DELETE" });
  }

  function placeUrl(f: Favorite) {
    if (f.link) return f.link.replace(/^http:\/\//, "https://");
    if (/^\d+$/.test(f.kakaoPlaceId)) {
      return `https://place.map.kakao.com/${f.kakaoPlaceId}`;
    }
    return `https://map.kakao.com/link/search/${encodeURIComponent(f.name)}`;
  }

  function walkUrl(f: Favorite) {
    if (coords && f.lat != null && f.lng != null) {
      const origin = `${encodeURIComponent("내 위치")},${coords.lat},${coords.lng}`;
      const dest = `${encodeURIComponent(f.name)},${f.lat},${f.lng}`;
      return `https://map.kakao.com/link/by/walk/${origin}/${dest}`;
    }
    return placeUrl(f);
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-zinc-500 font-semibold">{t("empty")}</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-semibold text-zinc-500">
          {t("count", { n: rows.length })}
        </p>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 shadow-[0_2px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition"
            >
              {t("clearConfirm")}
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs font-bold text-zinc-500 underline"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs sm:text-sm font-bold text-rose-600 hover:underline"
          >
            🗑 {t("clearAll")}
          </button>
        )}
      </div>

      <ul className="flex flex-col">
        {rows.map((f) => (
          <li
            key={f.id}
            className="flex gap-3 sm:gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <a
                href={placeUrl(f)}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-base sm:text-lg leading-tight hover:underline truncate"
              >
                {f.name}
              </a>
              {f.category && (
                <p className="text-xs sm:text-sm text-zinc-500 font-semibold truncate">
                  {f.category}
                </p>
              )}
              {f.address && (
                <p className="text-xs text-zinc-500 line-clamp-1">
                  {f.address}
                </p>
              )}
              <p className="text-xs text-zinc-500 font-semibold">
                {t("savedAt", {
                  date: fmt.dateTime(new Date(f.likedAt), {
                    dateStyle: "medium",
                  }),
                })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={walkUrl(f)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 shadow-[0_2px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition"
                >
                  ↗ {t("directions")}
                </a>
                <button
                  onClick={() => remove(f)}
                  className="rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 transition"
                >
                  💔 {t("remove")}
                </button>
              </div>
            </div>
            <a
              href={placeUrl(f)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 self-center w-32 sm:w-44 aspect-square"
            >
              <Thumb id={f.kakaoPlaceId} name={f.name} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Thumb({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const params = new URLSearchParams({ id, q: `${name} 음식` });
    fetch(`/api/restaurant-image?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { url: null }))
      .then((data: { url: string | null }) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, name]);

  const base =
    "w-full h-full rounded-2xl ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 overflow-hidden";

  if (url === undefined) {
    return (
      <div className={`${base} bg-zinc-200 dark:bg-zinc-800 animate-pulse`} />
    );
  }
  if (url === null) {
    return (
      <div
        className={`${base} bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-2xl`}
      >
        ❤️
      </div>
    );
  }
  return (
    <div className={`${base} relative bg-zinc-200 dark:bg-zinc-800`}>
      <Image
        src={url}
        alt={name}
        fill
        sizes="(min-width: 640px) 176px, 128px"
        className="object-cover"
        onError={() => setUrl(null)}
      />
    </div>
  );
}
