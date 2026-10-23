import React from "react";
import {
  Boxes,
  AlertCircle,
  Truck,
  CheckCircle2,
  TrendingUp,
  Scale,
} from "lucide-react";
import { AnalyticsMetrics } from "@/lib/analytics/calculator";

interface MetricsGridProps {
  metrics: AnalyticsMetrics;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Available Surplus",
      value: `${metrics.unassignedSurplusMeals} meals`,
      subtitle: `${metrics.totalEstimatedSurplusMeals} total tracked in pipeline`,
      icon: Boxes,
      iconColor: "text-forest-700 bg-forest-50",
    },
    {
      title: "Meals at Risk",
      value: `${metrics.mealsAtRisk} meals`,
      subtitle: "Safe deadline expires < 12 hrs",
      icon: AlertCircle,
      iconColor: metrics.mealsAtRisk > 0 ? "text-amber-700 bg-amber-50" : "text-gray-600 bg-gray-50",
      alert: metrics.mealsAtRisk > 0,
    },
    {
      title: "Active Missions",
      value: `${metrics.activeRescueMissionsCount}`,
      subtitle: "In-progress rescue operations",
      icon: Truck,
      iconColor: "text-blue-700 bg-blue-50",
    },
    {
      title: "Verified Rescued",
      value: `${metrics.verifiedRescuedMeals} meals`,
      subtitle: `${metrics.verifiedRescuedMissionsCount} verified delivered missions`,
      icon: CheckCircle2,
      iconColor: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "Waste Avoided",
      value:
        metrics.foodWasteAvoidedKgEstimated !== null
          ? `${metrics.foodWasteAvoidedKgEstimated} kg`
          : "Insufficient data",
      subtitle: "Grounded 0.45 kg/meal conversion",
      icon: Scale,
      iconColor: "text-lime-dark bg-lime-50",
    },
    {
      title: "Completion Rate",
      value: metrics.completionRateFormatted,
      subtitle: "Terminal delivery success",
      icon: TrendingUp,
      iconColor: "text-forest-800 bg-forest-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-surface-border shadow-xs hover:border-forest-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-charcoal-subtle">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-charcoal tracking-tight">
              {card.value}
            </div>
            <p className="text-[11px] text-charcoal-muted mt-1 leading-tight">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
