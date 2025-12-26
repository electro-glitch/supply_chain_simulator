// src/store/global.ts
import { create } from "zustand";
import { api } from "../lib/api";
import type { Country } from "../types/Country";
import type { Commodity } from "../types/Commodity";
import type { Factor } from "../types/Factor";

interface GlobalState {
  countries: Country[];
  commodities: Record<string, Omit<Commodity, "name">>;
  factors: Record<string, Factor>;

  loadAll: () => Promise<void>;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  countries: [],
  commodities: {},
  factors: {},

  loadAll: async () => {
    try {
      const [countries, commodities, factors] = await Promise.all([
        api.getCountries(),
        api.getCommodities(),
        api.getFactors(),
      ]);

      set({ countries, commodities, factors });
    } catch (err) {
      console.error("GLOBAL STORE LOAD ERROR:", err);
    }
  },
}));
