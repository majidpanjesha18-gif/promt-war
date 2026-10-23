import { MissionHistoryEvent, MissionStatus, RescueMission } from "@/types";

export interface TransitionResult {
  success: boolean;
  error?: string;
  updatedMission?: RescueMission;
}

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  proposed: ["approved", "rejected", "cancelled", "expired"],
  approved: ["pickup_confirmed", "rejected", "needs_reassignment", "cancelled", "expired"],
  pickup_confirmed: ["delivery_confirmed", "cancelled", "expired"],
  delivery_confirmed: [], // Terminal verified state
  rejected: ["needs_reassignment", "cancelled"],
  needs_reassignment: ["proposed", "cancelled", "expired"],
  expired: [], // Terminal
  cancelled: [], // Terminal
};

/**
 * Validates and executes a state transition on a RescueMission.
 * Enforces business constraints such as preventing delivery confirmation before pickup.
 */
export function transitionMissionState(
  mission: RescueMission,
  nextStatus: MissionStatus,
  note: string,
  actor: 'agent' | 'user' | 'recipient' | 'system' = 'user',
  rejectionReason?: string
): TransitionResult {
  const allowed = ALLOWED_TRANSITIONS[mission.status];

  // Specific rule: Cannot confirm delivery before pickup
  if (nextStatus === "delivery_confirmed" && mission.status !== "pickup_confirmed") {
    return {
      success: false,
      error: "Strict protocol violation: Cannot confirm delivery before pickup confirmation.",
    };
  }

  if (!allowed || !allowed.includes(nextStatus)) {
    return {
      success: false,
      error: `Invalid status transition from '${mission.status}' to '${nextStatus}'.`,
    };
  }

  const now = new Date().toISOString();
  const event: MissionHistoryEvent = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
    fromStatus: mission.status,
    toStatus: nextStatus,
    note: note || `State transitioned from ${mission.status} to ${nextStatus}`,
    actor,
  };

  const updatedMission: RescueMission = {
    ...mission,
    status: nextStatus,
    updatedAt: now,
    rejectionReason: rejectionReason || mission.rejectionReason,
    history: [...mission.history, event],
  };

  return {
    success: true,
    updatedMission,
  };
}
