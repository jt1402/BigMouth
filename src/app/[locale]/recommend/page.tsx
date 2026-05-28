import { setRequestLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RecommendClient } from "@/components/RecommendClient";

export default async function RecommendPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lat?: string; lng?: string; r?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("Recommend");

  const lat = sp.lat ? Number(sp.lat) : null;
  const lng = sp.lng ? Number(sp.lng) : null;
  const radius = sp.r ? Math.min(Number(sp.r), 5000) : 800;
  const query = sp.q ?? "";

  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <Suspense
        fallback={
          <p className="mt-6 text-zinc-500">{t("loading")}</p>
        }
      >
        <RecommendClient lat={lat} lng={lng} radius={radius} query={query} />
      </Suspense>
    </div>
  );
}
