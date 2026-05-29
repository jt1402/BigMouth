import "server-only";

export type Place = {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  link?: string;
  telephone?: string;
  distanceM?: number;
};

const KAKAO_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_BLOG_URL = "https://dapi.kakao.com/v2/search/blog";

export async function countBlogMentions(name: string): Promise<number> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return 0;
  const params = new URLSearchParams({
    query: name,
    size: "1",
    page: "1",
  });
  const res = await fetch(`${KAKAO_BLOG_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data: { meta?: { total_count?: number } } = await res.json();
  return data.meta?.total_count ?? 0;
}

type KakaoDoc = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone?: string;
  address_name: string;
  road_address_name?: string;
  x: string;
  y: string;
  place_url?: string;
  distance?: string;
};

function mapKakaoDoc(d: KakaoDoc): Place {
  return {
    id: d.id,
    name: d.place_name,
    category: d.category_name,
    address: d.road_address_name || d.address_name,
    roadAddress: d.road_address_name,
    lat: Number(d.y),
    lng: Number(d.x),
    link: d.place_url,
    telephone: d.phone,
    distanceM: d.distance ? Number(d.distance) : undefined,
  };
}

async function fetchKakaoPage(
  opts: { query: string; lat: number; lng: number; radiusM: number },
  key: string,
  page: number,
  sort: "distance" | "accuracy",
): Promise<Place[]> {
  const params = new URLSearchParams({
    query: opts.query || "맛집",
    x: String(opts.lng),
    y: String(opts.lat),
    radius: String(Math.min(opts.radiusM, 20000)),
    sort,
    size: "15",
    page: String(page),
    category_group_code: "FD6",
  });
  const res = await fetch(`${KAKAO_SEARCH_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data: { documents?: KakaoDoc[] } = await res.json();
  return (data.documents ?? []).map(mapKakaoDoc);
}

export async function searchPlaces(opts: {
  query: string;
  lat: number;
  lng: number;
  radiusM: number;
  limit?: number;
}): Promise<Place[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return mockPlaces(opts);

  const target = Math.min(opts.limit ?? 200, 300);

  const queries: Promise<Place[]>[] = [];
  for (let p = 1; p <= 10; p++) {
    queries.push(fetchKakaoPage(opts, key, p, "distance"));
  }
  for (let p = 1; p <= 5; p++) {
    queries.push(fetchKakaoPage(opts, key, p, "accuracy"));
  }
  if (!opts.query || opts.query === "맛집") {
    for (let p = 1; p <= 3; p++) {
      queries.push(
        fetchKakaoPage({ ...opts, query: "음식점" }, key, p, "distance"),
      );
    }
  }
  const pages = await Promise.all(queries);

  const seen = new Set<string>();
  const all: Place[] = [];
  for (const page of pages) {
    for (const p of page) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      all.push(p);
    }
  }
  return all.slice(0, target);
}

function mockPlaces(opts: { lat: number; lng: number; query: string }): Place[] {
  const seeds = [
    { name: "본가 갈비탕", category: "음식점 > 한식 > 갈비탕", offset: [0.001, 0.0015] },
    { name: "스시오마카세 하루", category: "음식점 > 일식 > 스시", offset: [-0.0008, 0.0012] },
    { name: "Pho 92", category: "음식점 > 베트남식 > 쌀국수", offset: [0.0006, -0.0011] },
    { name: "교촌치킨 강남점", category: "음식점 > 치킨", offset: [-0.0012, -0.0007] },
    { name: "이태원 케밥", category: "음식점 > 중동식 > 케밥", offset: [0.0019, 0.0003] },
    { name: "다운타우너 버거", category: "음식점 > 양식 > 버거", offset: [-0.0021, 0.0005] },
    { name: "광장시장 빈대떡", category: "음식점 > 한식 > 전", offset: [0.0004, 0.0024] },
    { name: "딘타이펑", category: "음식점 > 중식 > 딤섬", offset: [-0.0007, -0.0022] },
  ];
  const q = opts.query.trim().toLowerCase();
  return seeds
    .filter(
      (s) =>
        !q ||
        s.category.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    )
    .map((s, i) => ({
      id: `mock:${s.name}`,
      name: s.name,
      category: s.category,
      address: `Mock address ${i + 1}`,
      lat: opts.lat + s.offset[0],
      lng: opts.lng + s.offset[1],
    }));
}
