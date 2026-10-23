import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Clock, MapPin } from "lucide-react";
import { FoodListing } from "@/types";
import { Badge } from "../ui/Badge";

interface UrgentInventoryProps {
  listings: FoodListing[];
}

export const UrgentInventory: React.FC<UrgentInventoryProps> = ({ listings }) => {
  // Sort by earliest collection deadline
  const urgent = [...listings]
    .filter((l) => l.status === "available")
    .sort(
      (a, b) =>
        new Date(a.safeCollectionDeadline).getTime() -
        new Date(b.safeCollectionDeadline).getTime()
    )
    .slice(0, 4);

  const getTimeRemaining = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-charcoal">
              Urgent Inventory Attention
            </h3>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-medium text-forest-700 hover:text-forest-900 flex items-center gap-1"
          >
            All Inventory <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {urgent.length === 0 ? (
          <div className="p-6 text-center text-xs text-charcoal-muted bg-surface-muted/30 rounded-lg">
            No active surplus listings requiring immediate dispatch.
          </div>
        ) : (
          <div className="space-y-3">
            {urgent.map((item) => {
              const remaining = getTimeRemaining(item.safeCollectionDeadline);
              const isCrit = remaining.startsWith("0h") || remaining.startsWith("1h") || remaining.startsWith("2h") || remaining.startsWith("3h");

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-surface-border bg-surface-light hover:border-forest-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-charcoal line-clamp-1">
                      {item.title}
                    </span>
                    <Badge variant={isCrit ? "danger" : "warning"}>
                      <Clock className="w-3 h-3 mr-1 inline" />
                      {remaining}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-charcoal-muted">
                    <span className="font-semibold text-forest-900">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-charcoal-subtle" />
                      {item.donorName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-charcoal-subtle flex items-center justify-between">
        <span>Evaluated by safe temperature & hold limits</span>
        <Link href="/agent" className="text-forest-800 font-semibold hover:underline">
          Run Agent Matching →
        </Link>
      </div>
    </div>
  );
};
