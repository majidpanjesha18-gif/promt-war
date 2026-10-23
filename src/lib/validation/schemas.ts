import { z } from "zod";

export const FoodCategoryEnum = z.enum([
  "prepared_meals",
  "produce",
  "bakery",
  "dairy",
  "packaged_goods",
  "proteins",
]);

export const StorageRequirementEnum = z.enum([
  "ambient",
  "refrigerated",
  "frozen",
  "hot_hold",
]);

export const DietaryTypeEnum = z.enum([
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten_free",
  "dairy_free",
  "nut_free",
]);

export const ListingStatusEnum = z.enum([
  "available",
  "reserved",
  "rescued",
  "expired",
  "unavailable",
]);

export const FoodListingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().default(""),
  category: FoodCategoryEnum,
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unit: z.string().default("meals"),
  preparationTime: z.string().datetime({ message: "Must be a valid ISO datetime" }),
  safeCollectionDeadline: z.string().datetime({ message: "Must be a valid ISO datetime" }),
  storageRequirement: StorageRequirementEnum,
  dietaryFlags: z.array(DietaryTypeEnum).default([]),
  pickupLocation: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
    contactPhone: z.string().min(5),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  status: ListingStatusEnum.default("available"),
  donorName: z.string().min(2),
  safetyNotes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const RecipientTypeEnum = z.enum([
  "shelter",
  "food_bank",
  "soup_kitchen",
  "community_fridge",
  "youth_center",
]);

export const RecipientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  type: RecipientTypeEnum,
  address: z.string().min(3),
  distanceKm: z.number().nonnegative(),
  capacityMeals: z.number().int().positive(),
  currentAllocatedMeals: z.number().int().nonnegative().default(0),
  collectionWindow: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm"),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm"),
  }),
  acceptedCategories: z.array(FoodCategoryEnum).min(1, "Must accept at least one category"),
  storageCapabilities: z.array(StorageRequirementEnum).min(1, "Must support at least one storage type"),
  dietaryCapabilities: z.array(DietaryTypeEnum).default([]),
  isVerified: z.boolean(),
  isAvailable: z.boolean(),
  contactName: z.string().min(2),
  phone: z.string().min(5),
  completedMissionsCount: z.number().int().nonnegative().default(0),
  rejectedMissionsCount: z.number().int().nonnegative().default(0),
  recordedReliabilityScore: z.number().min(0).max(1).nullable().default(null),
});

export const GeminiExplainRequestSchema = z.object({
  listing: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    quantity: z.number(),
    storageRequirement: z.string(),
    safeCollectionDeadline: z.string(),
  }),
  matchedRecipient: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    distanceKm: z.number(),
    capacityMeals: z.number(),
    collectionWindow: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  matchScore: z.number(),
  factors: z.object({
    collectionFeasibility: z.number(),
    capacityFit: z.number(),
    routeSuitability: z.number(),
    timeUrgency: z.number(),
    foodCompatibility: z.number(),
    recipientReliability: z.number(),
  }),
  fallbacks: z.array(
    z.object({
      recipientName: z.string(),
      score: z.number(),
      reason: z.string(),
    })
  ).default([]),
});

export const GeminiExplainResponseSchema = z.object({
  summary: z.string().min(10),
  primaryRecommendationReason: z.string().min(5),
  tradeOffAnalysis: z.string().min(10),
  riskMitigation: z.string().min(5),
});
