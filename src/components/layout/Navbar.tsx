"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const Navbar: React.FC = () => {
  const { state, triggerAgentRun, resetDemoData } = useApp();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRunningAgent, setIsRunningAgent] = useState(false);

  const pendingPlans = state.proposedPlans.filter((p) => p.status === "pending_approval");

  const handleRunAgent = () => {
    setIsRunningAgent(true);
    setTimeout(() => {
      triggerAgentRun();
      setIsRunningAgent(false);
    }, 400);
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setIsResetModalOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-surface-border bg-white px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
            Interactive Hackathon Demo Mode
          </span>
          <span className="text-xs text-charcoal-muted hidden sm:inline">
            Local simulated state • Safe client-side persistence
          </span>
        </div>

        <div className="flex items-center gap-3">
          {pendingPlans.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-lime-50 border border-lime-300 text-lime-900 rounded-lg text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-lime-600 animate-ping"></span>
              <span>{pendingPlans.length} rescue plan(s) awaiting approval</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Demo Data
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAgent}
            disabled={isRunningAgent}
            icon={<Bot className={`w-4 h-4 ${isRunningAgent ? "animate-spin" : "text-lime-accent"}`} />}
          >
            {isRunningAgent ? "Agent Analyzing..." : "Run Rescue Agent"}
          </Button>
        </div>
      </header>

      {/* Demo Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Environment"
        description="Return state to initial seed data"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset to Default Demo State</p>
              <p className="mt-1 text-amber-800">
                This will reset all food listings, recipient capacities, active missions, and execution traces back to the standard hackathon demo scenario.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReset}
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
