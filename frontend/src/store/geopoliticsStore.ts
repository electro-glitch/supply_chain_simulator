import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GeoActionRecord {
  id: string;
  action: string;
  summary: string;
  origin: string;
  destination: string;
  value?: number;
  unit?: string;
  timestamp: number;
}

interface GeoState {
  actions: GeoActionRecord[];
  recordAction: (entry: Omit<GeoActionRecord, "id" | "timestamp"> & { id?: string; timestamp?: number }) => void;
  clearActions: () => void;
}

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const useGeopoliticsStore = create<GeoState>()(
  persist(
    (set, get) => ({
      actions: [],
      recordAction: (entry) => {
        const next: GeoActionRecord = {
          id: entry.id ?? makeId(),
          timestamp: entry.timestamp ?? Date.now(),
          action: entry.action,
          summary: entry.summary,
          origin: entry.origin,
          destination: entry.destination,
          value: entry.value,
          unit: entry.unit,
        };
        set({ actions: [next, ...get().actions].slice(0, 30) });
      },
      clearActions: () => set({ actions: [] }),
    }),
    {
      name: "supplySim:geo-actions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
