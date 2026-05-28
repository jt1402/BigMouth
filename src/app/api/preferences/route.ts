import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { preferences, users } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  favoriteCuisines: z.array(z.string().min(1).max(40)).max(20),
  dislikedCuisines: z.array(z.string().min(1).max(40)).max(20),
  dietary: z.array(z.string().min(1).max(40)).max(10),
  defaultRadiusM: z.number().int().min(300).max(5000),
  historyWindowDays: z.number().int().min(0).max(90),
});

export async function PUT(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { defaultRadiusM, historyWindowDays, ...prefs } = parsed.data;
  const db = getDb();

  await Promise.all([
    db
      .insert(preferences)
      .values({ userId: user.id, ...prefs })
      .onConflictDoUpdate({ target: preferences.userId, set: prefs }),
    db
      .update(users)
      .set({ defaultRadiusM, historyWindowDays })
      .where(eq(users.id, user.id)),
  ]);

  return NextResponse.json({ ok: true });
}
