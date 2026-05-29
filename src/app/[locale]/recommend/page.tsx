import { setRequestLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { redirect } from "@/i18n/navigation";
import { RecommendClient } from "@/components/RecommendClient";

export default async function RecommendPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    r?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("Recommend");

  const lat = sp.lat ? Number(sp.lat) : null;
  const lng = sp.lng ? Number(sp.lng) : null;
  const radius: 300 | 500 | 800 | 1000 | "auto" = (() => {
    if (sp.r === "auto") return "auto";
    const n = sp.r ? Number(sp.r) : 500;
    if (n <= 300) return 300;
    if (n <= 500) return 500;
    if (n <= 800) return 800;
    return 1000;
  })();
  const query = sp.q ?? "";
  const sortRaw = sp.sort ?? "smart";
  const sort: "smart" | "distance" | "popular" | "random" =
    sortRaw === "distance" || sortRaw === "popular" || sortRaw === "random"
      ? sortRaw
      : "smart";

  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect({ href: "/", locale });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        {t("title")}
      </h1>
      <Suspense
        fallback={<p className="mt-6 text-zinc-500">{t("loading")}</p>}
      >
        <RecommendClient
          lat={lat as number}
          lng={lng as number}
          radius={radius}
          query={query}
          sort={sort}
        />
      </Suspense>
    </div>
  );
}
