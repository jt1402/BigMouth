import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { visits } from "@/db/schema";
import { requireCurrentDbUser } from "@/lib/user";

const BodySchema = z.object({
  naverPlaceId: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional(),
  category: z.string().max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const user = await requireCurrentDbUser();
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db
    .insert(visits)
    .values({ userId: user.id, ...parsed.data })
    .returning();
  return NextResponse.json({ visit: row });
}
