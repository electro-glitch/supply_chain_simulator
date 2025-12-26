export interface Country {
  name: string;
  flagUrl: string; // derived from name
  demand: string[];       // list of commodity names
  production: string[];
  inflation: number;      // %
  gdp_billions?: number;  // GDP in billions USD
  population_millions?: number;  // Population in millions
  hdi?: number;  // Human Development Index (0-1)
  infrastructure_score?: number;  // Infrastructure quality (0-100)
  trade_balance_billions?: number;  // Trade balance in billions
  currency?: string;  // Currency code (USD, EUR, etc.)
  logistics_index?: number;  // Logistics performance (1-5)
}
