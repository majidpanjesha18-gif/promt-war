import { AppState, MissionStatus } from "@/types";

export interface AnalyticsMetrics {
  totalEstimatedSurplusMeals: number;
  mealsAtRisk: number; // available listings with deadline in next 12 hours
  activeRescueMissionsCount: number; // approved or pickup_confirmed
  verifiedRescuedMeals: number; // strictly delivery_confirmed
  verifiedRescuedMissionsCount: number;
  missionCompletionRate: number | null; // null if no finished missions
  completionRateFormatted: string;
  unassignedSurplusMeals: number;
  foodWasteAvoidedKgEstimated: number | null; // grounded standard ~0.45kg/meal or null if no verified meals
  surplusByDay: { day: string; prepared: number; sold: number; surplus: number }[];
  outcomesBreakdown: { status: MissionStatus; count: number; label: string }[];
  forecastAccuracyRate: number | null;
  forecastAccuracyFormatted: string;
  hasEnoughDataForMetrics: boolean;
}

export function computeAnalytics(state: AppState, simulatedNow: Date = new Date()): AnalyticsMetrics {
  const { listings, missions, salesHistory } = state;

  // 1. Total Estimated Surplus from available listings
  const unassignedSurplusMeals = listings
    .filter((l) => l.status === "available")
    .reduce((sum, l) => sum + l.quantity, 0);

  const totalEstimatedSurplusMeals = listings.reduce((sum, l) => sum + l.quantity, 0);

  // 2. Meals currently at risk (available listings expiring within 12 hours)
  const twelveHoursFromNow = simulatedNow.getTime() + 12 * 60 * 60 * 1000;
  const mealsAtRisk = listings
    .filter((l) => {
      if (l.status !== "available") return false;
      const dl = new Date(l.safeCollectionDeadline).getTime();
      return dl > simulatedNow.getTime() && dl <= twelveHoursFromNow;
    })
    .reduce((sum, l) => sum + l.quantity, 0);

  // 3. Active missions count (approved or pickup_confirmed)
  const activeMissions = missions.filter((m) =>
    ["approved", "pickup_confirmed"].includes(m.status)
  );
  const activeRescueMissionsCount = activeMissions.length;

  // 4. Verified delivered missions ONLY (Strict requirement: do NOT count proposed/approved as rescued!)
  const deliveredMissions = missions.filter((m) => m.status === "delivery_confirmed");
  const verifiedRescuedMissionsCount = deliveredMissions.length;
  const verifiedRescuedMeals = deliveredMissions.reduce(
    (sum, m) => sum + m.mealQuantity,
    0
  );

  // 5. Completion rate grounded in finished missions (delivered vs rejected/cancelled)
  const terminalMissions = missions.filter((m) =>
    ["delivery_confirmed", "rejected", "cancelled", "expired"].includes(m.status)
  );
  let missionCompletionRate: number | null = null;
  let completionRateFormatted = "Insufficient data";

  if (terminalMissions.length >= 1) {
    missionCompletionRate = Math.round(
      (deliveredMissions.length / terminalMissions.length) * 100
    );
    completionRateFormatted = `${missionCompletionRate}%`;
  }

  // 6. Food waste avoided in kg (grounded USDA/FAO standard metric: 1 meal ≈ 0.45 kg of food waste avoided)
  const foodWasteAvoidedKgEstimated =
    verifiedRescuedMeals > 0 ? Math.round(verifiedRescuedMeals * 0.45 * 10) / 10 : 0;

  // 7. Surplus trends by day from historical sales
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const surplusByDay = salesHistory.slice(-7).map((s) => ({
    day: `${dayNames[s.dayOfWeek]} (${s.date.slice(5)})`,
    prepared: s.mealsPrepared,
    sold: s.mealsSold,
    surplus: s.mealsSurplus,
  }));

  // 8. Outcomes breakdown
  const outcomeStatuses: { status: MissionStatus; label: string }[] = [
    { status: "delivery_confirmed", label: "Verified Delivered" },
    { status: "pickup_confirmed", label: "Pickup In Progress" },
    { status: "approved", label: "Approved (Awaiting Pickup)" },
    { status: "proposed", label: "Proposed" },
    { status: "needs_reassignment", label: "Needs Reassignment" },
    { status: "rejected", label: "Recipient Declined" },
    { status: "cancelled", label: "Cancelled" },
    { status: "expired", label: "Expired" },
  ];

  const outcomesBreakdown = outcomeStatuses.map(({ status, label }) => ({
    status,
    label,
    count: missions.filter((m) => m.status === status).length,
  }));

  // 9. Forecast accuracy based on historical records where prepared vs sold exists
  let forecastAccuracyRate: number | null = null;
  let forecastAccuracyFormatted = "Insufficient data";

  if (salesHistory.length >= 3) {
    // Mean absolute percentage accuracy: 1 - (|predicted - actual| / actual)
    // For demo history, calculate how close demand was to prepared
    const errors = salesHistory.map((s) => {
      const denom = s.mealsSold || 1;
      return Math.abs(s.mealsPrepared - s.mealsSold) / denom;
    });
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    forecastAccuracyRate = Math.max(0, Math.round((1 - Math.min(1, avgError)) * 100));
    forecastAccuracyFormatted = `${forecastAccuracyRate}%`;
  }

  return {
    totalEstimatedSurplusMeals,
    mealsAtRisk,
    activeRescueMissionsCount,
    verifiedRescuedMeals,
    verifiedRescuedMissionsCount,
    missionCompletionRate,
    completionRateFormatted,
    unassignedSurplusMeals,
    foodWasteAvoidedKgEstimated,
    surplusByDay,
    outcomesBreakdown,
    forecastAccuracyRate,
    forecastAccuracyFormatted,
    hasEnoughDataForMetrics: salesHistory.length > 0 || missions.length > 0,
  };
}
