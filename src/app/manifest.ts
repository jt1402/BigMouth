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
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
