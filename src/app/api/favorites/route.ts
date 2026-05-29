import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { favorites } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  kakaoPlaceId: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional(),
  category: z.string().max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  link: z.string().max(500).optional(),
});

export async function GET() {
  const user = await requireCurrentDbUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.likedAt));
  return NextResponse.json({ favorites: rows });
}

export async function POST(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db
    .insert(favorites)
    .values({ userId: user.id, ...parsed.data })
    .onConflictDoNothing({
      target: [favorites.userId, favorites.kakaoPlaceId],
    })
    .returning();
  return NextResponse.json({ favorite: row ?? null });
}

export async function DELETE(req: Request) {
  const user = await requireCurrentDbUser();
  const url = new URL(req.url);
  const placeId = url.searchParams.get("kakaoPlaceId");
  const db = getDb();
  if (placeId) {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(favorites.kakaoPlaceId, placeId),
        ),
      );
  } else {
    await db.delete(favorites).where(eq(favorites.userId, user.id));
  }
  return NextResponse.json({ ok: true });
}
