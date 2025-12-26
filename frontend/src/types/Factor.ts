export interface Factor {
  effect: number;
  strength: number;
}

export interface FactorImpacts {
  net_bias: number;
  support_index: number;
  pressure_index: number;
  volatility_index: number;
  global_pressure: number;
  cost_multiplier: number;
  time_multiplier: number;
  risk_multiplier: number;
}
