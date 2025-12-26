// src/lib/api.ts
import { Country } from "../types/Country";
import { Commodity } from "../types/Commodity";
import { Route } from "../types/Route";
import { Factor, FactorImpacts } from "../types/Factor";
import { SimulationResult, SimulationParameters } from "../types/Simulation";
import { RouteMode } from "../types/Route";
import { Alliance } from "../types/Alliance";
import { Treaty } from "../types/Treaty";
import { Graph } from "../types/Graph";

const API_URL = "http://127.0.0.1:8000";

export const api = {
  // ---------------------- Countries ----------------------
  async getCountries(): Promise<Country[]> {
    const res = await fetch(`${API_URL}/countries`);
    const data = await res.json();
    return Object.entries(data).map(([name, rest]: [string, any]) => ({
      name,
      ...rest,
    }));
  },

  async addCountry(country: Omit<Country, "flagUrl">): Promise<void> {
    await fetch(`${API_URL}/countries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(country),
    });
  },

  async deleteCountry(name: string): Promise<void> {
    await fetch(`${API_URL}/countries/${name}`, { method: "DELETE" });
  },

  // ---------------------- Commodities ----------------------
  async getCommodities(): Promise<Record<string, Omit<Commodity, "name">>> {
    const res = await fetch(`${API_URL}/commodities`);
    return await res.json();
  },

  async addCommodity(name: string, unitCost: number): Promise<void> {
    await fetch(`${API_URL}/commodities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit_cost: unitCost }),
    });
  },

  // ---------------------- Routes ----------------------
  async getRoutes(): Promise<Record<string, Record<string, Omit<Route, "origin" | "destination">>>> {
    const res = await fetch(`${API_URL}/routes`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    return await res.json();
  },

  async addRoute(origin: string, destination: string, details: Omit<Route, "origin" | "destination">): Promise<void> {
    await fetch(`${API_URL}/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        destination,
        ...details,
      }),
    });
  },

  async deleteRoute(origin: string, destination: string): Promise<void> {
    await fetch(`${API_URL}/routes/${origin}/${destination}`, { method: "DELETE" });
  },

  // ---------------------- Factors ----------------------
  async getFactors(): Promise<Record<string, Factor>> {
    const res = await fetch(`${API_URL}/factors`);
    return await res.json();
  },

  async getFactorMetrics(): Promise<{ factors: Record<string, Factor>; impacts: FactorImpacts }> {
    const res = await fetch(`${API_URL}/factors/metrics`);
    if (!res.ok) {
      throw new Error("Failed to load factor metrics");
    }
    return await res.json();
  },

  async addFactor(name: string, data: Factor): Promise<void> {
    await fetch(`${API_URL}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...data }),
    });
  },

  async updateFactor(name: string, data: Factor): Promise<void> {
    await fetch(`${API_URL}/factors/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async deleteFactor(name: string): Promise<void> {
    await fetch(`${API_URL}/factors/${encodeURIComponent(name)}`, { method: "DELETE" });
  },

  async resetFactors(mode: "defaults" | "neutral" | "crisis" | "optimal" = "defaults"): Promise<{
    factors: Record<string, Factor>;
    impacts: FactorImpacts;
  }> {
    const res = await fetch(`${API_URL}/factors/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to reset factors");
    }
    const payload = await res.json();
    return { factors: payload.factors, impacts: payload.impacts };
  },

  // ---------------------- Geopolitics ----------------------
  async declareWar(a: string, b: string): Promise<void> {
    await fetch(`${API_URL}/geo/war`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b }),
    });
  },

  async applyTariff(a: string, b: string, percent: number): Promise<void> {
    const res = await fetch(`${API_URL}/geo/tariff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to apply tariff");
    }
  },

  async modifyRisk(a: string, b: string, delta: number): Promise<void> {
    const res = await fetch(`${API_URL}/geo/risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, delta }),
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to modify risk");
    }
  },

  async imposeSanction(a: string, b: string, percent: number): Promise<void> {
    await fetch(`${API_URL}/geo/sanction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
  },

  async grantSubsidy(a: string, b: string, percent: number): Promise<void> {
    const res = await fetch(`${API_URL}/geo/subsidy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Failed to grant subsidy");
    }
  },

  async fastTrackCustoms(a: string, b: string, hours: number): Promise<void> {
    await fetch(`${API_URL}/geo/customs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, hours }),
    });
  },

  async disruptInfrastructure(a: string, b: string, hours: number): Promise<void> {
    await fetch(`${API_URL}/geo/infrastructure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, hours }),
    });
  },

  async bolsterSecurity(a: string, b: string, delta: number): Promise<void> {
    await fetch(`${API_URL}/geo/security`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, delta }),
    });
  },

  async launchCyberAttack(a: string, b: string, delta: number): Promise<void> {
    await fetch(`${API_URL}/geo/cyber`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, delta }),
    });
  },

  async openHumanitarianCorridor(a: string, b: string, percent: number): Promise<void> {
    await fetch(`${API_URL}/geo/corridor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
  },

  async brokerPeace(a: string, b: string, percent: number): Promise<void> {
    await fetch(`${API_URL}/geo/peace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
  },

  async annexTerritory(a: string, b: string, percent: number): Promise<void> {
    await fetch(`${API_URL}/geo/annex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, percent }),
    });
  },

  async triggerDisaster(a: string, b: string, severity: number): Promise<void> {
    await fetch(`${API_URL}/geo/disaster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, severity }),
    });
  },

  async setTradeRouteMode(a: string, b: string, mode: "land" | "sea" | "air"): Promise<void> {
    await fetch(`${API_URL}/geo/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, mode }),
    });
  },

  async triggerStorm(a: string, b: string, severity: number): Promise<void> {
    await fetch(`${API_URL}/geo/storm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, severity }),
    });
  },

  async reportPirates(a: string, b: string, severity: number): Promise<void> {
    await fetch(`${API_URL}/geo/pirates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b, severity }),
    });
  },

  // ---------------------- Simulation ----------------------
  async getAlliances(): Promise<Alliance[]> {
    const res = await fetch(`${API_URL}/alliances`);
    const data = await res.json();
    return Object.entries(data).map(([name, rest]: [string, any]) => ({
      name,
      ...(rest as Omit<Alliance, "name">),
    }));
  },

  async getTreaties(): Promise<Treaty[]> {
    const res = await fetch(`${API_URL}/treaties`);
    const data = await res.json();
    return Object.entries(data).map(([name, rest]: [string, any]) => ({
      name,
      ...(rest as Omit<Treaty, "name">),
    }));
  },

  async simulate(payload: {
    src: string;
    dst: string;
    mode?: RouteMode | "auto";
    parameters?: Partial<SimulationParameters>;
    cargo_manifest?: { name: string; quantity: number }[];
  }): Promise<{cheapest?: SimulationResult; fastest?: SimulationResult; most_secure?: SimulationResult}> {
    const res = await fetch(`${API_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Simulation failed");
    }
    return await res.json();
  },

  // ---------------------- Graph ----------------------
  async getGraph(): Promise<Graph> {
    const res = await fetch(`${API_URL}/graph`);
    return await res.json();
  },

  // ---------------------- System ----------------------
  async reset(): Promise<void> {
    await fetch(`${API_URL}/reset`, { method: "POST" });
  },
};
