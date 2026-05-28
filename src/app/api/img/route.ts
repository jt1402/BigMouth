import { z } from "zod";

const Q = z.object({ u: z.string().url() });

const ALLOWED_HOST_SUFFIX = [
  "daumcdn.net",
  "kakaocdn.net",
  "pstatic.net",
  "naver.net",
  "naver.com",
  "tistory.com",
  "tistorystatic.com",
  "blogspot.com",
  "cloudfront.net",
  "amazonaws.com",
  "googleusercontent.com",
];

function hostAllowed(u: string): boolean {
  try {
    const host = new URL(u).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIX.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({ u: url.searchParams.get("u") });
  if (!parsed.success) return new Response("bad url", { status: 400 });
  if (!hostAllowed(parsed.data.u)) {
    return new Response("host not allowed", { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.data.u, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",
        Referer: new URL(parsed.data.u).origin,
        Accept: "image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("upstream failed", { status: 502 });
    }
    const ct = upstream.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      return new Response("not an image", { status: 415 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": ct,
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return new Response("fetch error", { status: 502 });
  }
}
