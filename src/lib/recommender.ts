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
};

const PORK_HINTS = ["돼지", "삼겹", "포크", "pork", "bacon", "베이컨"];
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
}: RecommendArgs): Candidate[] {
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
      }
      score += Math.random();
      return { ...p, score };
    });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return top;
}
