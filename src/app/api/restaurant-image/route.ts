import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentDbUser } from "@/lib/user";

const QuerySchema = z.object({
  q: z.string().min(1).max(80),
  id: z.string().min(1).max(40).optional(),
});

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      );
    const found = m?.[1];
    if (!found) return null;
    return found.startsWith("//") ? `https:${found}` : found;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  await requireCurrentDbUser();
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q"),
    id: url.searchParams.get("id") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad query" }, { status: 400 });
  }
  const { q, id } = parsed.data;

  if (!id || !/^\d+$/.test(id)) {
    console.log(`[img] q=${q} id=${id} → skipped (no numeric id)`);
    return NextResponse.json({ url: null });
  }

  const og = await fetchOgImage(`https://place.map.kakao.com/${id}`);
  console.log(`[img] q=${q} id=${id} → og=${og}`);
  if (!og) return NextResponse.json({ url: null });

  return NextResponse.json({ url: og });
}
