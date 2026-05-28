import "server-only";

export type NaverPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  link?: string;
  telephone?: string;
};

type NaverRawItem = {
  title: string;
  link?: string;
  category: string;
  description?: string;
  telephone?: string;
  address: string;
  roadAddress?: string;
  mapx: string;
  mapy: string;
};

const NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "");
}

function naverCoordsToLatLng(mapx: string, mapy: string): {
  lat: number;
  lng: number;
} {
  const x = Number(mapx);
  const y = Number(mapy);
  if (Math.abs(x) > 360 || Math.abs(y) > 90) {
    return { lng: x / 1e7, lat: y / 1e7 };
  }
  return { lng: x, lat: y };
}

export async function searchPlaces(opts: {
  query: string;
  lat: number;
  lng: number;
  limit?: number;
}): Promise<NaverPlace[]> {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!id || !secret) {
    return mockPlaces(opts);
  }

  const params = new URLSearchParams({
    query: opts.query,
    display: String(Math.min(opts.limit ?? 30, 30)),
    sort: "random",
  });

  const res = await fetch(`${NAVER_SEARCH_URL}?${params}`, {
    headers: {
      "X-Naver-Client-Id": id,
      "X-Naver-Client-Secret": secret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Naver search failed: ${res.status} ${res.statusText}`);
  }

  const data: { items: NaverRawItem[] } = await res.json();
  return data.items.map((it, i) => {
    const { lat, lng } = naverCoordsToLatLng(it.mapx, it.mapy);
    const name = stripHtml(it.title);
    return {
      id: `${name}|${it.address}`.slice(0, 200),
      name,
      category: it.category,
      address: it.address,
      roadAddress: it.roadAddress,
      lat,
      lng,
      link: it.link,
      telephone: it.telephone,
    } satisfies NaverPlace;
  });
}

function mockPlaces({
  lat,
  lng,
  query,
}: {
  lat: number;
  lng: number;
  query: string;
}): NaverPlace[] {
  const seeds = [
    { name: "본가 갈비탕", category: "한식>갈비탕", offset: [0.001, 0.0015] },
    { name: "스시오마카세 하루", category: "일식>스시", offset: [-0.0008, 0.0012] },
    { name: "Pho 92", category: "베트남식>쌀국수", offset: [0.0006, -0.0011] },
    { name: "교촌치킨 강남점", category: "치킨>프랜차이즈", offset: [-0.0012, -0.0007] },
    { name: "이태원 케밥", category: "중동식>케밥", offset: [0.0019, 0.0003] },
    { name: "다운타우너 버거", category: "양식>버거", offset: [-0.0021, 0.0005] },
    { name: "광장시장 빈대떡", category: "한식>전", offset: [0.0004, 0.0024] },
    { name: "딘타이펑", category: "중식>딤섬", offset: [-0.0007, -0.0022] },
    { name: "마라샹궈 천천", category: "중식>마라", offset: [0.0027, -0.0006] },
    { name: "을지로 노가리 호프", category: "주점>호프", offset: [-0.0024, 0.0018] },
    { name: "성수 베이커리", category: "카페·디저트>베이커리", offset: [0.0012, 0.0028] },
    { name: "샐러디 한남", category: "양식>샐러드", offset: [-0.0015, -0.0019] },
  ];
  const q = query.trim().toLowerCase();
  return seeds
    .filter((s) => !q || s.category.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .map((s, i) => ({
      id: `mock:${s.name}`,
      name: s.name,
      category: s.category,
      address: `Mock address ${i + 1}`,
      lat: lat + s.offset[0],
      lng: lng + s.offset[1],
    }));
}
