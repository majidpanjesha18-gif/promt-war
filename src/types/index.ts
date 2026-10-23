export type FoodCategory =
  | 'prepared_meals'
  | 'produce'
  | 'bakery'
  | 'dairy'
  | 'packaged_goods'
  | 'proteins';

export type StorageRequirement = 'ambient' | 'refrigerated' | 'frozen' | 'hot_hold';

export type DietaryType =
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free';

export type ListingStatus = 'available' | 'reserved' | 'rescued' | 'expired' | 'unavailable';

export interface FoodListing {
  id: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number; // in meals
  unit: string;
  preparationTime: string; // ISO string
  safeCollectionDeadline: string; // ISO string
  storageRequirement: StorageRequirement;
  dietaryFlags: DietaryType[];
  pickupLocation: {
    name: string;
    address: string;
    contactPhone: string;
    lat?: number;
    lng?: number;
  };
  status: ListingStatus;
  donorName: string;
  safetyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecipientType =
  | 'shelter'
  | 'food_bank'
  | 'soup_kitchen'
  | 'community_fridge'
  | 'youth_center';

export interface Recipient {
  id: string;
  name: string;
  type: RecipientType;
  address: string;
  distanceKm: number; // calculated distance
  capacityMeals: number; // maximum meals it can accept at once
  currentAllocatedMeals: number; // meals in active pending/approved missions
  collectionWindow: {
    start: string; // e.g. "08:00"
    end: string;   // e.g. "20:00"
  };
  acceptedCategories: FoodCategory[];
  storageCapabilities: StorageRequirement[];
  dietaryCapabilities: DietaryType[];
  isVerified: boolean;
  isAvailable: boolean;
  contactName: string;
  phone: string;
  completedMissionsCount: number;
  rejectedMissionsCount: number;
  recordedReliabilityScore: number | null; // null if no past missions, else 0-1
}

export interface HistoricalSalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6
  category: FoodCategory;
  mealsPrepared: number;
  mealsSold: number;
  mealsSurplus: number;
}

export type MissionStatus =
  | 'proposed'
  | 'approved'
  | 'pickup_confirmed'
  | 'delivery_confirmed'
  | 'rejected'
  | 'needs_reassignment'
  | 'expired'
  | 'cancelled';

export interface MissionHistoryEvent {
  id: string;
  timestamp: string;
  fromStatus: MissionStatus | 'none';
  toStatus: MissionStatus;
  note: string;
  actor: 'agent' | 'user' | 'recipient' | 'system';
}

export interface RescueMission {
  id: string;
  listingId: string;
  recipientId: string;
  mealQuantity: number;
  pickupDeadline: string;
  status: MissionStatus;
  matchScore: number;
  rejectionReason?: string;
  recoveryAttemptCount: number;
  history: MissionHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchFactorScore {
  collectionFeasibility: number; // 0-1
  capacityFit: number;          // 0-1
  routeSuitability: number;     // 0-1
  timeUrgency: number;          // 0-1
  foodCompatibility: number;    // 0-1
  recipientReliability: number; // 0-1 (defaults to neutral baseline if no history)
}

export interface MatchResult {
  recipientId: string;
  recipientName: string;
  isEligible: boolean;
  rejectionReasons: string[];
  factors: MatchFactorScore;
  totalScore: number; // 0-100
  reasoning: string;
}

export interface FallbackOption {
  recipientId: string;
  recipientName: string;
  score: number;
  reasons: string;
}

export interface ProposedPlan {
  id: string;
  listingId: string;
  listingTitle: string;
  recipientId: string;
  recipientName: string;
  mealQuantity: number;
  deadline: string;
  matchScore: number;
  factors: MatchFactorScore;
  explanation: string;
  explanationSource: 'gemini' | 'deterministic';
  fallbackRecipients: FallbackOption[];
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

export type AgentEventType =
  | 'RUN_STARTED'
  | 'LISTINGS_ANALYZED'
  | 'SURPLUS_ESTIMATED'
  | 'RECIPIENTS_FILTERED'
  | 'MATCHES_RANKED'
  | 'PLAN_PROPOSED'
  | 'PLAN_APPROVED'
  | 'RECIPIENT_REJECTED'
  | 'RECOVERY_STARTED'
  | 'ALTERNATIVE_PROPOSED'
  | 'PICKUP_CONFIRMED'
  | 'DELIVERY_CONFIRMED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED';

export interface AgentTraceEvent {
  id: string;
  timestamp: string;
  type: AgentEventType;
  details: Record<string, unknown>;
  message: string;
}

export interface AgentRun {
  id: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  listingsAnalyzed: number;
  surplusEstimated: number;
  plansProposed: number;
  events: AgentTraceEvent[];
  summary: string;
}

export interface ApplicationWeights {
  feasibility: number;
  capacity: number;
  route: number;
  urgency: number;
  compatibility: number;
  reliability: number;
}

export interface ApplicationSettings {
  geminiApiKey?: string;
  geminiModel: string;
  weights: ApplicationWeights;
  minCollectionLeadMinutes: number;
}

export interface AppState {
  listings: FoodListing[];
  recipients: Recipient[];
  salesHistory: HistoricalSalesRecord[];
  missions: RescueMission[];
  proposedPlans: ProposedPlan[];
  agentRuns: AgentRun[];
  traceEvents: AgentTraceEvent[];
  settings: ApplicationSettings;
}
