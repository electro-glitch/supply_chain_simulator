import { RouteMode, RouteBaseline } from "./Route";

export interface SimulationParameters {
  rounds: number;
  discount: number;
  shock: number;
  aggression: number;
}

export interface PayoffEntry {
  src: number;
  dst: number;
}

export interface PayoffMatrix {
  cooperate_cooperate: PayoffEntry;
  cooperate_defect: PayoffEntry;
  defect_cooperate: PayoffEntry;
  defect_defect: PayoffEntry;
}

export interface FactorImpactSnapshot {
  net_bias: number;
  support_index: number;
  pressure_index: number;
  volatility_index: number;
  global_pressure: number;
  cost_multiplier: number;
  time_multiplier: number;
  risk_multiplier: number;
}

export interface FactorBreakdownItem {
  name: string;
  effect: number;
  strength: number;
  contribution: number;
  impact_type: "support" | "pressure" | "neutral";
}

export interface CommodityCargo {
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface FactorRecordSnapshot {
  name: string;
  effect: number;
  strength: number;
}

export interface AllianceRecord {
  name: string;
  members: string[];
  cohesion: number;
  support_multiplier: number;
  deterrence: number;
  involvement: string[];
  leverage: number;
}

export interface TreatyRecord {
  name: string;
  parties: string[];
  stability: number;
  enforcement: number;
  breach_probability: number;
}

export interface GameTheoryReport {
  alliances: AllianceRecord[];
  treaties: TreatyRecord[];
  payoff_matrix: PayoffMatrix;
  cooperation_probability: number;
  treaty_break_probability: number;
  equilibrium_strategy: string;
  stability_index: number;
  escalation_risk: number;
  expected_rounds: number;
  recommendation: string;
  summary: string;
  metrics: {
    critical_delta_src: number;
    critical_delta_dst: number;
    safety_margin: number;
    global_pressure: number;
  };
  factors: {
    records: FactorRecordSnapshot[];
    impacts: FactorImpactSnapshot;
  };
}

export interface SimulationResult {
  src: string;
  dst: string;
  total_cost: number;
  total_time: number;
  total_risk: number;
  path: string[];
  breakdown: {
    country: string;
    step_cost: number;
    step_time: number;
    step_risk: number;
    base_cost: number;
    base_time: number;
    base_risk: number;
    factor_modifiers: {
      cost: number;
      time: number;
      risk: number;
    };
    route_mode?: RouteMode;
    route_base?: RouteBaseline;
  }[];
  game_theory: GameTheoryReport;
  scenario_parameters: SimulationParameters;
  strategic_summary: string;
  baseline_totals: {
    cost: number;
    time: number;
    risk: number;
    route_cost: number;
  };
  factor_impacts: FactorImpactSnapshot;
  factor_breakdown?: FactorBreakdownItem[];
  commodities?: CommodityCargo[];
  transport?: {
    selected_mode: RouteMode;
    auto_selected: boolean;
    modes: Record<RouteMode, {
      cost: number;
      time: number;
      risk: number;
    }>;
  };
}
