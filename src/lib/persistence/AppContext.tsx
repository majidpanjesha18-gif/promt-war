"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AppState,
  FoodListing,
  ProposedPlan,
  Recipient,
} from "@/types";
import {
  approveRescuePlan,
  confirmMissionDelivery,
  confirmMissionPickup,
  recoverFromRecipientRejection,
  rejectRescuePlan,
  runRescueAgent,
} from "../agent/engine";
import { loadAppState, resetToDemoState, saveAppState } from "./storage";

interface AppContextValue {
  state: AppState;
  isInitialized: boolean;
  // Listings actions
  addListing: (listing: Omit<FoodListing, "id" | "createdAt" | "updatedAt">) => void;
  updateListing: (id: string, updates: Partial<FoodListing>) => void;
  deleteListing: (id: string) => void;
  // Recipients actions
  addRecipient: (recipient: Omit<Recipient, "id">) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  toggleRecipientVerification: (id: string) => void;
  toggleRecipientAvailability: (id: string) => void;
  // Agent & Missions actions
  triggerAgentRun: () => void;
  approvePlan: (planId: string) => void;
  rejectPlan: (planId: string, reason?: string) => void;
  simulateRecipientRejection: (missionId: string, reason?: string) => string;
  confirmPickup: (missionId: string) => { success: boolean; error?: string };
  confirmDelivery: (missionId: string) => { success: boolean; error?: string };
  explainPlanWithAI: (planId: string) => Promise<{ success: boolean; source: 'gemini' | 'deterministic' }>;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Hydrate safely on client
    const loaded = loadAppState();
    setState(loaded);
    setIsInitialized(true);
  }, []);

  const updateAndPersist = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveAppState(next);
      return next;
    });
  };

  const addListing = (data: Omit<FoodListing, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newListing: FoodListing = {
      ...data,
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    updateAndPersist((s) => ({
      ...s,
      listings: [newListing, ...s.listings],
    }));
  };

  const updateListing = (id: string, updates: Partial<FoodListing>) => {
    updateAndPersist((s) => ({
      ...s,
      listings: s.listings.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      ),
    }));
  };

  const deleteListing = (id: string) => {
    updateAndPersist((s) => ({
      ...s,
      listings: s.listings.filter((l) => l.id !== id),
      // Clean up orphaned pending plans
      proposedPlans: s.proposedPlans.filter((p) => p.listingId !== id),
    }));
  };

  const addRecipient = (data: Omit<Recipient, "id">) => {
    const newRecipient: Recipient = {
      ...data,
      id: `recip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    updateAndPersist((s) => ({
      ...s,
      recipients: [...s.recipients, newRecipient],
    }));
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    updateAndPersist((s) => ({
      ...s,
      recipients: s.recipients.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const toggleRecipientVerification = (id: string) => {
    updateAndPersist((s) => ({
      ...s,
      recipients: s.recipients.map((r) =>
        r.id === id ? { ...r, isVerified: !r.isVerified } : r
      ),
    }));
  };

  const toggleRecipientAvailability = (id: string) => {
    updateAndPersist((s) => ({
      ...s,
      recipients: s.recipients.map((r) =>
        r.id === id ? { ...r, isAvailable: !r.isAvailable } : r
      ),
    }));
  };

  const triggerAgentRun = () => {
    updateAndPersist((s) => {
      const result = runRescueAgent(s);
      return result.updatedState;
    });
  };

  const approvePlan = (planId: string) => {
    updateAndPersist((s) => approveRescuePlan(s, planId));
  };

  const rejectPlan = (planId: string, reason?: string) => {
    updateAndPersist((s) => rejectRescuePlan(s, planId, reason));
  };

  const simulateRecipientRejection = (missionId: string, reason?: string) => {
    let msg = "";
    updateAndPersist((s) => {
      const result = recoverFromRecipientRejection(s, missionId, reason);
      msg = result.recoveryMessage;
      return result.updatedState;
    });
    return msg;
  };

  const confirmPickup = (missionId: string) => {
    let outcome = { success: false, error: "" };
    updateAndPersist((s) => {
      const result = confirmMissionPickup(s, missionId);
      outcome = { success: result.success, error: result.error || "" };
      return result.updatedState;
    });
    return outcome;
  };

  const confirmDelivery = (missionId: string) => {
    let outcome = { success: false, error: "" };
    updateAndPersist((s) => {
      const result = confirmMissionDelivery(s, missionId);
      outcome = { success: result.success, error: result.error || "" };
      return result.updatedState;
    });
    return outcome;
  };

  const explainPlanWithAI = async (planId: string): Promise<{ success: boolean; source: 'gemini' | 'deterministic' }> => {
    const plan = state.proposedPlans.find((p) => p.id === planId);
    if (!plan) return { success: false, source: "deterministic" };

    const listing = state.listings.find((l) => l.id === plan.listingId);
    const recipient = state.recipients.find((r) => r.id === plan.recipientId);
    if (!listing || !recipient) return { success: false, source: "deterministic" };

    try {
      const res = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: {
            id: listing.id,
            title: listing.title,
            category: listing.category,
            quantity: listing.quantity,
            storageRequirement: listing.storageRequirement,
            safeCollectionDeadline: listing.safeCollectionDeadline,
          },
          matchedRecipient: {
            id: recipient.id,
            name: recipient.name,
            type: recipient.type,
            distanceKm: recipient.distanceKm,
            capacityMeals: recipient.capacityMeals,
            collectionWindow: recipient.collectionWindow,
          },
          matchScore: plan.matchScore,
          factors: plan.factors,
          fallbacks: plan.fallbackRecipients.map((f) => ({
            recipientName: f.recipientName,
            score: f.score,
            reason: f.reasons,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const updatedExplanation = `${data.summary} Trade-offs: ${data.tradeOffAnalysis}`;
      const source = data.source === "gemini" ? "gemini" : "deterministic";

      updateAndPersist((s) => ({
        ...s,
        proposedPlans: s.proposedPlans.map((p) =>
          p.id === planId
            ? {
                ...p,
                explanation: updatedExplanation,
                explanationSource: source,
              }
            : p
        ),
      }));

      return { success: true, source };
    } catch (err) {
      console.warn("AI explanation request failed, keeping deterministic reasoning:", err);
      return { success: false, source: "deterministic" };
    }
  };

  const resetDemoData = () => {
    const fresh = resetToDemoState();
    setState(fresh);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        isInitialized,
        addListing,
        updateListing,
        deleteListing,
        addRecipient,
        updateRecipient,
        toggleRecipientVerification,
        toggleRecipientAvailability,
        triggerAgentRun,
        approvePlan,
        rejectPlan,
        simulateRecipientRejection,
        confirmPickup,
        confirmDelivery,
        explainPlanWithAI,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
