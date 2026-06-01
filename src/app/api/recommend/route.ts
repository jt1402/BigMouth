import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites, preferences, visits } from "@/db/schema";
import {
  countBlogMentions,
  getKakaoOgImage,
  searchPlaces,
} from "@/lib/places";
import { recommend, type Candidate } from "@/lib/recommender";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  radius: z
    .union([z.number().int().min(100).max(1000), z.literal("auto")])
    .default(500),
  query: z.string().max(50).default(""),
  sort: z.enum(["smart", "distance", "popular", "random"]).default("smart"),
  exclude: z.array(z.string().max(40)).max(200).default([]),
});

export async function POST(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { lat, lng, query, radius, sort, exclude } = parsed.data;
  const db = getDb();

  const [prefs, recent, favRows, rated] = await Promise.all([
    db.query.preferences.findFirst({ where: eq(preferences.userId, user.id) }),
    (async () => {
      const since = new Date(
        Date.now() - user.historyWindowDays * 24 * 60 * 60 * 1000,
      );
      return db
        .select({
          naverPlaceId: visits.naverPlaceId,
          category: visits.category,
          visitedAt: visits.visitedAt,
        })
        .from(visits)
        .where(and(eq(visits.userId, user.id), gte(visits.visitedAt, since)));
    })(),
    db
      .select({ category: favorites.category })
      .from(favorites)
      .where(eq(favorites.userId, user.id)),
    db
      .select({ category: visits.category, rating: visits.rating })
      .from(visits)
      .where(eq(visits.userId, user.id)),
  ]);

  const likedCategories = favRows
    .map((r) => r.category)
    .filter((c): c is string => !!c);

  const TARGET = 10;
  const radiusSteps =
    radius === "auto" ? [500, 1000, 1500, 2250, 3000] : [radius];

  let items: Candidate[] = [];
  for (const r of radiusSteps) {
    const places = await searchPlaces({
      query: query || "맛집",
      lat,
      lng,
      radiusM: r,
      limit: 200,
    });
    const more = recommend({
      origin: { lat, lng },
      radiusM: r,
      candidates: places,
      preferences: prefs ?? null,
      recentVisits: recent,
      historyWindowDays: user.historyWindowDays,
      topK: TARGET - items.length,
      mode: sort === "random" ? "random" : "smart",
      excludeIds: [...exclude, ...items.map((i) => i.id)],
      likedCategories,
      ratedHistory: rated,
    });
    items = [...items, ...more];
    if (items.length >= TARGET) break;
  }

  if (sort === "popular" || items.length > 0) {
    const [counts, images] = await Promise.all([
      Promise.all(items.map((it) => countBlogMentions(it.name))),
      Promise.all(
        items.map((it) =>
          /^\d+$/.test(it.id) ? getKakaoOgImage(it.id) : Promise.resolve(null),
        ),
      ),
    ]);
    items = items.map((it, i) => ({
      ...it,
      reviewCount: counts[i],
      imageUrl: images[i],
    }));
  }

  if (sort === "distance") {
    items = [...items].sort((a, b) => a.distanceM - b.distanceM);
  } else if (sort === "popular") {
    items = [...items].sort(
      (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
    );
  }

  return NextResponse.json({ items: items satisfies Candidate[] });
}
