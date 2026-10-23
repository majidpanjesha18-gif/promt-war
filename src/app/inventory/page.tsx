"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Bot,
  AlertCircle,
  Thermometer,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";
import { FoodListing, ListingStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ListingModal } from "@/components/inventory/ListingModal";

export default function SurplusInventoryPage() {
  const { state, addListing, updateListing, deleteListing } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<FoodListing | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const filteredListings = state.listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSaveListing = (data: any) => {
    if (editingListing) {
      updateListing(editingListing.id, data);
      setEditingListing(null);
    } else {
      addListing(data);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteCandidateId) {
      deleteListing(deleteCandidateId);
      setDeleteCandidateId(null);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case "available":
        return <Badge variant="success">Available</Badge>;
      case "reserved":
        return <Badge variant="lime">Reserved</Badge>;
      case "rescued":
        return <Badge variant="forest">Rescued</Badge>;
      case "expired":
        return <Badge variant="danger">Expired</Badge>;
      case "unavailable":
        return <Badge variant="neutral">Unavailable</Badge>;
    }
  };

  const getTimeRemaining = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return { text: "Deadline Passed", isUrgent: true };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: `${hours}h ${mins}m left`,
      isUrgent: hours < 6,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-forest-950">
            Surplus Food Inventory
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Track surplus listings, enforce food-safe storage parameters, and dispatch batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/agent">
            <Button variant="outline" size="sm" icon={<Bot className="w-3.5 h-3.5 text-forest-700" />}>
              Match in Agent
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingListing(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Surplus Batch
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-xl bg-white border border-surface-border">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-charcoal-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, category, donor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-charcoal-muted font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
          >
            <option value="all">All Statuses ({state.listings.length})</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="rescued">Rescued</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/60 text-charcoal-subtle uppercase tracking-wider text-[11px] border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Listing Details</th>
                <th className="px-4 py-3 font-semibold">Category &amp; Storage</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Safe Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal-muted">
                    No food listings found matching query.
                  </td>
                </tr>
              ) : (
                filteredListings.map((listing) => {
                  const deadlineInfo = getTimeRemaining(listing.safeCollectionDeadline);
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-surface-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-charcoal">
                          {listing.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-charcoal-muted mt-0.5">
                          <MapPin className="w-3 h-3 text-charcoal-subtle shrink-0" />
                          <span className="truncate">{listing.donorName}</span>
                        </div>
                        {listing.safetyNotes && (
                          <div className="text-[10px] text-forest-800 mt-1 italic">
                            &ldquo;{listing.safetyNotes}&rdquo;
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="capitalize font-medium text-charcoal">
                          {listing.category.replace("_", " ")}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-charcoal-subtle mt-0.5">
                          <Thermometer className="w-3 h-3" />
                          <span>{listing.storageRequirement}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-forest-950 text-sm">
                          {listing.quantity}
                        </span>{" "}
                        <span className="text-charcoal-subtle">{listing.unit}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-charcoal">
                          {new Date(listing.safeCollectionDeadline).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium mt-0.5 ${
                            deadlineInfo.isUrgent
                              ? "text-rose-600 font-bold"
                              : "text-charcoal-muted"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {deadlineInfo.text}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(listing.status)}
                      </td>

                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingListing(listing);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-charcoal-muted hover:text-forest-800 hover:bg-forest-50 rounded-md transition-colors"
                          title="Edit Listing"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteCandidateId(listing.id)}
                          className="p-1.5 text-charcoal-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Listing Modal */}
      <ListingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingListing(null);
        }}
        onSave={handleSaveListing}
        initialData={editingListing}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCandidateId)}
        onClose={() => setDeleteCandidateId(null)}
        title="Delete Food Listing"
        description="Destructive action confirmation"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-charcoal-muted">
            Are you sure you want to delete this listing? Any associated unapproved plans will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteCandidateId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Delete Listing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
