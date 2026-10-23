"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Truck,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlanCard } from "@/components/agent/PlanCard";
import { TraceViewer } from "@/components/agent/TraceViewer";
import { SimulateRejectionModal } from "@/components/agent/SimulateRejectionModal";

export default function AgentControlCenterPage() {
  const {
    state,
    triggerAgentRun,
    approvePlan,
    rejectPlan,
    simulateRecipientRejection,
    explainPlanWithAI,
  } = useApp();

  const [isRunning, setIsRunning] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "info";
    text: string;
  } | null>(null);

  const pendingPlans = state.proposedPlans.filter((p) => p.status === "pending_approval");
  const approvedPlans = state.proposedPlans.filter((p) => p.status === "approved");
  const latestRun = state.agentRuns[0];

  const handleRunAgent = () => {
    setIsRunning(true);
    setNotification(null);
    setTimeout(() => {
      triggerAgentRun();
      setIsRunning(false);
      setNotification({
        type: "success",
        text: "Agent matching completed. New plans generated and awaiting coordinator approval.",
      });
    }, 500);
  };

  const handleApprove = (planId: string) => {
    approvePlan(planId);
    setNotification({
      type: "success",
      text: "Rescue plan approved! Active mission created and food quantity reserved.",
    });
  };

  const handleReject = (planId: string) => {
    rejectPlan(planId, "Declined by dispatch coordinator");
    setNotification({
      type: "info",
      text: "Plan declined. Listing returned to available pool.",
    });
  };

  const handleSimulateRejection = (missionId: string, reason: string) => {
    const recoveryMsg = simulateRecipientRejection(missionId, reason);
    setNotification({
      type: "warning",
      text: recoveryMsg,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-forest-950">
              AI Rescue Coordination Agent
            </h2>
            <Badge variant="lime">Autonomous Loop Ready</Badge>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Stateful matching engine, deterministic safety verification, and human-in-the-loop approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRejectionModalOpen(true)}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          >
            Simulate Rejection
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAgent}
            disabled={isRunning}
            icon={<Bot className={`w-4 h-4 ${isRunning ? "animate-spin" : "text-lime-accent"}`} />}
          >
            {isRunning ? "Running Agent Engine..." : "Run Rescue Agent"}
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : notification.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Agent Status KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-[11px] text-charcoal-subtle uppercase tracking-wider font-medium">
            Agent Status
          </span>
          <div className="text-base font-bold text-forest-950 mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Standby / Ready</span>
          </div>
          <span className="text-[10px] text-charcoal-muted">Strict deterministic gate active</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-[11px] text-charcoal-subtle uppercase tracking-wider font-medium">
            Pending Human Approval
          </span>
          <div className="text-xl font-bold text-forest-900 mt-1">
            {pendingPlans.length} plans
          </div>
          <span className="text-[10px] text-charcoal-muted">Requires coordinator confirmation</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-[11px] text-charcoal-subtle uppercase tracking-wider font-medium">
            Active Dispatched
          </span>
          <div className="text-xl font-bold text-charcoal mt-1">
            {state.missions.filter((m) => ["approved", "pickup_confirmed"].includes(m.status)).length} missions
          </div>
          <Link href="/missions" className="text-[10px] text-forest-800 hover:underline">
            View live missions &rarr;
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-border">
          <span className="text-[11px] text-charcoal-subtle uppercase tracking-wider font-medium">
            Verified Deliveries
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {state.missions.filter((m) => m.status === "delivery_confirmed").length} rescues
          </div>
          <span className="text-[10px] text-charcoal-muted">Inspected and confirmed</span>
        </div>
      </div>

      {/* Main Section: Proposed Rescue Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-charcoal">
              Proposed Rescue Plans
            </h3>
            {pendingPlans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-300">
                {pendingPlans.length} Pending
              </span>
            )}
          </div>

          <span className="text-xs text-charcoal-subtle">
            All proposed transfers respect dietary, storage, and operating hour constraints.
          </span>
        </div>

        {pendingPlans.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-surface-border bg-white text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-800 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">
                No rescue plans currently awaiting approval
              </p>
              <p className="text-xs text-charcoal-muted mt-1 max-w-md mx-auto">
                All eligible surplus batches are matched or active. Click below to analyze existing inventory and estimate fresh surpluses.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAgent}
              disabled={isRunning}
              icon={<Bot className="w-3.5 h-3.5" />}
            >
              Analyze &amp; Propose Plans
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onApprove={handleApprove}
                onReject={handleReject}
                onExplainAI={explainPlanWithAI}
              />
            ))}
          </div>
        )}
      </div>

      {/* Execution Trace & Audit Trail Inspector */}
      <div className="pt-2">
        <TraceViewer events={state.traceEvents} />
      </div>

      {/* Simulate Rejection Modal */}
      <SimulateRejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        missions={state.missions}
        onSimulate={handleSimulateRejection}
      />
    </div>
  );
}
