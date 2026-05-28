import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { preferences, visits } from "@/db/schema";
import { countBlogMentions, searchPlaces } from "@/lib/places";
import { recommend, type Candidate } from "@/lib/recommender";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  radius: z.number().int().min(100).max(1000).default(500),
  query: z.string().max(50).default(""),
  sort: z.enum(["smart", "distance", "popular", "random"]).default("smart"),
});

export async function POST(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { lat, lng, query, radius, sort } = parsed.data;
  const db = getDb();

  const [prefs, recent] = await Promise.all([
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
  ]);

  const places = await searchPlaces({
    query: query || "맛집",
    lat,
    lng,
    radiusM: radius,
    limit: 15,
  });

  let items = recommend({
    origin: { lat, lng },
    radiusM: radius,
    candidates: places,
    preferences: prefs ?? null,
    recentVisits: recent,
    historyWindowDays: user.historyWindowDays,
    topK: 10,
    mode: sort === "random" ? "random" : "smart",
  });

  if (sort === "popular" || items.length > 0) {
    const counts = await Promise.all(
      items.map((it) => countBlogMentions(it.name)),
    );
    items = items.map((it, i) => ({ ...it, reviewCount: counts[i] }));
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
