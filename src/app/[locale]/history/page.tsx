import { setRequestLocale, getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { visits } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";
import { HistoryList } from "@/components/HistoryList";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("History");

  const user = await requireCurrentDbUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(visits)
    .where(eq(visits.userId, user.id))
    .orderBy(desc(visits.visitedAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        {t("title")}
      </h1>
      <HistoryList initial={rows} />
    </div>
  );
}
