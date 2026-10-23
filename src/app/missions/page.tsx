"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Check,
  History,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { MissionStatus, RescueMission } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SimulateRejectionModal } from "@/components/agent/SimulateRejectionModal";

export default function RescueMissionsPage() {
  const {
    state,
    confirmPickup,
    confirmDelivery,
    simulateRecipientRejection,
  } = useApp();

  const [selectedMissionForHistory, setSelectedMissionForHistory] = useState<RescueMission | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredMissions = state.missions.filter((m) => {
    if (filterStatus === "all") return true;
    return m.status === filterStatus;
  });

  const handleConfirmPickup = (missionId: string) => {
    setActionError(null);
    const result = confirmPickup(missionId);
    if (!result.success) {
      setActionError(result.error || "Failed to confirm pickup.");
    }
  };

  const handleConfirmDelivery = (missionId: string) => {
    setActionError(null);
    const result = confirmDelivery(missionId);
    if (!result.success) {
      setActionError(result.error || "Failed to confirm delivery.");
    }
  };

  const getStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case "proposed":
        return <Badge variant="lime">Proposed</Badge>;
      case "approved":
        return <Badge variant="info">Approved (Awaiting Pickup)</Badge>;
      case "pickup_confirmed":
        return <Badge variant="warning">Pickup Confirmed (In Transit)</Badge>;
      case "delivery_confirmed":
        return <Badge variant="success">Verified Delivered</Badge>;
      case "rejected":
        return <Badge variant="danger">Recipient Declined</Badge>;
      case "needs_reassignment":
        return <Badge variant="warning">Needs Reassignment</Badge>;
      case "expired":
        return <Badge variant="danger">Expired</Badge>;
      case "cancelled":
        return <Badge variant="neutral">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-forest-950">
            Rescue Missions Lifecycle
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            End-to-end dispatch tracking from approval through physical pickup to verified delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRejectionModalOpen(true)}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          >
            Simulate Rejection
          </Button>

          <Link href="/agent">
            <Button variant="primary" size="sm">
              AI Agent Center &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* State Machine Rules Notice */}
      <div className="p-3.5 rounded-xl border border-forest-200 bg-forest-50/50 flex items-start gap-3 text-xs text-forest-950">
        <ShieldCheck className="w-5 h-5 text-forest-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-forest-900">Enforced Chain of Custody:</span>{" "}
          Physical delivery cannot be confirmed before pickup is verified. Rescued impact numbers only increment upon final verified delivery confirmation at the recipient facility.
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-muted font-medium">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 text-xs border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-forest-800"
          >
            <option value="all">All Missions ({state.missions.length})</option>
            <option value="approved">Approved</option>
            <option value="pickup_confirmed">In Transit (Pickup Confirmed)</option>
            <option value="delivery_confirmed">Verified Delivered</option>
            <option value="rejected">Rejected / Declined</option>
            <option value="needs_reassignment">Needs Reassignment</option>
          </select>
        </div>

        <span className="text-xs text-charcoal-subtle">
          Showing {filteredMissions.length} mission(s)
        </span>
      </div>

      {/* Missions Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/60 text-charcoal-subtle uppercase tracking-wider text-[11px] border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Mission ID &amp; Target</th>
                <th className="px-4 py-3 font-semibold">Food Listing</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal-muted">
                    No rescue missions currently in this status view.
                  </td>
                </tr>
              ) : (
                filteredMissions.map((mission) => {
                  const listing = state.listings.find((l) => l.id === mission.listingId);
                  const recipient = state.recipients.find((r) => r.id === mission.recipientId);

                  return (
                    <tr
                      key={mission.id}
                      className="hover:bg-surface-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-charcoal-subtle">
                          {mission.id}
                        </div>
                        <div className="font-semibold text-charcoal mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-forest-800" />
                          <span>{recipient?.name || mission.recipientId}</span>
                        </div>
                        {mission.rejectionReason && (
                          <div className="text-[10px] text-rose-700 mt-1 italic">
                            Declined: {mission.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-charcoal truncate">
                          {listing?.title || mission.listingId}
                        </div>
                        <div className="text-[11px] text-charcoal-muted capitalize">
                          {listing?.category.replace("_", " ") || "Prepared Meals"} • {listing?.storageRequirement}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-forest-950 text-sm">
                          {mission.mealQuantity}
                        </span>{" "}
                        <span className="text-charcoal-subtle">meals</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-charcoal">
                          {new Date(mission.pickupDeadline).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <span className="text-[10px] text-charcoal-subtle">
                          {new Date(mission.pickupDeadline).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(mission.status)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Step 1: Confirm Pickup */}
                          {mission.status === "approved" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleConfirmPickup(mission.id)}
                              icon={<Truck className="w-3 h-3 text-forest-800" />}
                            >
                              Confirm Pickup
                            </Button>
                          )}

                          {/* Step 2: Confirm Delivery */}
                          {mission.status === "pickup_confirmed" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirmDelivery(mission.id)}
                              icon={<CheckCircle2 className="w-3 h-3 text-lime-accent" />}
                            >
                              Confirm Delivery
                            </Button>
                          )}

                          {/* History Inspector */}
                          <button
                            onClick={() => setSelectedMissionForHistory(mission)}
                            className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded-md transition-colors"
                            title="View Full History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mission History Modal */}
      {selectedMissionForHistory && (
        <Modal
          isOpen={Boolean(selectedMissionForHistory)}
          onClose={() => setSelectedMissionForHistory(null)}
          title={`Mission History: ${selectedMissionForHistory.id}`}
          description="Detailed chain-of-custody audit trail"
          maxWidth="md"
        >
          <div className="space-y-3">
            {selectedMissionForHistory.history.map((h, idx) => (
              <div
                key={h.id || idx}
                className="p-3 rounded-lg border border-surface-border bg-surface-light text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal">
                    {h.fromStatus} &rarr; {h.toStatus}
                  </span>
                  <span className="text-[10px] font-mono text-charcoal-subtle">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-charcoal-muted">{h.note}</p>
                <span className="text-[10px] text-forest-800 font-medium">
                  Actor: {h.actor}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Simulate Rejection Modal */}
      <SimulateRejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        missions={state.missions}
        onSimulate={(missionId, reason) => {
          simulateRecipientRejection(missionId, reason);
        }}
      />
    </div>
  );
}
