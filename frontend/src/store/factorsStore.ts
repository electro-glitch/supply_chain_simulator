import { create } from "zustand";
import { api } from "../lib/api";
import { Factor } from "../types/Factor";

interface FactorsState {
  factors: Record<string, Factor>;
  loading: boolean;
  error: string | null;

  fetchFactors: () => Promise<void>;
  updateFactor: (name: string, data: Factor) => Promise<void>;
}

export const useFactorsStore = create<FactorsState>((set, get) => ({
  factors: {},
  loading: false,
  error: null,

  fetchFactors: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getFactors();
      set({ factors: data, loading: false });
    } catch (e) {
      set({ error: "Failed to load factors", loading: false });
    }
  },

  updateFactor: async (name: string, data: Factor) => {
    set({ error: null });
    try {
      await api.updateFactor(name, data);
      await get().fetchFactors();
    } catch (e) {
      set({ error: "Failed to update factor" });
      throw e;
    }
  },
}));
