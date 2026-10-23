"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Truck,
  Boxes,
} from "lucide-react";
import { AgentEventType, AgentTraceEvent } from "@/types";
import { Badge } from "../ui/Badge";

interface TraceViewerProps {
  events: AgentTraceEvent[];
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ events }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const getEventBadge = (type: AgentEventType) => {
    switch (type) {
      case "RUN_STARTED":
      case "RUN_COMPLETED":
        return <Badge variant="forest">{type}</Badge>;
      case "PLAN_PROPOSED":
      case "PLAN_APPROVED":
        return <Badge variant="lime">{type}</Badge>;
      case "RECIPIENT_REJECTED":
      case "RUN_FAILED":
        return <Badge variant="danger">{type}</Badge>;
      case "RECOVERY_STARTED":
      case "ALTERNATIVE_PROPOSED":
        return <Badge variant="warning">{type}</Badge>;
      case "PICKUP_CONFIRMED":
      case "DELIVERY_CONFIRMED":
        return <Badge variant="success">{type}</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-charcoal">
            Agent Execution Trace &amp; Audit Trail
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Immutable log of state evaluations, eligibility filters, and dispatch decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-muted">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-forest-800"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="PLAN_PROPOSED">PLAN_PROPOSED</option>
            <option value="PLAN_APPROVED">PLAN_APPROVED</option>
            <option value="RECIPIENT_REJECTED">RECIPIENT_REJECTED</option>
            <option value="RECOVERY_STARTED">RECOVERY_STARTED</option>
            <option value="ALTERNATIVE_PROPOSED">ALTERNATIVE_PROPOSED</option>
            <option value="DELIVERY_CONFIRMED">DELIVERY_CONFIRMED</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-muted bg-surface-muted/30 rounded-lg">
            No trace events recorded yet. Trigger the rescue agent to generate audit steps.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedId === evt.id;
            const hasDetails = evt.details && Object.keys(evt.details).length > 0;

            return (
              <div
                key={evt.id}
                className="border border-surface-border rounded-lg bg-surface-light text-xs overflow-hidden transition-colors"
              >
                <div
                  onClick={() => hasDetails && setExpandedId(isExpanded ? null : evt.id)}
                  className={`p-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-forest-50/40 ${
                    isExpanded ? "bg-forest-50/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 shrink-0 text-charcoal-subtle">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEventBadge(evt.type)}
                        <span className="text-[10px] font-mono text-charcoal-subtle">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-charcoal text-xs pt-1 break-words">
                        {evt.message}
                      </p>
                    </div>
                  </div>

                  {hasDetails && (
                    <span className="text-[10px] text-forest-800 font-medium shrink-0 pt-1">
                      {isExpanded ? "Collapse" : "Inspect payload"}
                    </span>
                  )}
                </div>

                {isExpanded && hasDetails && (
                  <div className="p-3 bg-charcoal text-white font-mono text-[11px] border-t border-surface-border overflow-x-auto">
                    <pre className="text-lime-200">
                      {JSON.stringify(evt.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
