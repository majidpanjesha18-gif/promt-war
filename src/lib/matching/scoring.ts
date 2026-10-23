import {
  ApplicationWeights,
  FoodListing,
  MatchFactorScore,
  MatchResult,
  Recipient,
} from "@/types";
import { checkRecipientEligibility } from "./eligibility";

export const DEFAULT_WEIGHTS: ApplicationWeights = {
  feasibility: 0.20,
  capacity: 0.25,
  route: 0.20,
  urgency: 0.15,
  compatibility: 0.10,
  reliability: 0.10,
};

/**
 * Calculates a transparent, normalized match score between 0 and 100 for an eligible recipient.
 */
export function scoreRecipientMatch(
  listing: FoodListing,
  recipient: Recipient,
  weights: ApplicationWeights = DEFAULT_WEIGHTS,
  currentSimulatedTime: Date = new Date()
): MatchResult {
  const eligibility = checkRecipientEligibility(listing, recipient, currentSimulatedTime);

  if (!eligibility.isEligible) {
    return {
      recipientId: recipient.id,
      recipientName: recipient.name,
      isEligible: false,
      rejectionReasons: eligibility.rejectionReasons,
      factors: {
        collectionFeasibility: 0,
        capacityFit: 0,
        routeSuitability: 0,
        timeUrgency: 0,
        foodCompatibility: 0,
        recipientReliability: 0,
      },
      totalScore: 0,
      reasoning: `Ineligible: ${eligibility.rejectionReasons[0]}`,
    };
  }

  // Factor 1: Capacity fit (1.0 = perfect match, penalizes wasting massive capacity on tiny quantity or barely fitting)
  const remainingCap = recipient.capacityMeals - recipient.currentAllocatedMeals;
  const ratio = Math.min(1, listing.quantity / remainingCap);
  // Optimal ratio is around 0.6 to 0.9 (good utilization without capping out completely)
  const capacityFit = Math.max(0.1, 1 - Math.abs(ratio - 0.75));

  // Factor 2: Route / Distance suitability (0 km = 1.0, 20 km = 0.0)
  const maxDistanceKm = 20;
  const routeSuitability = Math.max(0, 1 - Math.min(recipient.distanceKm, maxDistanceKm) / maxDistanceKm);

  // Factor 3: Time urgency (how close is the listing to safe deadline)
  const deadlineMs = new Date(listing.safeCollectionDeadline).getTime();
  const hoursUntilDeadline = Math.max(0, (deadlineMs - currentSimulatedTime.getTime()) / (1000 * 60 * 60));
  // If under 4 hours, urgency is maximum (1.0). If 24+ hours, urgency is 0.3
  const timeUrgency = Math.min(1, Math.max(0.2, 1 - hoursUntilDeadline / 24));

  // Factor 4: Food compatibility & dietary capability
  let foodCompatibility = 0.8;
  if (recipient.acceptedCategories.includes(listing.category)) {
    foodCompatibility += 0.2;
  }

  // Factor 5: Collection feasibility (margin before recipient window closes)
  const [endH, endM] = recipient.collectionWindow.end.split(":").map(Number);
  const deadlineDate = new Date(listing.safeCollectionDeadline);
  const isUtc = listing.safeCollectionDeadline.endsWith("Z");
  const deadlineHours = isUtc ? deadlineDate.getUTCHours() : deadlineDate.getHours();
  const marginHours = Math.max(0, endH - deadlineHours);
  const collectionFeasibility = Math.min(1, 0.4 + marginHours * 0.2);

  // Factor 6: Grounded reliability score (0-1)
  // If no history exists, use a neutral baseline (0.5) so new recipients aren't unfairly penalized
  const recipientReliability =
    recipient.recordedReliabilityScore !== null
      ? recipient.recordedReliabilityScore
      : 0.5;

  const factors: MatchFactorScore = {
    collectionFeasibility: roundDec(collectionFeasibility),
    capacityFit: roundDec(capacityFit),
    routeSuitability: roundDec(routeSuitability),
    timeUrgency: roundDec(timeUrgency),
    foodCompatibility: roundDec(foodCompatibility),
    recipientReliability: roundDec(recipientReliability),
  };

  // Weighted total score (normalized to 100)
  const weightedSum =
    factors.collectionFeasibility * weights.feasibility +
    factors.capacityFit * weights.capacity +
    factors.routeSuitability * weights.route +
    factors.timeUrgency * weights.urgency +
    factors.foodCompatibility * weights.compatibility +
    factors.recipientReliability * weights.reliability;

  const totalScore = Math.min(100, Math.max(0, Math.round(weightedSum * 100)));

  // Generate transparent human-readable explanation
  const reasoning = generateScoreExplanation(recipient, factors, totalScore);

  return {
    recipientId: recipient.id,
    recipientName: recipient.name,
    isEligible: true,
    rejectionReasons: [],
    factors,
    totalScore,
    reasoning,
  };
}

/**
 * Evaluates all recipients for a food listing, filters for eligibility,
 * and returns ranked results with deterministic tie-breaking.
 */
export function rankRecipientsForListing(
  listing: FoodListing,
  recipients: Recipient[],
  weights: ApplicationWeights = DEFAULT_WEIGHTS,
  currentSimulatedTime: Date = new Date()
): { eligibleMatches: MatchResult[]; ineligibleMatches: MatchResult[] } {
  const scored = recipients.map((r) =>
    scoreRecipientMatch(listing, r, weights, currentSimulatedTime)
  );

  const eligibleMatches = scored
    .filter((s) => s.isEligible)
    .sort((a, b) => {
      // 1. Primary: totalScore descending
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // 2. Tie-break: capacityFit
      if (b.factors.capacityFit !== a.factors.capacityFit) {
        return b.factors.capacityFit - a.factors.capacityFit;
      }
      // 3. Tie-break: routeSuitability
      if (b.factors.routeSuitability !== a.factors.routeSuitability) {
        return b.factors.routeSuitability - a.factors.routeSuitability;
      }
      // 4. Stable tie-break: alphabetical recipient ID
      return a.recipientId.localeCompare(b.recipientId);
    });

  const ineligibleMatches = scored.filter((s) => !s.isEligible);

  return { eligibleMatches, ineligibleMatches };
}

function generateScoreExplanation(
  recipient: Recipient,
  factors: MatchFactorScore,
  score: number
): string {
  const highlights: string[] = [];
  if (factors.capacityFit >= 0.8) highlights.push("optimal meal capacity fit");
  if (factors.routeSuitability >= 0.8) highlights.push(`short transit distance (${recipient.distanceKm} km)`);
  if (factors.collectionFeasibility >= 0.8) highlights.push("ample collection window margin");
  if (factors.recipientReliability >= 0.85) highlights.push("proven verified completion track record");

  const highlightText = highlights.length > 0 ? highlights.join(", ") : "meets standard delivery requirements";
  return `Score ${score}/100 based on ${highlightText}.`;
}

function roundDec(val: number): number {
  return Math.round(val * 100) / 100;
}
