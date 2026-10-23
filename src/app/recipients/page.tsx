"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  MapPin,
  Thermometer,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { Recipient } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RecipientModal } from "@/components/recipients/RecipientModal";

export default function RecipientDirectoryPage() {
  const {
    state,
    addRecipient,
    updateRecipient,
    toggleRecipientVerification,
    toggleRecipientAvailability,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);

  const filteredRecipients = state.recipients.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSaveRecipient = (data: any) => {
    if (editingRecipient) {
      updateRecipient(editingRecipient.id, data);
      setEditingRecipient(null);
    } else {
      addRecipient(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-forest-950">
            Recipient Organization Directory
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Manage certified shelters, soup kitchens, and community food distribution partners.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingRecipient(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Register Recipient
        </Button>
      </div>

      {/* Safety & Eligibility Rule Notice */}
      <div className="p-3.5 rounded-xl border border-forest-200 bg-forest-50/50 flex items-start gap-3 text-xs text-forest-950">
        <ShieldCheck className="w-5 h-5 text-forest-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-forest-900">Deterministic Safety Gate:</span>{" "}
          Unverified organizations or facilities marked unavailable are automatically rejected by the matching engine before any match score is computed. No AI recommendation can bypass certification or temperature compliance.
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-charcoal-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search organizations, addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-charcoal-muted font-medium">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
          >
            <option value="all">All Types ({state.recipients.length})</option>
            <option value="shelter">Emergency Shelter</option>
            <option value="food_bank">Food Bank / Pantry</option>
            <option value="soup_kitchen">Soup Kitchen</option>
            <option value="community_fridge">Community Fridge</option>
            <option value="youth_center">Youth &amp; Family Center</option>
          </select>
        </div>
      </div>

      {/* Recipients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipients.map((recipient) => {
          const remainingCap = recipient.capacityMeals - recipient.currentAllocatedMeals;
          const usagePercent = Math.min(
            100,
            Math.round((recipient.currentAllocatedMeals / recipient.capacityMeals) * 100)
          );

          return (
            <div
              key={recipient.id}
              className={`p-5 rounded-xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                !recipient.isVerified || !recipient.isAvailable
                  ? "border-amber-200 bg-amber-50/10"
                  : "border-surface-border hover:border-forest-200"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal leading-tight">
                      {recipient.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-charcoal-muted mt-1">
                      <MapPin className="w-3 h-3 text-charcoal-subtle shrink-0" />
                      <span>{recipient.distanceKm} km away • {recipient.address}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingRecipient(recipient);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 my-3">
                  <Badge variant={recipient.isVerified ? "forest" : "danger"}>
                    {recipient.isVerified ? "Verified Partner" : "Unverified"}
                  </Badge>

                  <Badge variant={recipient.isAvailable ? "success" : "neutral"}>
                    {recipient.isAvailable ? "Open for Pickups" : "Temporarily Closed"}
                  </Badge>

                  <span className="text-[10px] font-mono text-charcoal-subtle uppercase px-2 py-0.5 rounded bg-surface-muted">
                    {recipient.type.replace("_", " ")}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="p-3 rounded-lg bg-surface-muted/50 border border-surface-border my-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-muted font-medium">Remaining Intake</span>
                    <span className="font-bold text-forest-900">
                      {remainingCap} / {recipient.capacityMeals} meals
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        usagePercent > 80 ? "bg-amber-500" : "bg-forest-700"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-charcoal-subtle">
                    <span>Window: {recipient.collectionWindow.start} - {recipient.collectionWindow.end}</span>
                    <span>{usagePercent}% Allocated</span>
                  </div>
                </div>

                {/* Storage & Category capabilities */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1 text-charcoal-muted">
                    <Thermometer className="w-3 h-3 text-charcoal-subtle shrink-0" />
                    <span className="capitalize">
                      {recipient.storageCapabilities.join(", ")}
                    </span>
                  </div>

                  <div className="text-charcoal-subtle truncate">
                    Categories: {recipient.acceptedCategories.map((c) => c.replace("_", " ")).join(", ")}
                  </div>
                </div>
              </div>

              {/* Footer Controls & Reliability */}
              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-charcoal-subtle">Reliability:</span>
                  <span className="font-semibold text-forest-900">
                    {recipient.recordedReliabilityScore !== null
                      ? `${Math.round(recipient.recordedReliabilityScore * 100)}%`
                      : "New (No History)"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRecipientVerification(recipient.id)}
                    className="px-2 py-1 text-[10px] font-medium border border-surface-border rounded-md hover:bg-surface-muted transition-colors text-charcoal"
                    title="Toggle verification status to test safety filtering"
                  >
                    Toggle Verify
                  </button>

                  <button
                    onClick={() => toggleRecipientAvailability(recipient.id)}
                    className="px-2 py-1 text-[10px] font-medium border border-surface-border rounded-md hover:bg-surface-muted transition-colors text-charcoal"
                    title="Toggle availability status to test safety filtering"
                  >
                    Toggle Avail
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipient Modal */}
      <RecipientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecipient(null);
        }}
        onSave={handleSaveRecipient}
        initialData={editingRecipient}
      />
    </div>
  );
}
