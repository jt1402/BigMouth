"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };
type Place = LatLng & { id: string; name: string };

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: { center: unknown; zoom: number },
        ) => {
          setCenter(p: unknown): void;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (opts: {
          position: unknown;
          map: unknown;
          title?: string;
        }) => { setMap(m: unknown): void };
      };
    };
  }
}

export function NaverMap({
  center,
  places,
}: {
  center: LatLng;
  places: Place[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof createMap> | null>(null);
  const markersRef = useRef<{ setMap(m: unknown): void }[]>([]);
  const [scriptReady, setScriptReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const hasKey = Boolean(clientId);

  useEffect(() => {
    if (!scriptReady || !ref.current || !window.naver) return;
    if (!mapRef.current) {
      mapRef.current = createMap(ref.current, center);
    } else {
      mapRef.current.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
    }
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(center.lat, center.lng),
        map: mapRef.current,
        title: "You",
      }),
      ...places.map(
        (p) =>
          new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(p.lat, p.lng),
            map: mapRef.current,
            title: p.name,
          }),
      ),
    ];
  }, [scriptReady, center, places]);

  if (!hasKey) {
    return (
      <div className="h-full w-full grid place-items-center bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-500 text-center p-6">
        Set <code>NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code> in{" "}
        <code>.env.local</code> to enable the map.
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={ref} className="h-full w-full" />
    </>
  );
}

function createMap(el: HTMLElement, center: LatLng) {
  return new window.naver.maps.Map(el, {
    center: new window.naver.maps.LatLng(center.lat, center.lng),
    zoom: 15,
  });
}
