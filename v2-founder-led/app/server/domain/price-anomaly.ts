import type { CatalogueSnapshot, Variant } from "../../shared/types.js";

export interface PriceAssessment {
  status: "not_available" | "insufficient_peers" | "within_peer_range" | "needs_human_review";
  needsHumanReview: boolean;
  categoryMedianCents: number | null;
  peerCount: number;
  reason: string | null;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export function assessPricePlausibility(snapshot: CatalogueSnapshot, item: Variant): PriceAssessment {
  if (item.priceCents == null) {
    return { status: "not_available", needsHumanReview: false, categoryMedianCents: null, peerCount: 0, reason: null };
  }
  const peerPrices = snapshot.variants
    .filter((candidate) => candidate.active && candidate.category === item.category && candidate.priceCents != null)
    .map((candidate) => candidate.priceCents as number);
  if (peerPrices.length < 3) {
    return { status: "insufficient_peers", needsHumanReview: false, categoryMedianCents: null, peerCount: peerPrices.length, reason: null };
  }
  const categoryMedianCents = median(peerPrices);
  const absoluteDeviations = peerPrices.map((price) => Math.abs(price - categoryMedianCents));
  const medianAbsoluteDeviation = median(absoluteDeviations);
  const robustZScore = medianAbsoluteDeviation > 0
    ? 0.6745 * Math.abs(item.priceCents - categoryMedianCents) / medianAbsoluteDeviation
    : 0;
  const highSideRatio = categoryMedianCents > 0 ? item.priceCents / categoryMedianCents : 1;
  const needsHumanReview = item.priceCents > categoryMedianCents && highSideRatio >= 3 && robustZScore >= 6;
  return {
    status: needsHumanReview ? "needs_human_review" : "within_peer_range",
    needsHumanReview,
    categoryMedianCents,
    peerCount: peerPrices.length,
    reason: needsHumanReview
      ? "The sourced price is an extreme high-side outlier relative to the median and median absolute deviation of comparable catalogue items."
      : null,
  };
}
