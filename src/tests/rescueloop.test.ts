import { describe, expect, it } from "vitest";
import {
  FoodListing,
  Recipient,
  RescueMission,
} from "../types";
import { checkRecipientEligibility } from "../lib/matching/eligibility";
import { rankRecipientsForListing, scoreRecipientMatch } from "../lib/matching/scoring";
import { transitionMissionState } from "../lib/missions/lifecycle";
import {
  approveRescuePlan,
  confirmMissionDelivery,
  recoverFromRecipientRejection,
} from "../lib/agent/engine";
import { computeAnalytics } from "../lib/analytics/calculator";
import { GeminiExplainResponseSchema } from "../lib/validation/schemas";
import { getInitialDemoState } from "../lib/persistence/demo-data";

describe("RescueLoop AI Engine Verification Tests", () => {
  const mockListing: FoodListing = {
    id: "test_listing_1",
    title: "Fresh Baked Breads",
    description: "Daily baked goods",
    category: "bakery",
    quantity: 40,
    unit: "meals",
    preparationTime: "2026-10-23T10:00:00.000Z",
    safeCollectionDeadline: "2026-10-23T16:00:00.000Z", // 16:00
    storageRequirement: "ambient",
    dietaryFlags: ["vegetarian"],
    pickupLocation: {
      name: "Main Bakery",
      address: "100 High St",
      contactPhone: "555-1111",
    },
    status: "available",
    donorName: "Main Bakery",
    createdAt: "2026-10-23T10:00:00.000Z",
    updatedAt: "2026-10-23T10:00:00.000Z",
  };

  const mockRecipient: Recipient = {
    id: "test_recip_1",
    name: "Valley Shelter",
    type: "shelter",
    address: "200 Low St",
    distanceKm: 3.5,
    capacityMeals: 80,
    currentAllocatedMeals: 0,
    collectionWindow: { start: "08:00", end: "18:00" },
    acceptedCategories: ["bakery", "produce", "prepared_meals"],
    storageCapabilities: ["ambient", "refrigerated"],
    dietaryCapabilities: ["vegetarian"],
    isVerified: true,
    isAvailable: true,
    contactName: "John Doe",
    phone: "555-2222",
    completedMissionsCount: 10,
    rejectedMissionsCount: 1,
    recordedReliabilityScore: 0.91,
  };

  // Test 1: An eligible recipient can be matched
  it("Test 1: should successfully match an eligible recipient", () => {
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const eligibility = checkRecipientEligibility(mockListing, mockRecipient, simulatedNow);
    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.rejectionReasons).toHaveLength(0);

    const match = scoreRecipientMatch(mockListing, mockRecipient, undefined, simulatedNow);
    expect(match.isEligible).toBe(true);
    expect(match.totalScore).toBeGreaterThan(50);
  });

  // Test 2: An unverified recipient is rejected
  it("Test 2: should reject an unverified recipient regardless of score", () => {
    const unverifiedRecip: Recipient = { ...mockRecipient, isVerified: false };
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const eligibility = checkRecipientEligibility(mockListing, unverifiedRecip, simulatedNow);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.includes("verified"))).toBe(true);

    const scored = scoreRecipientMatch(mockListing, unverifiedRecip, undefined, simulatedNow);
    expect(scored.isEligible).toBe(false);
    expect(scored.totalScore).toBe(0);
  });

  // Test 3: An unavailable recipient is rejected
  it("Test 3: should reject an unavailable recipient", () => {
    const unavailableRecip: Recipient = { ...mockRecipient, isAvailable: false };
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const eligibility = checkRecipientEligibility(mockListing, unavailableRecip, simulatedNow);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.includes("unavailable"))).toBe(true);
  });

  // Test 4: Capacity constraints are enforced
  it("Test 4: should reject recipient when listing quantity exceeds remaining capacity", () => {
    const constrainedRecip: Recipient = {
      ...mockRecipient,
      capacityMeals: 50,
      currentAllocatedMeals: 30, // remaining capacity = 20
    };
    // Listing quantity is 40 > 20
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const eligibility = checkRecipientEligibility(mockListing, constrainedRecip, simulatedNow);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.includes("capacity"))).toBe(true);
  });

  // Test 5: Expired collection windows are rejected
  it("Test 5: should reject when pickup deadline falls outside recipient operating window", () => {
    const eveningOnlyRecip: Recipient = {
      ...mockRecipient,
      collectionWindow: { start: "18:00", end: "22:00" }, // Listing deadline is 16:00
    };
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const eligibility = checkRecipientEligibility(mockListing, eveningOnlyRecip, simulatedNow);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.includes("Collection window"))).toBe(true);
  });

  // Test 6: Match scoring is deterministic
  it("Test 6: match scoring should produce identical results for identical inputs", () => {
    const simulatedNow = new Date("2026-10-23T11:00:00.000Z");
    const score1 = scoreRecipientMatch(mockListing, mockRecipient, undefined, simulatedNow);
    const score2 = scoreRecipientMatch(mockListing, mockRecipient, undefined, simulatedNow);

    expect(score1.totalScore).toBe(score2.totalScore);
    expect(score1.factors).toEqual(score2.factors);
    expect(score1.reasoning).toBe(score2.reasoning);
  });

  // Test 7: Food quantities cannot be over-allocated across multiple missions
  it("Test 7: should prevent over-allocating food to multiple active missions", () => {
    const state = getInitialDemoState();
    const listing = state.listings[0];

    // Create a plan and approve it
    state.proposedPlans.push({
      id: "plan_test_allocation",
      listingId: listing.id,
      listingTitle: listing.title,
      recipientId: state.recipients[0].id,
      recipientName: state.recipients[0].name,
      mealQuantity: listing.quantity,
      deadline: listing.safeCollectionDeadline,
      matchScore: 90,
      factors: {
        collectionFeasibility: 0.9,
        capacityFit: 0.9,
        routeSuitability: 0.9,
        timeUrgency: 0.8,
        foodCompatibility: 1.0,
        recipientReliability: 0.9,
      },
      explanation: "Test allocation",
      explanationSource: "deterministic",
      fallbackRecipients: [],
      status: "pending_approval",
      createdAt: new Date().toISOString(),
    });

    const stateAfterFirstApproval = approveRescuePlan(state, "plan_test_allocation");
    const activeMissionCount = stateAfterFirstApproval.missions.filter(
      (m) => m.listingId === listing.id && ["approved", "pickup_confirmed"].includes(m.status)
    ).length;

    expect(activeMissionCount).toBe(1);

    // Attempt second approval on the same listing
    stateAfterFirstApproval.proposedPlans.push({
      id: "plan_test_duplicate",
      listingId: listing.id,
      listingTitle: listing.title,
      recipientId: state.recipients[1].id,
      recipientName: state.recipients[1].name,
      mealQuantity: listing.quantity,
      deadline: listing.safeCollectionDeadline,
      matchScore: 85,
      factors: {
        collectionFeasibility: 0.8,
        capacityFit: 0.8,
        routeSuitability: 0.8,
        timeUrgency: 0.8,
        foodCompatibility: 1.0,
        recipientReliability: 0.8,
      },
      explanation: "Duplicate test",
      explanationSource: "deterministic",
      fallbackRecipients: [],
      status: "pending_approval",
      createdAt: new Date().toISOString(),
    });

    const stateAfterSecondAttempt = approveRescuePlan(stateAfterFirstApproval, "plan_test_duplicate");
    const activeMissionsAfterSecond = stateAfterSecondAttempt.missions.filter(
      (m) => m.listingId === listing.id && ["approved", "pickup_confirmed"].includes(m.status)
    );

    // Still only 1 active mission allowed
    expect(activeMissionsAfterSecond.length).toBe(1);
  });

  // Test 8: Delivery cannot be confirmed before pickup
  it("Test 8: should enforce state machine rule preventing delivery before pickup confirmation", () => {
    const unpickedMission: RescueMission = {
      id: "msn_test_unpicked",
      listingId: "list_1",
      recipientId: "recip_1",
      mealQuantity: 30,
      pickupDeadline: "2026-10-23T18:00:00Z",
      status: "approved", // Still approved, NOT pickup_confirmed
      matchScore: 88,
      recoveryAttemptCount: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attempt = transitionMissionState(unpickedMission, "delivery_confirmed", "Direct delivery attempt");
    expect(attempt.success).toBe(false);
    expect(attempt.error).toContain("Cannot confirm delivery before pickup confirmation");
  });

  // Test 9: Recipient rejection triggers alternative matching recovery
  it("Test 9: should trigger alternative matching when recipient rejects mission", () => {
    const state = getInitialDemoState();
    const listing = state.listings[0];
    const originalRecipient = state.recipients[0]; // Hope Harbor

    // Set up active approved mission
    const missionId = "msn_test_rejection_recovery";
    state.missions.unshift({
      id: missionId,
      listingId: listing.id,
      recipientId: originalRecipient.id,
      mealQuantity: listing.quantity,
      pickupDeadline: listing.safeCollectionDeadline,
      status: "approved",
      matchScore: 92,
      recoveryAttemptCount: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const recoveryResult = recoverFromRecipientRejection(
      state,
      missionId,
      "Emergency maintenance at shelter kitchen"
    );

    expect(recoveryResult.recoveredPlan).toBeDefined();
    // Alternative recipient must not be the one that rejected
    expect(recoveryResult.recoveredPlan?.recipientId).not.toBe(originalRecipient.id);
    expect(recoveryResult.recoveredPlan?.matchScore).toBeGreaterThan(0);

    // Verify rejection audit event recorded
    const rejEvent = recoveryResult.updatedState.traceEvents.find(
      (e) => e.type === "RECIPIENT_REJECTED"
    );
    expect(rejEvent).toBeDefined();

    // Verify alternative plan proposed event recorded
    const altEvent = recoveryResult.updatedState.traceEvents.find(
      (e) => e.type === "ALTERNATIVE_PROPOSED"
    );
    expect(altEvent).toBeDefined();
  });

  // Test 10: No alternative is proposed when no eligible recipient exists
  it("Test 10: should report no feasible match when all alternatives are ineligible", () => {
    const state = getInitialDemoState();
    const listing = state.listings[0];
    const originalRecipient = state.recipients[0];

    // Deactivate or make unverified all other recipients
    state.recipients = state.recipients.map((r) =>
      r.id === originalRecipient.id ? r : { ...r, isAvailable: false, isVerified: false }
    );

    const missionId = "msn_test_no_alt";
    state.missions.unshift({
      id: missionId,
      listingId: listing.id,
      recipientId: originalRecipient.id,
      mealQuantity: listing.quantity,
      pickupDeadline: listing.safeCollectionDeadline,
      status: "approved",
      matchScore: 92,
      recoveryAttemptCount: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const recoveryResult = recoverFromRecipientRejection(state, missionId, "Unexpected closure");

    expect(recoveryResult.recoveredPlan).toBeUndefined();
    expect(recoveryResult.recoveryMessage).toContain("No other eligible recipients");

    const failedTrace = recoveryResult.updatedState.traceEvents.find(
      (e) => e.type === "RUN_FAILED"
    );
    expect(failedTrace).toBeDefined();
  });

  // Test 11: Invalid AI output is rejected by schema validator
  it("Test 11: should reject invalid AI responses using Zod schema", () => {
    const invalidAiOutput = {
      summary: "Short", // Less than 10 characters
      primaryRecommendationReason: "",
      // Missing tradeOffAnalysis and riskMitigation
    };

    const parseResult = GeminiExplainResponseSchema.safeParse(invalidAiOutput);
    expect(parseResult.success).toBe(false);

    const validAiOutput = {
      summary: "Hope Harbor Emergency Shelter is the optimal match due to proximity and rapid capacity.",
      primaryRecommendationReason: "Direct route 2.8 km and 100 meal storage capacity.",
      tradeOffAnalysis: "Valley Kitchen was second but has narrower collection hours.",
      riskMitigation: "Ensure insulated Cambro carriers used for temperature safety.",
    };

    const validParse = GeminiExplainResponseSchema.safeParse(validAiOutput);
    expect(validParse.success).toBe(true);
  });

  // Test 12: Analytics do not count proposed missions as verified deliveries
  it("Test 12: analytics should strictly count only verified delivered missions, never proposed ones", () => {
    const state = getInitialDemoState();
    // Clear existing missions and add only proposed and approved ones
    state.missions = [
      {
        id: "msn_prop_1",
        listingId: "list_1",
        recipientId: "recip_1",
        mealQuantity: 50,
        pickupDeadline: "2026-10-23T18:00:00Z",
        status: "proposed",
        matchScore: 90,
        recoveryAttemptCount: 0,
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "msn_appr_1",
        listingId: "list_2",
        recipientId: "recip_2",
        mealQuantity: 75,
        pickupDeadline: "2026-10-23T18:00:00Z",
        status: "approved",
        matchScore: 85,
        recoveryAttemptCount: 0,
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const analytics = computeAnalytics(state);
    // Verified meals must be 0!
    expect(analytics.verifiedRescuedMeals).toBe(0);
    expect(analytics.verifiedRescuedMissionsCount).toBe(0);
    expect(analytics.activeRescueMissionsCount).toBe(1); // the approved one

    // Now confirm delivery of a mission
    state.missions.push({
      id: "msn_deliv_1",
      listingId: "list_3",
      recipientId: "recip_3",
      mealQuantity: 40,
      pickupDeadline: "2026-10-23T18:00:00Z",
      status: "delivery_confirmed",
      matchScore: 95,
      recoveryAttemptCount: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedAnalytics = computeAnalytics(state);
    expect(updatedAnalytics.verifiedRescuedMeals).toBe(40);
    expect(updatedAnalytics.verifiedRescuedMissionsCount).toBe(1);
  });
});
