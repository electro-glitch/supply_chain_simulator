import { create } from "zustand";
import { Country } from "../types/Country";
import { getFlag } from "../lib/getFlag";

const API_URL = "http://127.0.0.1:8000";

const flagCache = new Map<string, string>();

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");

const normalizeCommodityList = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => toTitleCase(item.replace(/_/g, " ")));
  }
  if (typeof raw === "string") {
    return [toTitleCase(raw.replace(/_/g, " "))];
  }
  if (typeof raw === "object") {
    return Object.keys(raw as Record<string, unknown>).map((key) =>
      toTitleCase(key.replace(/_/g, " "))
    );
  }
  return [];
};

const ensureFlagUrl = async (name: string): Promise<string> => {
  if (flagCache.has(name)) {
    return flagCache.get(name)!;
  }
  const fetched = await getFlag(name);
  const fallback =
    fetched ?? `https://countryflagsapi.com/png/${encodeURIComponent(name)}`;
  flagCache.set(name, fallback);
  return fallback;
};

const toBackendCommodityMap = (list: string[]) => {
  return list.reduce<Record<string, number>>((acc, item) => {
    const normalized = item.trim().toLowerCase();
    if (!normalized) return acc;
    acc[normalized] = acc[normalized] ?? 100;
    return acc;
  }, {});
};

const serializeCountry = (country: Country) => {
  const normalizedInflation =
    country.inflation > 1
      ? Number((country.inflation / 100).toFixed(4))
      : Number(country.inflation || 0);

  const name = country.name.trim();

  return {
    name,
    demand: toBackendCommodityMap(country.demand),
    production: toBackendCommodityMap(country.production),
    inflation: normalizedInflation,
    inflation_pass_through: normalizedInflation,
  };
};

export const useCountriesStore = create<{
  countries: Country[];
  loading: boolean;
  error: string | null;

  fetchCountries: () => Promise<void>;
  addCountry: (country: Country) => Promise<void>;
  deleteCountry: (name: string) => Promise<void>;
  updateCountry: (oldName: string, country: Country) => Promise<void>;
}>((set, get) => ({
  countries: [],
  loading: false,
  error: null,

  fetchCountries: async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();

      const formatted = await Promise.all(
        Object.entries(data).map(async ([name, raw]: [string, any]) => {
          const demand = normalizeCommodityList(raw.demand);
          const production = normalizeCommodityList(raw.production);
          const inflationSource =
            typeof raw.inflation === "number"
              ? raw.inflation
              : typeof raw.inflation_pass_through === "number"
              ? raw.inflation_pass_through
              : 0;
          const inflation =
            inflationSource <= 1
              ? Number((inflationSource * 100).toFixed(1))
              : Number(inflationSource.toFixed(1));

          const flagUrl = await ensureFlagUrl(name);

          return {
            name,
            flagUrl,
            demand,
            production,
            inflation,
            gdp_billions: raw.gdp_billions,
            population_millions: raw.population_millions,
            hdi: raw.hdi,
            infrastructure_score: raw.infrastructure_score,
            trade_balance_billions: raw.trade_balance_billions,
            currency: raw.currency,
            logistics_index: raw.logistics_index,
          } satisfies Country;
        })
      );

      set({ countries: formatted, loading: false });
    } catch (e) {
      set({ error: "Failed to load countries", loading: false });
    }
  },

  addCountry: async (country) => {
    const payload = serializeCountry(country);
    await fetch(`${API_URL}/countries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await get().fetchCountries();
  },

  deleteCountry: async (name) => {
    await fetch(`${API_URL}/countries/${name}`, { method: "DELETE" });
    await get().fetchCountries();
  },

  updateCountry: async (oldName, country) => {
    // Delete the old one and add the new one
    if (oldName !== country.name) {
      await fetch(`${API_URL}/countries/${oldName}`, { method: "DELETE" });
    }
    const payload = serializeCountry(country);
    await fetch(`${API_URL}/countries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await get().fetchCountries();
  },
}));
