import { setRequestLocale, getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";
import { FavoritesList } from "@/components/FavoritesList";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Favorites");

  const user = await requireCurrentDbUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.likedAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        {t("title")}
      </h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-zinc-500">{t("empty")}</p>
      ) : (
        <FavoritesList initial={rows} />
      )}
    </div>
  );
}
