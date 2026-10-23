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
} from "recharts";
import { AnalyticsMetrics } from "@/lib/analytics/calculator";

interface SurplusTrendChartProps {
  metrics: AnalyticsMetrics;
}

export const SurplusTrendChart: React.FC<SurplusTrendChartProps> = ({ metrics }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 flex items-center justify-center bg-surface-muted/30 rounded-xl">
        <span className="text-xs text-charcoal-subtle">Loading surplus metrics...</span>
      </div>
    );
  }

  const data = metrics.surplusByDay;

  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">
            Historical Surplus Trends
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Prepared meals vs sold vs leftover surplus by day
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-forest-50 text-forest-800 border border-forest-200 rounded-md">
          Ground-truth Records
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
            />
            <Bar
              dataKey="prepared"
              name="Meals Prepared"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="sold"
              name="Meals Sold"
              fill="#166534"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="surplus"
              name="Surplus Leftover"
              fill="#84cc16"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
