"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };
type Place = LatLng & { id: string; name: string };

type KakaoMaps = {
  load(cb: () => void): void;
  Map: new (
    el: HTMLElement,
    opts: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (opts: {
    position: KakaoLatLng;
    map?: KakaoMap;
    title?: string;
  }) => KakaoMarker;
  InfoWindow: new (opts: { content: string }) => {
    open(map: KakaoMap, marker: KakaoMarker): void;
  };
  event: { addListener(t: unknown, ev: string, cb: () => void): void };
};
type KakaoLatLng = unknown;
type KakaoMap = { setCenter(p: KakaoLatLng): void };
type KakaoMarker = { setMap(m: KakaoMap | null): void };

declare global {
  interface Window {
    kakao: { maps: KakaoMaps };
  }
}

export function KakaoMap({
  center,
  places,
}: {
  center: LatLng;
  places: Place[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const [ready, setReady] = useState(false);

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!ready || !ref.current) return;
    const kakao = window.kakao.maps;

    if (!mapRef.current) {
      mapRef.current = new kakao.Map(ref.current, {
        center: new kakao.LatLng(center.lat, center.lng),
        level: 4,
      });
    } else {
      mapRef.current.setCenter(new kakao.LatLng(center.lat, center.lng));
    }

    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [
      new kakao.Marker({
        position: new kakao.LatLng(center.lat, center.lng),
        map: mapRef.current,
        title: "You",
      }),
      ...places.map((p) => {
        const marker = new kakao.Marker({
          position: new kakao.LatLng(p.lat, p.lng),
          map: mapRef.current!,
          title: p.name,
        });
        const info = new kakao.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:13px">${p.name}</div>`,
        });
        kakao.event.addListener(marker, "mouseover", () =>
          info.open(mapRef.current!, marker),
        );
        return marker;
      }),
    ];
  }, [ready, center, places]);

  if (!appKey) {
    return (
      <div className="h-full w-full grid place-items-center bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-500 text-center p-6">
        Set <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code> in <code>.env.local</code> to
        enable the map.
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => setReady(true));
        }}
      />
      <div ref={ref} className="h-full w-full" />
    </>
  );
}
