"use client";

import React from "react";
import { useApp } from "@/lib/persistence/AppContext";
import { computeAnalytics } from "@/lib/analytics/calculator";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { SurplusTrendChart } from "@/components/dashboard/SurplusTrendChart";
import { UrgentInventory } from "@/components/dashboard/UrgentInventory";
import { RecentDecisions } from "@/components/dashboard/RecentDecisions";
import { DemoScenarioBanner } from "@/components/dashboard/DemoScenarioBanner";

export default function OverviewDashboardPage() {
  const { state, isInitialized } = useApp();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-charcoal-muted">Initializing RescueLoop environment...</p>
        </div>
      </div>
    );
  }

  const metrics = computeAnalytics(state);

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-forest-950">
            Regional Surplus &amp; Rescue Overview
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Real-time surplus intelligence, autonomous matching pipeline, and verified impact tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-charcoal-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Engine Active • {state.recipients.length} Recipient Facilities Connected</span>
        </div>
      </div>

      {/* Demo Scenario Guide Banner */}
      <DemoScenarioBanner />

      {/* Live Grounded Metrics Grid */}
      <MetricsGrid metrics={metrics} />

      {/* Charts & Urgent Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SurplusTrendChart metrics={metrics} />
        </div>
        <div>
          <UrgentInventory listings={state.listings} />
        </div>
      </div>

      {/* Recent Decisions Trace Log */}
      <div>
        <RecentDecisions events={state.traceEvents} />
      </div>
    </div>
  );
}
