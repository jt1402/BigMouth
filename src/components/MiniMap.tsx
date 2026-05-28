"use client";

import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

type KakaoMaps = {
  load(cb: () => void): void;
  StaticMap: new (
    el: HTMLElement,
    opts: {
      center: unknown;
      level: number;
      marker?: { position: unknown } | { position: unknown }[];
    },
  ) => unknown;
  LatLng: new (lat: number, lng: number) => unknown;
};

declare global {
  interface Window {
    kakao: { maps: KakaoMaps };
  }
}

function whenKakaoReady(cb: () => void) {
  if (typeof window === "undefined") return;
  if (window.kakao?.maps?.StaticMap) {
    cb();
    return;
  }
  const t = setInterval(() => {
    if (window.kakao?.maps?.StaticMap) {
      clearInterval(t);
      cb();
    }
  }, 100);
}

export function MiniMap({ center }: { center: LatLng }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    whenKakaoReady(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const k = window.kakao.maps;
    k.load(() => {
      const pos = new k.LatLng(center.lat, center.lng);
      new k.StaticMap(ref.current!, {
        center: pos,
        level: 3,
        marker: { position: pos },
      });
    });
  }, [ready, center.lat, center.lng]);

  return (
    <div
      ref={ref}
      className="h-32 sm:h-36 w-full bg-zinc-200 dark:bg-zinc-800"
    />
  );
}
