import { setRequestLocale, getTranslations, getFormatter } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { visits } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("History");
  const fmt = await getFormatter();

  const user = await requireCurrentDbUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(visits)
    .where(eq(visits.userId, user.id))
    .orderBy(desc(visits.visitedAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-zinc-500">{t("empty")}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((v) => (
            <li
              key={v.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{v.name}</h3>
                <span className="text-xs text-zinc-500">
                  {t("visitedAt", {
                    date: fmt.dateTime(new Date(v.visitedAt), {
                      dateStyle: "medium",
                    }),
                  })}
                </span>
              </div>
              <p className="text-sm text-zinc-500">{v.category}</p>
              {v.address && (
                <p className="text-sm text-zinc-500 mt-1">{v.address}</p>
              )}
              {v.rating != null && (
                <p className="text-xs text-zinc-500 mt-1">
                  {t("yourRating", { rating: v.rating })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
