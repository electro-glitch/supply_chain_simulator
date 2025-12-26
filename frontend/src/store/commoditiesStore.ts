import { create } from "zustand";
import { api } from "../lib/api";

interface CommoditiesState {
  commodities: Record<string, { unit_cost: number }>;
  loading: boolean;
  error: string | null;

  fetchCommodities: () => Promise<void>;
  addCommodity: (name: string, unit_cost: number) => Promise<void>;
}

export const useCommoditiesStore = create<CommoditiesState>((set, get) => ({
  commodities: {},
  loading: false,
  error: null,

  fetchCommodities: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getCommodities();
      set({ commodities: data, loading: false });
    } catch (e) {
      set({ error: "Failed to load commodities", loading: false });
    }
  },

  addCommodity: async (name: string, unit_cost: number) => {
    try {
      await api.addCommodity(name, unit_cost);
      await get().fetchCommodities();
    } catch (e) {
      set({ error: "Failed to add commodity" });
    }
  },
}));
