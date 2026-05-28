import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { preferences } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";
import { PreferencesForm } from "@/components/PreferencesForm";

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Preferences");

  const user = await requireCurrentDbUser();
  const db = getDb();
  const prefs = await db.query.preferences.findFirst({
    where: eq(preferences.userId, user.id),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <PreferencesForm
        initial={{
          favoriteCuisines: prefs?.favoriteCuisines ?? [],
          dislikedCuisines: prefs?.dislikedCuisines ?? [],
          dietary: prefs?.dietary ?? [],
          defaultRadiusM: user.defaultRadiusM,
          historyWindowDays: user.historyWindowDays,
        }}
      />
    </div>
  );
}
