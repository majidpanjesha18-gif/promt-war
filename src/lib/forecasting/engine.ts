import { FoodCategory, HistoricalSalesRecord } from "@/types";

export interface ForecastResult {
  category: FoodCategory;
  predictedDemandMeals: number;
  availableQuantityMeals: number;
  estimatedSurplusMeals: number;
  isBaselineFallback: boolean;
  confidenceScore: number; // 0 to 1
  sampleSize: number;
  explanation: string;
}

/**
 * Predicts food demand using historical sales data with weighted day-of-week matching
 * and rolling average fallback. Computes estimated surplus against available quantity.
 */
export function estimateSurplus(
  category: FoodCategory,
  availableQuantityMeals: number,
  history: HistoricalSalesRecord[],
  targetDayOfWeek?: number
): ForecastResult {
  // Filter history for this specific food category
  const categoryHistory = history.filter((h) => h.category === category);

  if (categoryHistory.length === 0) {
    // Zero history: transparent baseline assumption
    const baselineAssumption = Math.round(availableQuantityMeals * 0.7); // Assume 70% typical consumption
    const surplus = Math.max(0, availableQuantityMeals - baselineAssumption);

    return {
      category,
      predictedDemandMeals: baselineAssumption,
      availableQuantityMeals,
      estimatedSurplusMeals: surplus,
      isBaselineFallback: true,
      confidenceScore: 0.2,
      sampleSize: 0,
      explanation: "Insufficient historical sales data for this category. Using conservative 70% demand baseline estimate.",
    };
  }

  const currentDow = targetDayOfWeek ?? new Date().getDay();
  const sameDayRecords = categoryHistory.filter((h) => h.dayOfWeek === currentDow);

  let predictedDemand = 0;
  let confidence = 0.5;
  let explanation = "";

  if (sameDayRecords.length >= 2) {
    // Weighted average favoring more recent same-day records
    let totalWeight = 0;
    let weightedSales = 0;
    sameDayRecords.forEach((rec, idx) => {
      const weight = idx + 1; // recent entries have higher weight
      weightedSales += rec.mealsSold * weight;
      totalWeight += weight;
    });

    predictedDemand = Math.round(weightedSales / totalWeight);
    confidence = Math.min(0.95, 0.6 + sameDayRecords.length * 0.08);
    explanation = `Demand estimated from ${sameDayRecords.length} historical records matching day-of-week (${getDayName(currentDow)}).`;
  } else {
    // Rolling 7-day or category average fallback
    const totalSold = categoryHistory.reduce((sum, r) => sum + r.mealsSold, 0);
    predictedDemand = Math.round(totalSold / categoryHistory.length);
    confidence = Math.min(0.7, 0.4 + categoryHistory.length * 0.05);
    explanation = `Demand estimated from rolling average of ${categoryHistory.length} total historical records across all days.`;
  }

  const surplus = Math.max(0, availableQuantityMeals - predictedDemand);

  return {
    category,
    predictedDemandMeals: predictedDemand,
    availableQuantityMeals,
    estimatedSurplusMeals: surplus,
    isBaselineFallback: false,
    confidenceScore: Math.round(confidence * 100) / 100,
    sampleSize: categoryHistory.length,
    explanation,
  };
}

function getDayName(dow: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dow] || "Unknown";
}
