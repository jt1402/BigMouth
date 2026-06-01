"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MiniMap } from "./MiniMap";

type LatLng = { lat: number; lng: number };

export function RestaurantImage({
  id,
  name,
  center,
  imageUrl,
}: {
  id: string;
  name: string;
  center: LatLng;
  imageUrl?: string | null;
}) {
  const initial =
    imageUrl === undefined ? undefined : (imageUrl as string | null);
  const [url, setUrl] = useState<string | null | undefined>(initial);

  useEffect(() => {
    if (imageUrl !== undefined) {
      setUrl(imageUrl);
      return;
    }
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
  }, [id, name, imageUrl]);

  if (url === undefined) {
    return (
      <div className="aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  if (url === null) {
    return <MiniMap center={center} />;
  }

  return (
    <div className="relative aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800">
      <Image
        src={url}
        alt={name}
        fill
        sizes="(min-width: 640px) 384px, 100vw"
        className="object-cover"
        onError={() => setUrl(null)}
      />
    </div>
  );
}
