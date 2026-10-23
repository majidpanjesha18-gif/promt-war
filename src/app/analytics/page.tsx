"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Scale,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { computeAnalytics } from "@/lib/analytics/calculator";
import { Badge } from "@/components/ui/Badge";

export default function AnalyticsPage() {
  const { state } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const metrics = computeAnalytics(state);

  const OUTCOME_COLORS: Record<string, string> = {
    delivery_confirmed: "#16a34a",
    pickup_confirmed: "#0284c7",
    approved: "#65a30d",
    proposed: "#ca8a04",
    rejected: "#e11d48",
    needs_reassignment: "#d97706",
    cancelled: "#64748b",
    expired: "#991b1b",
  };

  const outcomesData = metrics.outcomesBreakdown.filter((o) => o.count > 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950">
          Impact Analytics &amp; Forecasting Accuracy
        </h2>
        <p className="text-xs text-charcoal-muted mt-1">
          Strictly grounded metrics derived from verified deliveries and recorded historical sales.
        </p>
      </div>

      {/* Truth in Reporting Standards Banner */}
      <div className="p-4 rounded-xl border border-forest-200 bg-white flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-forest-800 shrink-0 mt-0.5" />
        <div className="text-xs text-charcoal space-y-1">
          <p className="font-semibold text-forest-950">
            Audit-Compliant Impact Methodology
          </p>
          <p className="text-charcoal-muted leading-relaxed">
            RescueLoop strictly separates <em>estimated surplus</em> from <em>verified rescues</em>. Meals proposed or awaiting pickup are never reported as rescued until physical custody is confirmed by recipient intake. No synthetic carbon offsets are fabricated without verifiable transportation logs.
          </p>
        </div>
      </div>

      {/* Primary Verified Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-xs text-charcoal-subtle font-medium">
            Verified Rescued Meals
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {metrics.verifiedRescuedMeals} meals
          </div>
          <span className="text-[11px] text-charcoal-muted">
            Across {metrics.verifiedRescuedMissionsCount} verified delivered missions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-xs text-charcoal-subtle font-medium">
            Food Waste Avoided
          </span>
          <div className="text-2xl font-bold text-forest-900 mt-1">
            {metrics.foodWasteAvoidedKgEstimated !== null
              ? `${metrics.foodWasteAvoidedKgEstimated} kg`
              : "Insufficient data"}
          </div>
          <span className="text-[11px] text-charcoal-muted">
            Grounded ~0.45 kg/meal standard
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-xs text-charcoal-subtle font-medium">
            Terminal Mission Success
          </span>
          <div className="text-2xl font-bold text-charcoal mt-1">
            {metrics.completionRateFormatted}
          </div>
          <span className="text-[11px] text-charcoal-muted">
            Delivered vs rejected/cancelled
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-xs text-charcoal-subtle font-medium">
            Demand Forecast Accuracy
          </span>
          <div className="text-2xl font-bold text-forest-800 mt-1">
            {metrics.forecastAccuracyFormatted}
          </div>
          <span className="text-[11px] text-charcoal-muted">
            Based on historical sales records
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Surplus by Day */}
          <div className="p-5 rounded-xl bg-white border border-surface-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-charcoal">
                  Surplus Production by Day
                </h3>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Prepared vs consumed meals from daily logs
                </p>
              </div>
              <Badge variant="forest">Historical</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.surplusByDay}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={{ stroke: "#E2E8E2" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={{ stroke: "#E2E8E2" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#E2E8E2",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="sold"
                    name="Meals Sold"
                    fill="#166534"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="surplus"
                    name="Surplus Food"
                    fill="#84cc16"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Mission Lifecycle Outcomes Breakdown */}
          <div className="p-5 rounded-xl bg-white border border-surface-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">
                    Mission Outcomes Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Distribution of lifecycle terminal and active states
                  </p>
                </div>
                <Badge variant="lime">Stateful</Badge>
              </div>

              {outcomesData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-charcoal-muted">
                  No mission outcomes recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outcomesData.map((outcome) => (
                    <div key={outcome.status} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-charcoal">{outcome.label}</span>
                        <span className="font-bold text-forest-900">
                          {outcome.count} mission{outcome.count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (outcome.count / state.missions.length) * 100)}%`,
                            backgroundColor: OUTCOME_COLORS[outcome.status] || "#166534",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-charcoal-subtle">
              Total Missions Tracked: {state.missions.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
