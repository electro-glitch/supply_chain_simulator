import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Factor } from "../types/Factor";
import { SimulationResult } from "../types/Simulation";

interface MemoryState {
  factorDrafts: Record<string, Factor>;
  lastSimulation: SimulationResult | null;
  lastFactorUpdateAt: number | null;
  rememberFactorDraft: (name: string, data: Factor) => void;
  rememberSimulation: (result: SimulationResult) => void;
  clearLastSimulation: () => void;
  markFactorUpdate: () => void;
  clearMemory: () => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      factorDrafts: {},
      lastSimulation: null,
      lastFactorUpdateAt: null,
      rememberFactorDraft: (name, data) =>
        set({
          factorDrafts: {
            ...get().factorDrafts,
            [name]: {
              effect: Number(data.effect.toFixed(2)),
              strength: Number(data.strength.toFixed(2)),
            },
          },
        }),
      rememberSimulation: (result) => set({ lastSimulation: result }),
      clearLastSimulation: () => set({ lastSimulation: null }),
      markFactorUpdate: () => set({ lastFactorUpdateAt: Date.now() }),
      clearMemory: () => set({ factorDrafts: {}, lastSimulation: null, lastFactorUpdateAt: null }),
    }),
    {
      name: "supplySim:memory",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
