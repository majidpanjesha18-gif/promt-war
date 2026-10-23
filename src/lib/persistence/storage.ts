import { AppState } from "@/types";
import { getInitialDemoState } from "./demo-data";

const STORAGE_KEY = "rescueloop_app_state_v1";

/**
 * Loads the current application state from localStorage safely.
 * If no stored state exists or stored JSON is invalid, initializes with demo state.
 */
export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return getInitialDemoState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDemoState();
      saveAppState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Validate minimal structure
    if (
      !Array.isArray(parsed.listings) ||
      !Array.isArray(parsed.recipients) ||
      !Array.isArray(parsed.missions)
    ) {
      console.warn("Corrupt stored state found. Re-initializing demo state.");
      const fallback = getInitialDemoState();
      saveAppState(fallback);
      return fallback;
    }

    return {
      listings: parsed.listings || [],
      recipients: parsed.recipients || [],
      salesHistory: parsed.salesHistory || [],
      missions: parsed.missions || [],
      proposedPlans: parsed.proposedPlans || [],
      agentRuns: parsed.agentRuns || [],
      traceEvents: parsed.traceEvents || [],
      settings: parsed.settings || getInitialDemoState().settings,
    };
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    const fallback = getInitialDemoState();
    saveAppState(fallback);
    return fallback;
  }
}

/**
 * Saves state to localStorage safely.
 */
export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to persist app state:", err);
  }
}

/**
 * Explicit reset demo data action with fresh seed data.
 */
export function resetToDemoState(): AppState {
  const fresh = getInitialDemoState();
  saveAppState(fresh);
  return fresh;
}
