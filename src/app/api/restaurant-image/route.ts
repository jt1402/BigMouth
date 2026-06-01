import { NextResponse } from "next/server";
import { z } from "zod";
import { getKakaoOgImage } from "@/lib/places";

const QuerySchema = z.object({
  id: z.string().min(1).max(40).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    id: url.searchParams.get("id") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad query" }, { status: 400 });
  }
  const { id } = parsed.data;

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ url: null });
  }

  const og = await getKakaoOgImage(id);
  return NextResponse.json(
    { url: og ?? null },
    {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
