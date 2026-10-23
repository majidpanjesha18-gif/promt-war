"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Scale,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { ProposedPlan } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface PlanCardProps {
  plan: ProposedPlan;
  onApprove: (planId: string) => void;
  onReject: (planId: string) => void;
  onExplainAI: (planId: string) => Promise<{ success: boolean; source: 'gemini' | 'deterministic' }>;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onApprove,
  onReject,
  onExplainAI,
}) => {
  const [isExplaining, setIsExplaining] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  const handleExplain = async () => {
    setIsExplaining(true);
    await onExplainAI(plan.id);
    setIsExplaining(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-forest-700 bg-forest-50 border-forest-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  return (
    <div className="p-5 rounded-xl border border-surface-border bg-white shadow-xs hover:border-forest-300 transition-all space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-muted text-charcoal-subtle">
              {plan.id.slice(0, 15)}...
            </span>
            <Badge variant="lime">Awaiting Human Approval</Badge>
          </div>
          <h3 className="text-base font-bold text-charcoal mt-1">
            {plan.listingTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`px-3 py-1 rounded-lg border font-bold text-sm flex items-center gap-1.5 ${getScoreColor(
              plan.matchScore
            )}`}
          >
            <span>Match Score:</span>
            <span className="text-base">{plan.matchScore}</span>
            <span className="text-xs font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Recommended Match Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-surface-light border border-surface-border">
        <div>
          <span className="text-[11px] text-charcoal-subtle font-medium uppercase tracking-wider">
            Assigned Recipient Target
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-forest-800 shrink-0" />
            <span className="text-sm font-bold text-forest-950">
              {plan.recipientName}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-charcoal-subtle font-medium uppercase tracking-wider">
            Transfer Quantity &amp; Deadline
          </span>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="font-bold text-charcoal">
              {plan.mealQuantity} meals
            </span>
            <span className="text-charcoal-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Before {new Date(plan.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Rationale & Gemini Badge */}
      <div className="p-3.5 rounded-lg bg-forest-50/40 border border-forest-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-forest-800" />
            <span className="text-xs font-semibold text-forest-950">
              Decision Analysis
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                plan.explanationSource === "gemini"
                  ? "bg-purple-50 text-purple-800 border-purple-200 font-semibold"
                  : "bg-forest-100 text-forest-800 border-forest-200"
              }`}
            >
              {plan.explanationSource === "gemini"
                ? "✨ Google Gemini Synthesized"
                : "Deterministic Engine Rationale"}
            </span>

            <button
              onClick={handleExplain}
              disabled={isExplaining}
              className="text-[11px] text-forest-800 font-medium hover:underline flex items-center gap-1"
            >
              <Sparkles className={`w-3 h-3 ${isExplaining ? "animate-spin" : ""}`} />
              {isExplaining ? "Analyzing..." : "Gemini Re-Analyze"}
            </button>
          </div>
        </div>

        <p className="text-xs text-charcoal leading-relaxed">
          {plan.explanation}
        </p>
      </div>

      {/* Match Factor Breakdown Toggle */}
      <div>
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="text-xs text-charcoal-muted hover:text-charcoal font-medium flex items-center gap-1"
        >
          <span>{showFactors ? "Hide factor scores" : "View transparent factor scores"}</span>
          <ArrowRight className={`w-3 h-3 transition-transform ${showFactors ? "rotate-90" : ""}`} />
        </button>

        {showFactors && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5 p-3 rounded-lg bg-surface-muted/50 border border-surface-border text-xs">
            <div>
              <span className="text-charcoal-subtle">Capacity Fit:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.capacityFit * 100)}%
              </span>
            </div>
            <div>
              <span className="text-charcoal-subtle">Route Suitability:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.routeSuitability * 100)}%
              </span>
            </div>
            <div>
              <span className="text-charcoal-subtle">Time Urgency:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.timeUrgency * 100)}%
              </span>
            </div>
            <div>
              <span className="text-charcoal-subtle">Food Compatibility:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.foodCompatibility * 100)}%
              </span>
            </div>
            <div>
              <span className="text-charcoal-subtle">Operating Window:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.collectionFeasibility * 100)}%
              </span>
            </div>
            <div>
              <span className="text-charcoal-subtle">Recipient Reliability:</span>{" "}
              <span className="font-semibold text-charcoal">
                {Math.round(plan.factors.recipientReliability * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fallback Recipients If Rejected */}
      {plan.fallbackRecipients && plan.fallbackRecipients.length > 0 && (
        <div className="text-[11px] text-charcoal-subtle">
          <span className="font-semibold text-charcoal-muted">Ready Fallback Options: </span>
          {plan.fallbackRecipients.map((f, i) => (
            <span key={f.recipientId}>
              {f.recipientName} ({f.score}/100)
              {i < plan.fallbackRecipients.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}

      {/* Approval Gate Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReject(plan.id)}
          icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
        >
          Decline Plan
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onApprove(plan.id)}
          icon={<CheckCircle className="w-3.5 h-3.5 text-lime-accent" />}
        >
          Approve &amp; Dispatch Mission
        </Button>
      </div>
    </div>
  );
};
