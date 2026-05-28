import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { preferences, visits } from "@/db/schema";
import { searchPlaces } from "@/lib/naver";
import { recommend } from "@/lib/recommender";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  radius: z.number().int().min(100).max(5000).default(800),
  query: z.string().max(50).default(""),
});

export async function POST(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { lat, lng, query } = parsed.data;
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
    limit: 30,
  });

  const items = recommend({
    origin: { lat, lng },
    candidates: places,
    preferences: prefs ?? null,
    recentVisits: recent,
    historyWindowDays: user.historyWindowDays,
    topK: 10,
  });

  return NextResponse.json({ items });
}
