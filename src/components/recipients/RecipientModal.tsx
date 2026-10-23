"use client";

import React, { useState, useEffect } from "react";
import { FoodCategory, Recipient, RecipientType, StorageRequirement } from "@/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface RecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: Recipient | null;
}

export const RecipientModal: React.FC<RecipientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<RecipientType>("shelter");
  const [address, setAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState(3.5);
  const [capacityMeals, setCapacityMeals] = useState(80);
  const [windowStart, setWindowStart] = useState("08:00");
  const [windowEnd, setWindowEnd] = useState("20:00");
  const [acceptedCategories, setAcceptedCategories] = useState<FoodCategory[]>([
    "prepared_meals",
    "bakery",
    "produce",
  ]);
  const [storageCapabilities, setStorageCapabilities] = useState<StorageRequirement[]>([
    "refrigerated",
    "ambient",
  ]);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setAddress(initialData.address);
      setDistanceKm(initialData.distanceKm);
      setCapacityMeals(initialData.capacityMeals);
      setWindowStart(initialData.collectionWindow.start);
      setWindowEnd(initialData.collectionWindow.end);
      setAcceptedCategories(initialData.acceptedCategories);
      setStorageCapabilities(initialData.storageCapabilities);
      setContactName(initialData.contactName);
      setPhone(initialData.phone);
      setIsVerified(initialData.isVerified);
      setIsAvailable(initialData.isAvailable);
    } else {
      setName("");
      setType("shelter");
      setAddress("120 Civic Center Plaza");
      setDistanceKm(4.0);
      setCapacityMeals(75);
      setWindowStart("08:00");
      setWindowEnd("20:00");
      setAcceptedCategories(["prepared_meals", "bakery", "produce"]);
      setStorageCapabilities(["refrigerated", "ambient"]);
      setContactName("Alex Rivera");
      setPhone("555-0811");
      setIsVerified(true);
      setIsAvailable(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  const toggleCategory = (cat: FoodCategory) => {
    if (acceptedCategories.includes(cat)) {
      if (acceptedCategories.length > 1) {
        setAcceptedCategories(acceptedCategories.filter((c) => c !== cat));
      }
    } else {
      setAcceptedCategories([...acceptedCategories, cat]);
    }
  };

  const toggleStorage = (st: StorageRequirement) => {
    if (storageCapabilities.includes(st)) {
      if (storageCapabilities.length > 1) {
        setStorageCapabilities(storageCapabilities.filter((s) => s !== st));
      }
    } else {
      setStorageCapabilities([...storageCapabilities, st]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }
    if (capacityMeals <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    onSave({
      name: name.trim(),
      type,
      address: address.trim() || "Local Service Area",
      distanceKm: Number(distanceKm),
      capacityMeals: Number(capacityMeals),
      currentAllocatedMeals: initialData?.currentAllocatedMeals || 0,
      collectionWindow: { start: windowStart, end: windowEnd },
      acceptedCategories,
      storageCapabilities,
      dietaryCapabilities: initialData?.dietaryCapabilities || ["vegetarian"],
      contactName: contactName.trim() || "Operations Lead",
      phone: phone.trim() || "555-0000",
      isVerified,
      isAvailable,
      completedMissionsCount: initialData?.completedMissionsCount || 0,
      rejectedMissionsCount: initialData?.rejectedMissionsCount || 0,
      recordedReliabilityScore: initialData?.recordedReliabilityScore ?? null,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Recipient Organization" : "Register Recipient Organization"}
      description="Configure intake capacities, cold chain capabilities, and collection hours"
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
            Organization Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hope Harbor Emergency Shelter"
            className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Recipient Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RecipientType)}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
            >
              <option value="shelter">Emergency Shelter</option>
              <option value="food_bank">Food Bank / Pantry</option>
              <option value="soup_kitchen">Soup Kitchen</option>
              <option value="community_fridge">Community Fridge</option>
              <option value="youth_center">Youth &amp; Family Center</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Estimated Transit Distance (km)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Intake Capacity (Meals) *
            </label>
            <input
              type="number"
              min="5"
              value={capacityMeals}
              onChange={(e) => setCapacityMeals(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Operating Window (Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              />
              <span className="text-xs text-charcoal-muted">to</span>
              <input
                type="time"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-800"
              />
            </div>
          </div>
        </div>

        {/* Accepted Food Categories */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">
            Accepted Food Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                "prepared_meals",
                "produce",
                "bakery",
                "proteins",
                "dairy",
                "packaged_goods",
              ] as FoodCategory[]
            ).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  acceptedCategories.includes(cat)
                    ? "bg-forest-900 text-white border-forest-900"
                    : "bg-surface-muted text-charcoal border-surface-border hover:bg-forest-50"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Capabilities */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">
            Certified Storage Capabilities
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["ambient", "refrigerated", "frozen", "hot_hold"] as StorageRequirement[]).map(
              (st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => toggleStorage(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    storageCapabilities.includes(st)
                      ? "bg-forest-800 text-lime-accent border-forest-800 font-semibold"
                      : "bg-surface-muted text-charcoal border-surface-border hover:bg-forest-50"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="rounded text-forest-800 focus:ring-forest-700"
            />
            Official Safety Verification Certified
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded text-forest-800 focus:ring-forest-700"
            />
            Facility Available for Pickups Today
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {initialData ? "Save Changes" : "Register Recipient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
