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

function isKakaoSdkReady(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.kakao !== "undefined" &&
    typeof window.kakao.maps !== "undefined" &&
    typeof window.kakao.maps.load === "function"
  );
}

function waitForKakaoSdk(cb: () => void) {
  if (typeof window === "undefined") return;
  if (isKakaoSdkReady()) {
    cb();
    return;
  }
  const t = setInterval(() => {
    if (isKakaoSdkReady()) {
      clearInterval(t);
      cb();
    }
  }, 100);
}

export function MiniMap({ center }: { center: LatLng }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    waitForKakaoSdk(() => {
      window.kakao.maps.load(() => setReady(true));
    });
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const k = window.kakao.maps;
    const pos = new k.LatLng(center.lat, center.lng);
    ref.current.innerHTML = "";
    new k.StaticMap(ref.current, {
      center: pos,
      level: 3,
      marker: { position: pos },
    });
  }, [ready, center.lat, center.lng]);

  return (
    <div
      ref={ref}
      className="aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800 [&_*]:pointer-events-none"
    />
  );
}
