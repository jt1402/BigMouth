"use client";

import { useEffect, useState } from "react";
import { MiniMap } from "./MiniMap";

type LatLng = { lat: number; lng: number };

export function RestaurantImage({
  id,
  name,
  center,
}: {
  id: string;
  name: string;
  center: LatLng;
}) {
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

  if (url === undefined) {
    return (
      <div className="aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  if (url === null) {
    return <MiniMap center={center} />;
  }

  const proxied = `/api/img?u=${encodeURIComponent(url)}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={name}
      loading="lazy"
      onError={() => setUrl(null)}
      className="aspect-[16/9] w-full object-cover bg-zinc-200 dark:bg-zinc-800"
    />
  );
}
