"use client";

import React, { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { RescueMission } from "@/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface SimulateRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: RescueMission[];
  onSimulate: (missionId: string, reason: string) => void;
}

export const SimulateRejectionModal: React.FC<SimulateRejectionModalProps> = ({
  isOpen,
  onClose,
  missions,
  onSimulate,
}) => {
  const eligibleMissions = missions.filter((m) =>
    ["approved", "pickup_confirmed"].includes(m.status)
  );

  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    eligibleMissions[0]?.id || ""
  );
  const [reason, setReason] = useState(
    "Emergency maintenance: walk-in refrigeration compressor offline."
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMissionId) return;
    onSimulate(selectedMissionId, reason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Recipient Pickup Rejection"
      description="Test failure-aware recovery and autonomous re-dispatching"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Simulated Failure Scenario</p>
            <p className="mt-0.5 text-amber-800">
              This triggers a real application state transition to <strong>REJECTED</strong>, releases the original recipient&apos;s allocated capacity, and causes the agent to re-evaluate remaining certified partners for an alternative rescue plan.
            </p>
          </div>
        </div>

        {eligibleMissions.length === 0 ? (
          <div className="p-4 text-center text-xs text-charcoal-muted bg-surface-muted rounded-lg">
            No active approved missions available to simulate rejection on. Approve a proposed plan first.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Target Active Mission *
              </label>
              <select
                value={selectedMissionId || eligibleMissions[0]?.id}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-forest-800"
              >
                {eligibleMissions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.mealQuantity} meals (Target: {m.recipientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Recipient Rejection Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-forest-800 mb-2"
              >
                <option value="Emergency maintenance: walk-in refrigeration compressor offline.">
                  Cold Storage Failure: Compressor offline
                </option>
                <option value="Unplanned donation intake: storage currently at maximum capacity.">
                  Capacity Constrained: Large spontaneous donation received
                </option>
                <option value="Volunteer driver unavailable for current collection window.">
                  Logistics Constraint: Volunteer driver unavailable
                </option>
                <option value="Facility undergoing municipal health inspection.">
                  Regulatory: Facility inspection in progress
                </option>
              </select>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
                placeholder="Or custom rejection reason..."
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            disabled={eligibleMissions.length === 0}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Trigger Failure Recovery
          </Button>
        </div>
      </form>
    </Modal>
  );
};
