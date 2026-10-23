import React from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { AgentTraceEvent } from "@/types";
import { Badge } from "../ui/Badge";

interface RecentDecisionsProps {
  events: AgentTraceEvent[];
}

export const RecentDecisions: React.FC<RecentDecisionsProps> = ({ events }) => {
  const recent = events.slice(0, 5);

  const getEventIcon = (type: AgentTraceEvent["type"]) => {
    switch (type) {
      case "PLAN_APPROVED":
      case "DELIVERY_CONFIRMED":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "RECIPIENT_REJECTED":
      case "RUN_FAILED":
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case "RECOVERY_STARTED":
      case "ALTERNATIVE_PROPOSED":
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />;
      default:
        return <Bot className="w-3.5 h-3.5 text-forest-700" />;
    }
  };

  const getEventBadge = (type: AgentTraceEvent["type"]) => {
    switch (type) {
      case "PLAN_APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "PLAN_PROPOSED":
        return <Badge variant="lime">Proposed</Badge>;
      case "RECIPIENT_REJECTED":
        return <Badge variant="danger">Declined</Badge>;
      case "ALTERNATIVE_PROPOSED":
        return <Badge variant="warning">Alternative</Badge>;
      case "DELIVERY_CONFIRMED":
        return <Badge variant="success">Delivered</Badge>;
      case "PICKUP_CONFIRMED":
        return <Badge variant="info">Picked Up</Badge>;
      default:
        return <Badge variant="neutral">{type.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-forest-800" />
            <h3 className="text-sm font-semibold text-charcoal">
              Recent Agent Decisions & Traces
            </h3>
          </div>
          <Link
            href="/agent"
            className="text-xs font-medium text-forest-700 hover:text-forest-900 flex items-center gap-1"
          >
            Agent Center <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-6 text-center text-xs text-charcoal-muted bg-surface-muted/30 rounded-lg">
            No agent actions recorded yet. Click &ldquo;Run Rescue Agent&rdquo; to start.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg border border-surface-border bg-surface-light flex items-start gap-3"
              >
                <div className="mt-0.5 shrink-0">{getEventIcon(evt.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-charcoal truncate">
                      {evt.message}
                    </span>
                    {getEventBadge(evt.type)}
                  </div>
                  <div className="text-[10px] text-charcoal-subtle font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-charcoal-subtle flex items-center justify-between">
        <span>Transparent audit logs saved</span>
        <Link href="/agent" className="text-forest-800 font-semibold hover:underline">
          View Execution Trace →
        </Link>
      </div>
    </div>
  );
};
