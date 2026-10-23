"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Bot,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { Button } from "../ui/Button";

export const DemoScenarioBanner: React.FC = () => {
  const { state, triggerAgentRun } = useApp();
  const [isRunning, setIsRunning] = useState(false);

  const pendingPlans = state.proposedPlans.filter((p) => p.status === "pending_approval");
  const approvedMissions = state.missions.filter((m) => m.status === "approved");
  const pickupMissions = state.missions.filter((m) => m.status === "pickup_confirmed");

  const handleRunDemoScenario = () => {
    setIsRunning(true);
    setTimeout(() => {
      triggerAgentRun();
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="rounded-xl border border-forest-200 bg-gradient-to-r from-forest-50 via-white to-lime-50/40 p-5 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-forest-900 text-lime-accent">
              Judge Evaluation Guide
            </span>
            <span className="text-xs font-semibold text-forest-900">
              Interactive Autonomous Workflow Walkthrough
            </span>
          </div>
          <p className="text-xs text-charcoal-muted max-w-2xl leading-relaxed">
            Test the complete stateful loop: <strong>1. Run Agent</strong> to forecast surplus &amp; rank recipients &rarr;{" "}
            <strong>2. Approve Plan</strong> &rarr; <strong>3. Simulate Rejection</strong> to watch failure recovery re-route to viable fallbacks &rarr;{" "}
            <strong>4. Confirm Pickup &amp; Delivery</strong> to verify true impact metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunDemoScenario}
            disabled={isRunning}
            icon={<Bot className={`w-4 h-4 ${isRunning ? "animate-spin" : "text-lime-accent"}`} />}
          >
            {isRunning ? "Running Agent..." : "Run Rescue Agent"}
          </Button>

          <Link href="/agent">
            <Button variant="outline" size="md">
              Agent Center <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Workflow Status Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-forest-100 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${state.listings.length > 0 ? "bg-emerald-500" : "bg-gray-300"}`} />
          <span className="text-charcoal-muted">1. Inventory Seeded ({state.listings.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${pendingPlans.length > 0 ? "bg-lime-500 animate-pulse" : "bg-gray-300"}`} />
          <span className="text-charcoal-muted">2. Plans Proposed ({pendingPlans.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${approvedMissions.length > 0 ? "bg-blue-500" : "bg-gray-300"}`} />
          <span className="text-charcoal-muted">3. Approved ({approvedMissions.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${state.missions.some(m => m.status === "delivery_confirmed") ? "bg-emerald-600" : "bg-gray-300"}`} />
          <span className="text-charcoal-muted">
            4. Rescued ({state.missions.filter(m => m.status === "delivery_confirmed").length})
          </span>
        </div>
      </div>
    </div>
  );
};
