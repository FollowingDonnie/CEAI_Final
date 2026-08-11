import type { CatalogueSnapshot, Category, Variant } from "../../shared/types.js";

const aliases: Record<string, string[]> = {
  strength: ["barbell_strength", "bench_press"],
  powerlifting: ["barbell_strength", "bench_press"],
  bodybuilding: ["free_weight_hypertrophy", "cable_resistance"],
  muscle: ["free_weight_hypertrophy"],
  cardio: ["rowing_cardio", "cycling_cardio", "general_fitness"],
  rowing: ["rowing_cardio"],
  cycling: ["cycling_cardio"],
  calisthenics: ["pull_up", "dip", "open_floor_conditioning"],
  gymnastics: ["pull_up", "open_floor_conditioning", "mobility"],
  mobility: ["mobility", "open_floor_conditioning"],
  general: ["general_fitness"],
};

export function mapGoalText(text: string): string[] {
  const normalised = text.toLowerCase();
  const tags = new Set<string>();
  for (const [alias, values] of Object.entries(aliases)) if (normalised.includes(alias)) values.forEach((value) => tags.add(value));
  return [...tags];
}

export interface SearchRequest {
  text?: string;
  tags?: string[];
  categories?: Category[];
  maxPriceCents?: number | null;
  includeUnavailable?: boolean;
}

export function searchCatalogue(snapshot: CatalogueSnapshot, request: SearchRequest): Array<Variant & { score: number; matchedTags: string[] }> {
  const queryTokens = new Set((request.text ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const requestedTags = new Set([...(request.tags ?? []), ...mapGoalText(request.text ?? "")]);
  return snapshot.variants
    .filter((item) => item.active)
    .filter((item) => request.includeUnavailable || item.stockState === "in_stock" || item.stockState === "low_stock")
    .filter((item) => !request.categories?.length || request.categories.includes(item.category))
    .filter((item) => request.maxPriceCents == null || item.priceCents == null || item.priceCents <= request.maxPriceCents)
    .map((item) => {
      const matchedTags = item.tags.filter((tag) => requestedTags.has(tag));
      const searchable = `${item.name} ${item.sku} ${item.configuration} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      const tokenMatches = [...queryTokens].filter((token) => searchable.includes(token)).length;
      const score = matchedTags.length * 20 + tokenMatches * 4 + item.priorityWeight;
      return { ...item, score, matchedTags };
    })
    .filter((item) => !request.text && requestedTags.size === 0 || item.score > item.priorityWeight)
    .sort((a, b) => b.score - a.score || (a.priceCents ?? Number.MAX_SAFE_INTEGER) - (b.priceCents ?? Number.MAX_SAFE_INTEGER));
}
