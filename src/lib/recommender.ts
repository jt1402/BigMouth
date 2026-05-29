import type { Place } from "./places";
import type { Preferences, Visit } from "@/db/schema";
import { haversineMeters } from "./utils";

export type Candidate = Place & {
  distanceM: number;
  score: number;
  reviewCount?: number;
};

type RecommendArgs = {
  origin: { lat: number; lng: number };
  radiusM: number;
  candidates: Place[];
  preferences: Pick<
    Preferences,
    "favoriteCuisines" | "dislikedCuisines" | "dietary"
  > | null;
  recentVisits: Pick<Visit, "naverPlaceId" | "category" | "visitedAt">[];
  historyWindowDays: number;
  topK?: number;
  mode?: "smart" | "random";
  excludeIds?: string[];
  likedCategories?: string[];
  ratedHistory?: { category: string | null; rating: number | null }[];
};

const PORK_HINTS = [
  "돼지",
  "삼겹",
  "족발",
  "보쌈",
  "순대",
  "햄",
  "소시지",
  "포크",
  "pork",
  "bacon",
  "베이컨",
];
const BEEF_HINTS = ["소고기", "한우", "beef", "갈비", "스테이크", "steak"];
const NON_VEG_HINTS = [
  "치킨",
  "닭",
  "chicken",
  "고기",
  "스테이크",
  "삼겹",
  "포크",
  "한우",
  "회",
  "초밥",
  "스시",
  "sushi",
  "곱창",
  "족발",
  "어",
  "장어",
];

function matchAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

function categoryMatches(place: Place, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const blob = `${place.name} ${place.category}`.toLowerCase();
  return terms.some((t) => blob.includes(t.toLowerCase()));
}

function topCategory(place: Place): string {
  return place.category.split(">")[0]?.trim() ?? "";
}

export function recommend({
  origin,
  radiusM,
  candidates,
  preferences,
  recentVisits,
  historyWindowDays,
  topK = 10,
  mode = "smart",
  excludeIds = [],
  likedCategories = [],
  ratedHistory = [],
}: RecommendArgs): Candidate[] {
  const excludeSet = new Set(excludeIds);
  const likedTopCats = new Set(
    likedCategories
      .map((c) => c.split(">")[0]?.trim() ?? "")
      .filter(Boolean),
  );
  const ratingByTopCat = new Map<string, { sum: number; n: number }>();
  for (const r of ratedHistory) {
    const cat = (r.category ?? "").split(">")[0]?.trim();
    if (!cat || r.rating == null) continue;
    const slot = ratingByTopCat.get(cat) ?? { sum: 0, n: 0 };
    slot.sum += r.rating;
    slot.n += 1;
    ratingByTopCat.set(cat, slot);
  }
  const now = Date.now();
  const historyWindowMs = historyWindowDays * 24 * 60 * 60 * 1000;
  const veryRecentMs = 3 * 24 * 60 * 60 * 1000;

  const visitedIds = new Set(
    recentVisits
      .filter((v) => now - new Date(v.visitedAt).getTime() <= historyWindowMs)
      .map((v) => v.naverPlaceId),
  );

  const veryRecentTopCats = new Map<string, number>();
  for (const v of recentVisits) {
    if (now - new Date(v.visitedAt).getTime() > veryRecentMs) continue;
    const cat = (v.category ?? "").split(">")[0]?.trim();
    if (!cat) continue;
    veryRecentTopCats.set(cat, (veryRecentTopCats.get(cat) ?? 0) + 1);
  }

  const favorites = preferences?.favoriteCuisines ?? [];
  const dislikes = preferences?.dislikedCuisines ?? [];
  const dietary = preferences?.dietary ?? [];

  const withDistance = candidates.map((p) => ({
    ...p,
    distanceM:
      p.distanceM ?? haversineMeters(origin, { lat: p.lat, lng: p.lng }),
  }));

  const scored: Candidate[] = withDistance
    .filter((p) => p.distanceM <= radiusM)
    .filter((p) => !visitedIds.has(p.id))
    .filter((p) => !excludeSet.has(p.id))
    .filter((p) => {
      const blob = `${p.name} ${p.category}`;
      if (dietary.includes("no_pork") && matchAny(blob, PORK_HINTS)) return false;
      if (dietary.includes("no_beef") && matchAny(blob, BEEF_HINTS)) return false;
      if (
        (dietary.includes("vegetarian") || dietary.includes("vegan")) &&
        matchAny(blob, NON_VEG_HINTS)
      )
        return false;
      return true;
    })
    .map((p) => {
      let score = 0;
      if (mode === "smart") {
        if (categoryMatches(p, favorites)) score += 3;
        if (categoryMatches(p, dislikes)) score -= 5;
        const recent = veryRecentTopCats.get(topCategory(p)) ?? 0;
        score -= recent * 2;
        if (likedTopCats.has(topCategory(p))) score += 2;
        const ratingSlot = ratingByTopCat.get(topCategory(p));
        if (ratingSlot && ratingSlot.n > 0) {
          const avg = ratingSlot.sum / ratingSlot.n;
          score += (avg - 3) * 0.8;
        }
      }
      score += Math.random();
      return { ...p, score };
    });

  scored.sort((a, b) => b.score - a.score);

  const buckets = new Map<string, Candidate[]>();
  for (const c of scored) {
    const cat = topCategory(c) || "기타";
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(c);
  }
  const keys = [...buckets.keys()];
  const top: Candidate[] = [];
  while (top.length < topK) {
    let progressed = false;
    for (const k of keys) {
      const b = buckets.get(k);
      if (!b || b.length === 0) continue;
      top.push(b.shift()!);
      progressed = true;
      if (top.length >= topK) break;
    }
    if (!progressed) break;
  }
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return top;
}
