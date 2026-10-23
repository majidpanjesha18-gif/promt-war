"use client";

import React, { useState, useEffect } from "react";
import { FoodCategory, FoodListing, StorageRequirement } from "@/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: FoodListing | null;
}

export const ListingModal: React.FC<ListingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FoodCategory>("prepared_meals");
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState("meals");
  const [storageRequirement, setStorageRequirement] = useState<StorageRequirement>("refrigerated");
  const [safeCollectionDeadline, setSafeCollectionDeadline] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [donorName, setDonorName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setCategory(initialData.category);
      setQuantity(initialData.quantity);
      setUnit(initialData.unit);
      setStorageRequirement(initialData.storageRequirement);
      setSafeCollectionDeadline(
        new Date(initialData.safeCollectionDeadline).toISOString().slice(0, 16)
      );
      setPreparationTime(
        new Date(initialData.preparationTime).toISOString().slice(0, 16)
      );
      setDonorName(initialData.donorName);
      setPickupAddress(initialData.pickupLocation.address);
      setPickupPhone(initialData.pickupLocation.contactPhone);
      setSafetyNotes(initialData.safetyNotes || "");
    } else {
      // Default to sensible new listing values
      const now = new Date();
      const in6h = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      setTitle("");
      setDescription("");
      setCategory("prepared_meals");
      setQuantity(30);
      setUnit("meals");
      setStorageRequirement("refrigerated");
      setPreparationTime(now.toISOString().slice(0, 16));
      setSafeCollectionDeadline(in6h.toISOString().slice(0, 16));
      setDonorName("Metro Kitchen");
      setPickupAddress("500 Market St");
      setPickupPhone("555-0100");
      setSafetyNotes("Standard temperature logs verified.");
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a descriptive title.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    if (!safeCollectionDeadline) {
      setError("Safe collection deadline is strictly required for food safety.");
      return;
    }
    if (new Date(safeCollectionDeadline).getTime() <= Date.now()) {
      setError("Collection deadline must be in the future.");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      quantity: Number(quantity),
      unit,
      storageRequirement,
      safeCollectionDeadline: new Date(safeCollectionDeadline).toISOString(),
      preparationTime: new Date(preparationTime || Date.now()).toISOString(),
      donorName: donorName.trim() || "Local Provider",
      pickupLocation: {
        name: donorName.trim() || "Main Facility",
        address: pickupAddress.trim() || "100 Main St",
        contactPhone: pickupPhone.trim() || "555-0000",
      },
      status: initialData ? initialData.status : "available",
      dietaryFlags: initialData?.dietaryFlags || ["vegetarian"],
      safetyNotes: safetyNotes.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Food Surplus Listing" : "Add Surplus Listing"}
      description="Record surplus batch with explicit safety and deadline parameters"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Item Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Roasted Chicken & Quinoa Bowls"
            className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
            >
              <option value="prepared_meals">Prepared Meals</option>
              <option value="produce">Fresh Produce</option>
              <option value="bakery">Bakery & Grains</option>
              <option value="proteins">Proteins & Meats</option>
              <option value="dairy">Dairy & Refrigerated</option>
              <option value="packaged_goods">Packaged Goods</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Storage Requirement *
            </label>
            <select
              value={storageRequirement}
              onChange={(e) => setStorageRequirement(e.target.value as StorageRequirement)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
            >
              <option value="refrigerated">Refrigerated (&le;40°F)</option>
              <option value="ambient">Ambient (Room Temp)</option>
              <option value="hot_hold">Hot Hold (&ge;140°F)</option>
              <option value="frozen">Frozen (&le;0°F)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Quantity (Meals) *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Donor / Facility Name *
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="e.g. Grand Central Catering"
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Preparation Time
            </label>
            <input
              type="datetime-local"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Safe Collection Deadline *
            </label>
            <input
              type="datetime-local"
              value={safeCollectionDeadline}
              onChange={(e) => setSafeCollectionDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Pickup Address
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g. 100 Main St"
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={pickupPhone}
              onChange={(e) => setPickupPhone(e.target.value)}
              placeholder="555-0100"
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Food Safety &amp; Handling Notes
          </label>
          <input
            type="text"
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
            placeholder="e.g. Temperature checked at 38°F. Packed in sealed cambros."
            className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {initialData ? "Update Listing" : "Add Listing"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
