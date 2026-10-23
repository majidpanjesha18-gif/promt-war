import {
  AgentRun,
  AgentTraceEvent,
  AppState,
  FoodListing,
  MissionHistoryEvent,
  ProposedPlan,
  Recipient,
  RescueMission,
} from "@/types";
import { estimateSurplus } from "../forecasting/engine";
import { rankRecipientsForListing } from "../matching/scoring";
import { transitionMissionState } from "../missions/lifecycle";

export interface AgentRunResult {
  updatedState: AppState;
  newPlans: ProposedPlan[];
  runReport: AgentRun;
}

/**
 * Runs the AI rescue coordination agent on all available surplus listings.
 * Analyzes demand, filters eligibility, computes rankings, generates proposed plans,
 * and records the execution trace.
 */
export function runRescueAgent(
  currentState: AppState,
  currentSimulatedTime: Date = new Date()
): AgentRunResult {
  const runId = `run_${Date.now()}`;
  const runStartTime = currentSimulatedTime.toISOString();
  const traceEvents: AgentTraceEvent[] = [];

  const addEvent = (type: AgentTraceEvent["type"], message: string, details: Record<string, unknown> = {}) => {
    traceEvents.push({
      id: `evt_${Date.now()}_${traceEvents.length}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    });
  };

  addEvent("RUN_STARTED", "RescueLoop Agent run initiated.", { runId });

  // 1. Identify listings that require rescue
  // Exclude listings already reserved, rescued, or expired, or already part of active missions/pending plans
  const activeMissionListingIds = new Set(
    currentState.missions
      .filter((m) => ["proposed", "approved", "pickup_confirmed"].includes(m.status))
      .map((m) => m.listingId)
  );

  const pendingPlanListingIds = new Set(
    currentState.proposedPlans
      .filter((p) => p.status === "pending_approval")
      .map((p) => p.listingId)
  );

  const eligibleListings = currentState.listings.filter((l) => {
    if (l.status !== "available") return false;
    if (activeMissionListingIds.has(l.id)) return false;
    if (pendingPlanListingIds.has(l.id)) return false;
    // Check if safe collection deadline has passed
    const deadline = new Date(l.safeCollectionDeadline);
    return deadline.getTime() > currentSimulatedTime.getTime();
  });

  addEvent("LISTINGS_ANALYZED", `Analyzed ${currentState.listings.length} total listings. Found ${eligibleListings.length} available for rescue.`, {
    totalListings: currentState.listings.length,
    availableForRescue: eligibleListings.length,
  });

  // 2. Perform surplus estimation and matching for each available listing
  let totalSurplusEstimated = 0;
  const newPlans: ProposedPlan[] = [];
  const updatedRecipients = [...currentState.recipients];

  for (const listing of eligibleListings) {
    // Demand and surplus estimation
    const forecast = estimateSurplus(
      listing.category,
      listing.quantity,
      currentState.salesHistory
    );
    totalSurplusEstimated += forecast.estimatedSurplusMeals;

    addEvent(
      "SURPLUS_ESTIMATED",
      `Surplus estimated for listing "${listing.title}": ${forecast.estimatedSurplusMeals} meals (baseline: ${forecast.isBaselineFallback ? "yes" : "no"}).`,
      { listingId: listing.id, category: listing.category, forecast }
    );

    // Rank recipients for this listing
    const { eligibleMatches, ineligibleMatches } = rankRecipientsForListing(
      listing,
      updatedRecipients,
      currentState.settings.weights,
      currentSimulatedTime
    );

    addEvent(
      "RECIPIENTS_FILTERED",
      `Recipient filtering for "${listing.title}": ${eligibleMatches.length} eligible, ${ineligibleMatches.length} ineligible.`,
      {
        listingId: listing.id,
        eligibleCount: eligibleMatches.length,
        ineligibleCount: ineligibleMatches.length,
        ineligibleReasons: ineligibleMatches.map((m) => ({ name: m.recipientName, reasons: m.rejectionReasons })),
      }
    );

    if (eligibleMatches.length > 0) {
      const topMatch = eligibleMatches[0];
      const fallbackMatches = eligibleMatches.slice(1, 4).map((m) => ({
        recipientId: m.recipientId,
        recipientName: m.recipientName,
        score: m.totalScore,
        reasons: m.reasoning,
      }));

      addEvent(
        "MATCHES_RANKED",
        `Top match for "${listing.title}": ${topMatch.recipientName} (Score: ${topMatch.totalScore}/100).`,
        {
          listingId: listing.id,
          topRecipient: topMatch.recipientName,
          topScore: topMatch.totalScore,
          fallbacksCount: fallbackMatches.length,
        }
      );

      const plan: ProposedPlan = {
        id: `plan_${Date.now()}_${listing.id}`,
        listingId: listing.id,
        listingTitle: listing.title,
        recipientId: topMatch.recipientId,
        recipientName: topMatch.recipientName,
        mealQuantity: listing.quantity,
        deadline: listing.safeCollectionDeadline,
        matchScore: topMatch.totalScore,
        factors: topMatch.factors,
        explanation: topMatch.reasoning,
        explanationSource: "deterministic",
        fallbackRecipients: fallbackMatches,
        status: "pending_approval",
        createdAt: new Date().toISOString(),
      };

      newPlans.push(plan);

      addEvent(
        "PLAN_PROPOSED",
        `Proposed rescue plan created for "${listing.title}" → ${topMatch.recipientName}. Awaiting human approval.`,
        { planId: plan.id, listingId: listing.id, recipientId: topMatch.recipientId }
      );
    } else {
      addEvent(
        "MATCHES_RANKED",
        `No eligible recipients found for "${listing.title}". Listing remains flagged for manual review.`,
        { listingId: listing.id }
      );
    }
  }

  addEvent(
    "RUN_COMPLETED",
    `Rescue agent run completed. ${newPlans.length} rescue plan(s) proposed across ${eligibleListings.length} listings.`,
    { proposedPlansCount: newPlans.length }
  );

  const runReport: AgentRun = {
    id: runId,
    timestamp: runStartTime,
    status: "completed",
    listingsAnalyzed: eligibleListings.length,
    surplusEstimated: totalSurplusEstimated,
    plansProposed: newPlans.length,
    events: traceEvents,
    summary: `Analyzed ${eligibleListings.length} listings; proposed ${newPlans.length} rescue missions.`,
  };

  const updatedState: AppState = {
    ...currentState,
    proposedPlans: [...currentState.proposedPlans, ...newPlans],
    agentRuns: [runReport, ...currentState.agentRuns],
    traceEvents: [...traceEvents, ...currentState.traceEvents],
  };

  return {
    updatedState,
    newPlans,
    runReport,
  };
}

/**
 * Approves a proposed rescue plan:
 * - Transitions plan status to 'approved'
 * - Creates an official RescueMission in 'approved' status
 * - Reserves the listing status to 'reserved'
 * - Allocates capacity on the recipient
 * - Logs audit event
 */
export function approveRescuePlan(
  state: AppState,
  planId: string,
  userNotes: string = "Approved by coordinator"
): AppState {
  const planIndex = state.proposedPlans.findIndex((p) => p.id === planId);
  if (planIndex === -1) return state;

  const plan = state.proposedPlans[planIndex];
  const now = new Date().toISOString();

  // Find listing and recipient
  const listing = state.listings.find((l) => l.id === plan.listingId);
  const recipient = state.recipients.find((r) => r.id === plan.recipientId);

  if (!listing || !recipient) return state;

  // Prevent double allocation: check if already allocated
  const existingActiveMission = state.missions.find(
    (m) => m.listingId === plan.listingId && ["approved", "pickup_confirmed"].includes(m.status)
  );
  if (existingActiveMission) {
    return state; // Already actively allocated
  }

  const missionId = `msn_${Date.now()}_${listing.id.substring(0, 5)}`;
  const initialHistoryEvent: MissionHistoryEvent = {
    id: `hist_${Date.now()}_1`,
    timestamp: now,
    fromStatus: "proposed",
    toStatus: "approved",
    note: userNotes,
    actor: "user",
  };

  const newMission: RescueMission = {
    id: missionId,
    listingId: plan.listingId,
    recipientId: plan.recipientId,
    mealQuantity: plan.mealQuantity,
    pickupDeadline: plan.deadline,
    status: "approved",
    matchScore: plan.matchScore,
    recoveryAttemptCount: 0,
    history: [initialHistoryEvent],
    createdAt: now,
    updatedAt: now,
  };

  // Update listing to 'reserved'
  const updatedListings = state.listings.map((l) =>
    l.id === listing.id ? { ...l, status: "reserved" as const, updatedAt: now } : l
  );

  // Update recipient allocated meals
  const updatedRecipients = state.recipients.map((r) =>
    r.id === recipient.id
      ? { ...r, currentAllocatedMeals: r.currentAllocatedMeals + plan.mealQuantity }
      : r
  );

  // Update proposed plan status
  const updatedPlans = state.proposedPlans.map((p, idx) =>
    idx === planIndex ? { ...p, status: "approved" as const } : p
  );

  const approvalTraceEvent: AgentTraceEvent = {
    id: `evt_${Date.now()}_appr`,
    timestamp: now,
    type: "PLAN_APPROVED",
    message: `Plan ${plan.id} approved for listing "${plan.listingTitle}" assigned to ${plan.recipientName}.`,
    details: { missionId, planId, listingId: plan.listingId, recipientId: plan.recipientId },
  };

  return {
    ...state,
    listings: updatedListings,
    recipients: updatedRecipients,
    proposedPlans: updatedPlans,
    missions: [newMission, ...state.missions],
    traceEvents: [approvalTraceEvent, ...state.traceEvents],
  };
}

/**
 * Rejects a proposed rescue plan.
 */
export function rejectRescuePlan(
  state: AppState,
  planId: string,
  reason: string = "Declined by dispatcher"
): AppState {
  const plan = state.proposedPlans.find((p) => p.id === planId);
  if (!plan) return state;

  const now = new Date().toISOString();
  const updatedPlans = state.proposedPlans.map((p) =>
    p.id === planId ? { ...p, status: "rejected" as const } : p
  );

  const traceEvent: AgentTraceEvent = {
    id: `evt_${Date.now()}_rej`,
    timestamp: now,
    type: "RUN_COMPLETED",
    message: `Proposed plan ${planId} for "${plan.listingTitle}" was rejected: ${reason}`,
    details: { planId, reason },
  };

  return {
    ...state,
    proposedPlans: updatedPlans,
    traceEvents: [traceEvent, ...state.traceEvents],
  };
}

/**
 * End-to-End Failure Recovery scenario:
 * 1. Simulates a recipient rejection on an approved mission.
 * 2. Preserves the failed mission and event in history.
 * 3. Releases the recipient's allocated capacity and updates their rejection count.
 * 4. Agent triggers recovery to re-evaluate remaining eligible recipients for the listing.
 * 5. If a viable fallback exists, proposes a new alternative plan.
 */
export function recoverFromRecipientRejection(
  state: AppState,
  missionId: string,
  rejectionReason: string = "Capacity unexpectedly constrained due to private donation"
): { updatedState: AppState; recoveredPlan?: ProposedPlan; recoveryMessage: string } {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) {
    return { updatedState: state, recoveryMessage: "Mission not found." };
  }

  const now = new Date().toISOString();
  const originalRecipient = state.recipients.find((r) => r.id === mission.recipientId);
  const listing = state.listings.find((l) => l.id === mission.listingId);

  if (!listing) {
    return { updatedState: state, recoveryMessage: "Associated food listing not found." };
  }

  // Step 1: Transition mission state to 'rejected'
  const transition = transitionMissionState(
    mission,
    "rejected",
    `Recipient declined pickup: ${rejectionReason}`,
    "recipient",
    rejectionReason
  );

  if (!transition.success || !transition.updatedMission) {
    return { updatedState: state, recoveryMessage: transition.error || "Transition failed." };
  }

  const updatedMission = transition.updatedMission;

  // Step 2: Release capacity from the original recipient and record grounded rejection
  const updatedRecipients = state.recipients.map((r) => {
    if (r.id === mission.recipientId) {
      const newRejectedCount = r.rejectedMissionsCount + 1;
      const totalDecisions = r.completedMissionsCount + newRejectedCount;
      const newReliability =
        totalDecisions > 0
          ? Math.round((r.completedMissionsCount / totalDecisions) * 100) / 100
          : 0.5;

      return {
        ...r,
        currentAllocatedMeals: Math.max(0, r.currentAllocatedMeals - mission.mealQuantity),
        rejectedMissionsCount: newRejectedCount,
        recordedReliabilityScore: newReliability,
      };
    }
    return r;
  });

  const traceEvents: AgentTraceEvent[] = [
    {
      id: `evt_${Date.now()}_recip_rej`,
      timestamp: now,
      type: "RECIPIENT_REJECTED",
      message: `Recipient ${originalRecipient?.name || mission.recipientId} rejected mission ${mission.id}: "${rejectionReason}".`,
      details: { missionId, recipientId: mission.recipientId, rejectionReason },
    },
    {
      id: `evt_${Date.now()}_recov_start`,
      timestamp: new Date().toISOString(),
      type: "RECOVERY_STARTED",
      message: `Recovery workflow initiated for listing "${listing.title}" (${listing.quantity} meals). Re-evaluating available alternatives...`,
      details: { listingId: listing.id, originalRecipientId: mission.recipientId },
    },
  ];

  // Step 3: Re-evaluate remaining eligible recipients (excluding the rejecting recipient)
  const remainingCandidates = updatedRecipients.filter((r) => r.id !== mission.recipientId);
  const { eligibleMatches, ineligibleMatches } = rankRecipientsForListing(
    listing,
    remainingCandidates,
    state.settings.weights
  );

  let recoveredPlan: ProposedPlan | undefined;
  let updatedListings = state.listings;

  if (eligibleMatches.length > 0) {
    const alternativeTop = eligibleMatches[0];
    const alternativeFallbacks = eligibleMatches.slice(1, 4).map((m) => ({
      recipientId: m.recipientId,
      recipientName: m.recipientName,
      score: m.totalScore,
      reasons: m.reasoning,
    }));

    recoveredPlan = {
      id: `plan_${Date.now()}_alt_${listing.id}`,
      listingId: listing.id,
      listingTitle: listing.title,
      recipientId: alternativeTop.recipientId,
      recipientName: alternativeTop.recipientName,
      mealQuantity: listing.quantity,
      deadline: listing.safeCollectionDeadline,
      matchScore: alternativeTop.totalScore,
      factors: alternativeTop.factors,
      explanation: `Alternative recovery plan: ${alternativeTop.reasoning}`,
      explanationSource: "deterministic",
      fallbackRecipients: alternativeFallbacks,
      status: "pending_approval",
      createdAt: new Date().toISOString(),
    };

    traceEvents.push({
      id: `evt_${Date.now()}_alt_prop`,
      timestamp: new Date().toISOString(),
      type: "ALTERNATIVE_PROPOSED",
      message: `Alternative rescue plan proposed: ${alternativeTop.recipientName} (Match Score: ${alternativeTop.totalScore}/100). Awaiting approval.`,
      details: {
        planId: recoveredPlan.id,
        newRecipientId: alternativeTop.recipientId,
        score: alternativeTop.totalScore,
      },
    });

    // Mark mission as needs_reassignment
    updatedMission.status = "needs_reassignment";
    updatedMission.recoveryAttemptCount += 1;
  } else {
    // No alternatives eligible
    traceEvents.push({
      id: `evt_${Date.now()}_recov_fail`,
      timestamp: new Date().toISOString(),
      type: "RUN_FAILED",
      message: `Recovery exhausted: No remaining eligible recipients found for listing "${listing.title}". Listing returned to available pool for manual dispatch.`,
      details: {
        listingId: listing.id,
        ineligibleCount: ineligibleMatches.length,
        reasons: ineligibleMatches.map((m) => `${m.recipientName}: ${m.rejectionReasons.join(", ")}`),
      },
    });

    // Return listing to available
    updatedListings = state.listings.map((l) =>
      l.id === listing.id ? { ...l, status: "available" as const, updatedAt: now } : l
    );
    updatedMission.status = "needs_reassignment";
  }

  // Update missions list
  const updatedMissions = state.missions.map((m) => (m.id === mission.id ? updatedMission : m));

  const updatedPlans = recoveredPlan
    ? [recoveredPlan, ...state.proposedPlans]
    : state.proposedPlans;

  const recoveryMessage = recoveredPlan
    ? `Recipient rejection logged. Alternative plan proposed with ${recoveredPlan.recipientName} (Score: ${recoveredPlan.matchScore}/100).`
    : `Recipient rejection logged. No other eligible recipients met safety/capacity criteria. Listing released for manual coordination.`;

  return {
    updatedState: {
      ...state,
      listings: updatedListings,
      recipients: updatedRecipients,
      missions: updatedMissions,
      proposedPlans: updatedPlans,
      traceEvents: [...traceEvents, ...state.traceEvents],
    },
    recoveredPlan,
    recoveryMessage,
  };
}

/**
 * Confirms pickup for an approved mission.
 */
export function confirmMissionPickup(
  state: AppState,
  missionId: string,
  notes: string = "Pickup verified at donor premises"
): { updatedState: AppState; success: boolean; error?: string } {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return { updatedState: state, success: false, error: "Mission not found." };

  const transition = transitionMissionState(mission, "pickup_confirmed", notes, "user");
  if (!transition.success || !transition.updatedMission) {
    return { updatedState: state, success: false, error: transition.error };
  }

  const now = new Date().toISOString();
  const traceEvent: AgentTraceEvent = {
    id: `evt_${Date.now()}_pkp`,
    timestamp: now,
    type: "PICKUP_CONFIRMED",
    message: `Mission ${missionId} pickup confirmed for ${mission.mealQuantity} meals.`,
    details: { missionId, mealQuantity: mission.mealQuantity },
  };

  const updatedMissions = state.missions.map((m) =>
    m.id === missionId ? transition.updatedMission! : m
  );

  return {
    updatedState: {
      ...state,
      missions: updatedMissions,
      traceEvents: [traceEvent, ...state.traceEvents],
    },
    success: true,
  };
}

/**
 * Confirms delivery for a picked up mission:
 * - Transitions mission status to 'delivery_confirmed'
 * - Marks listing status as 'rescued'
 * - Releases recipient capacity
 * - Grounded reliability metric increases
 * - Logs audit event
 */
export function confirmMissionDelivery(
  state: AppState,
  missionId: string,
  notes: string = "Delivery confirmed and inspected at recipient site"
): { updatedState: AppState; success: boolean; error?: string } {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return { updatedState: state, success: false, error: "Mission not found." };

  // Validate state machine rule: delivery cannot precede pickup
  const transition = transitionMissionState(mission, "delivery_confirmed", notes, "user");
  if (!transition.success || !transition.updatedMission) {
    return { updatedState: state, success: false, error: transition.error };
  }

  const now = new Date().toISOString();

  // Mark food listing as 'rescued'
  const updatedListings = state.listings.map((l) =>
    l.id === mission.listingId ? { ...l, status: "rescued" as const, updatedAt: now } : l
  );

  // Update recipient stats and free up allocated meals
  const updatedRecipients = state.recipients.map((r) => {
    if (r.id === mission.recipientId) {
      const newCompleted = r.completedMissionsCount + 1;
      const total = newCompleted + r.rejectedMissionsCount;
      const newReliability = total > 0 ? Math.round((newCompleted / total) * 100) / 100 : 1.0;

      return {
        ...r,
        currentAllocatedMeals: Math.max(0, r.currentAllocatedMeals - mission.mealQuantity),
        completedMissionsCount: newCompleted,
        recordedReliabilityScore: newReliability,
      };
    }
    return r;
  });

  const traceEvent: AgentTraceEvent = {
    id: `evt_${Date.now()}_deliv`,
    timestamp: now,
    type: "DELIVERY_CONFIRMED",
    message: `Mission ${missionId} delivery confirmed! ${mission.mealQuantity} meals successfully rescued.`,
    details: { missionId, listingId: mission.listingId, recipientId: mission.recipientId, mealsRescued: mission.mealQuantity },
  };

  const updatedMissions = state.missions.map((m) =>
    m.id === missionId ? transition.updatedMission! : m
  );

  return {
    updatedState: {
      ...state,
      listings: updatedListings,
      recipients: updatedRecipients,
      missions: updatedMissions,
      traceEvents: [traceEvent, ...state.traceEvents],
    },
    success: true,
  };
}
