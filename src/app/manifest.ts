import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Big Mouth — 빅마우스",
    short_name: "Big Mouth",
    description: "점심 메뉴 추천 — 근처 식당을 골라드려요.",
    start_url: "/",
    display: "standalone",
    background_color: "#fde68a",
    theme_color: "#fde68a",
    orientation: "portrait",
    lang: "ko",
    icons: [
      {
        src: "/icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
  };
}
