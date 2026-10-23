import { FoodListing, Recipient } from "@/types";

export interface EligibilityResult {
  isEligible: boolean;
  rejectionReasons: string[];
}

/**
 * Validates whether a recipient meets all strict business and safety criteria
 * to accept a food surplus listing.
 */
export function checkRecipientEligibility(
  listing: FoodListing,
  recipient: Recipient,
  currentSimulatedTime: Date = new Date()
): EligibilityResult {
  const rejectionReasons: string[] = [];

  // 1. Verification status check
  if (!recipient.isVerified) {
    rejectionReasons.push("Recipient organization is not officially verified.");
  }

  // 2. Availability status check
  if (!recipient.isAvailable) {
    rejectionReasons.push("Recipient organization is currently marked unavailable for pickups.");
  }

  // 3. Pickup deadline expiration check
  const deadlineDate = new Date(listing.safeCollectionDeadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= currentSimulatedTime.getTime()) {
    rejectionReasons.push("Food safe collection deadline has already elapsed.");
  }

  // 4. Remaining capacity check (avoid over-allocation)
  const remainingCapacity = recipient.capacityMeals - recipient.currentAllocatedMeals;
  if (remainingCapacity < listing.quantity) {
    rejectionReasons.push(
      `Insufficient capacity: needs ${listing.quantity} meals, but only ${remainingCapacity} available (${recipient.capacityMeals} total, ${recipient.currentAllocatedMeals} already allocated).`
    );
  }

  // 5. Food category compatibility check
  if (!recipient.acceptedCategories.includes(listing.category)) {
    rejectionReasons.push(
      `Food category mismatch: Listing is '${listing.category.replace("_", " ")}', which is not in recipient's accepted list.`
    );
  }

  // 6. Storage capability check (temperature / safety)
  if (!recipient.storageCapabilities.includes(listing.storageRequirement)) {
    rejectionReasons.push(
      `Storage incompatibility: Requires '${listing.storageRequirement}' storage, but recipient only supports: ${recipient.storageCapabilities.join(", ")}.`
    );
  }

  // 7. Collection window feasibility check
  // Verify that the collection deadline falls within recipient's operating hours
  const isUtc = listing.safeCollectionDeadline.endsWith("Z");
  const deadlineHours = isUtc ? deadlineDate.getUTCHours() : deadlineDate.getHours();
  const deadlineMinutes = isUtc ? deadlineDate.getUTCMinutes() : deadlineDate.getMinutes();
  const deadlineTimeMinutes = deadlineHours * 60 + deadlineMinutes;

  const [startH, startM] = recipient.collectionWindow.start.split(":").map(Number);
  const [endH, endM] = recipient.collectionWindow.end.split(":").map(Number);
  const startWindowMinutes = startH * 60 + startM;
  const endWindowMinutes = endH * 60 + endM;

  // Window check: if pickup deadline occurs outside the operating hours
  if (deadlineTimeMinutes < startWindowMinutes || deadlineTimeMinutes > endWindowMinutes) {
    rejectionReasons.push(
      `Collection window mismatch: Deadline is at ${formatTime(deadlineHours, deadlineMinutes)}, outside operating window (${recipient.collectionWindow.start} - ${recipient.collectionWindow.end}).`
    );
  }

  return {
    isEligible: rejectionReasons.length === 0,
    rejectionReasons,
  };
}

function formatTime(h: number, m: number): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}
