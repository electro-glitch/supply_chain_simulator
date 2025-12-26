import { create } from "zustand";
import { api } from "../lib/api";
import { RouteDetails } from "../types/Route";

interface RoutesState {
  routes: Record<string, Record<string, RouteDetails>>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;

  fetchRoutes: () => Promise<void>;
  addRoute: (origin: string, destination: string, details: RouteDetails) => Promise<void>;
  deleteRoute: (origin: string, destination: string) => Promise<void>;
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
  routes: {},
  loading: false,
  error: null,
  lastUpdated: null,

  fetchRoutes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getRoutes();
      set({ routes: data, loading: false, lastUpdated: Date.now() });
    } catch (e) {
      set({ error: "Failed to load routes", loading: false });
    }
  },

  addRoute: async (origin: string, destination: string, details: RouteDetails) => {
    try {
      await api.addRoute(origin, destination, details);
      await get().fetchRoutes();
    } catch (e) {
      set({ error: "Failed to add route" });
    }
  },

  deleteRoute: async (origin: string, destination: string) => {
    try {
      await api.deleteRoute(origin, destination);
      await get().fetchRoutes();
    } catch (e) {
      set({ error: "Failed to delete route" });
    }
  },
}));
