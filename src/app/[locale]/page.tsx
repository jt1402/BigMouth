import { auth } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeForm } from "@/components/HomeForm";
import { Landing } from "@/components/Landing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { userId } = await auth();

  if (!userId) return <Landing />;

  const t = await getTranslations("Home");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 flex flex-col items-center text-center">
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-4 text-sm sm:text-lg font-medium text-zinc-600 dark:text-zinc-400 max-w-xl">
        {t("subtitle")}
      </p>
      <HomeForm />
    </div>
  );
}
