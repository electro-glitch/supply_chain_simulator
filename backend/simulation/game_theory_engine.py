import math
from typing import Any, Dict, List, Optional, Tuple


def _sigmoid(x: float) -> float:
    """Safe sigmoid function that handles extreme values."""
    # Clamp x to prevent overflow in exp()
    x = max(-500, min(500, x))
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    else:
        # For negative x, use equivalent form to avoid overflow
        exp_x = math.exp(x)
        return exp_x / (1.0 + exp_x)


def _clamp(val: float, low: float, high: float) -> float:
    return max(low, min(high, val))


def _factor_components(factors: Optional[Dict[str, Dict[str, float]]]) -> Tuple[float, float, float]:
    if not factors:
        return 0.0, 0.0, 1.0

    positive = 0.0
    negative = 0.0
    strength_sum = 0.0

    for data in factors.values():
        effect = float(data.get("effect", 0.0))
        strength = abs(float(data.get("strength", 0.0))) or 0.5
        contribution = effect * strength
        strength_sum += strength
        if contribution >= 0:
            positive += contribution
        else:
            negative += abs(contribution)

    return positive, negative, strength_sum or 1.0


def compute_factor_impacts(factors: Optional[Dict[str, Dict[str, float]]]) -> Dict[str, float]:
    positive, negative, strength_sum = _factor_components(factors)

    net_bias = (positive - negative) / max(1.0, strength_sum)
    support_index = positive / max(1.0, strength_sum)
    pressure_index = negative / max(1.0, strength_sum)
    volatility_index = (positive + negative) / max(1.0, strength_sum)

    global_pressure = _clamp(_sigmoid((pressure_index - support_index) * 4.5), 0.01, 0.99)
    
    # Calculate risk multiplier first
    risk_multiplier = _clamp(
        1 + (pressure_index * 0.6) - (support_index * 0.4) + volatility_index * 0.15,
        0.45,
        1.75,
    )
    
    # Cost multiplier now includes risk impact (security spending, insurance, hedging)
    # When risk goes up, costs increase due to security measures, insurance premiums, etc.
    risk_cost_impact = max(0, (risk_multiplier - 1.0) * 0.28)
    cost_multiplier = _clamp(
        1 + (pressure_index - support_index) * 0.35 + volatility_index * 0.12 + risk_cost_impact,
        0.65,
        1.85,
    )
    
    time_multiplier = _clamp(
        1 + (pressure_index - support_index) * 0.22 + volatility_index * 0.08,
        0.7,
        1.45,
    )

    return {
        "net_bias": net_bias,
        "support_index": support_index,
        "pressure_index": pressure_index,
        "volatility_index": volatility_index,
        "global_pressure": global_pressure,
        "cost_multiplier": cost_multiplier,
        "time_multiplier": time_multiplier,
        "risk_multiplier": risk_multiplier,
    }


def evaluate_strategic_outlook(
    source: str,
    destination: str,
    path: List[str],
    breakdown: List[Dict[str, float]],
    total_cost: float,
    total_time: float,
    total_risk: float,
    alliances: Dict[str, Any],
    treaties: Dict[str, Any],
    factors: Dict[str, Any],
    factor_impacts: Dict[str, float],
    params: Dict[str, float],
) -> Dict[str, Any]:
    # Country-pair hash for unique variation based on specific countries
    country_hash = abs(hash(source + destination)) % 100 / 100.0  # 0.0 to 1.0
    
    alliance_records = []
    src_support = 0.0
    dst_support = 0.0
    shared_deterrence = 0.0

    for name, data in alliances.items():
        involvement: List[str] = []
        cohesion = data.get("cohesion", 0.0)
        support_mult = data.get("support_multiplier", 0.0)
        if source in data.get("members", []):
            involvement.append("source")
            # Support varies based on risk - lower risk routes get more support
            risk_adjusted_support = cohesion * support_mult * (1.5 - total_risk * 0.8)
            src_support += risk_adjusted_support
        if destination in data.get("members", []):
            involvement.append("destination")
            risk_adjusted_support = cohesion * support_mult * (1.5 - total_risk * 0.8)
            dst_support += risk_adjusted_support
        leverage = cohesion * data.get("deterrence", 0.0)
        if len(involvement) == 2:
            shared_deterrence += leverage
        if involvement:
            alliance_records.append(
                {
                    "name": name,
                    "members": data.get("members", []),
                    "cohesion": data.get("cohesion", 0.0),
                    "support_multiplier": data.get("support_multiplier", 0.0),
                    "deterrence": data.get("deterrence", 0.0),
                    "involvement": involvement,
                    "leverage": leverage,
                }
            )

    treaty_records = []
    breach_components = []
    for name, data in treaties.items():
        parties = data.get("parties", [])
        if source in parties and destination in parties:
            history = data.get("breach_history", {})
            breaches = history.get("breaches", 0)
            years_active = history.get("years_active", 1)
            historic_pressure = breaches / max(1, years_active)
            # High cost/time routes strain treaties more
            economic_strain = (total_cost / 40.0 + total_time / 20.0) * 0.12
            base = (1 - data.get("stability", 0.5)) * 0.6 + (1 - data.get("enforcement", 0.5)) * 0.4
            base += historic_pressure + economic_strain
            breach_probability = _clamp(_sigmoid((base - 0.5) * 4), 0.01, 0.99)
            breach_components.append(breach_probability)
            treaty_records.append(
                {
                    "name": name,
                    "parties": parties,
                    "stability": data.get("stability", 0.5),
                    "enforcement": data.get("enforcement", 0.5),
                    "breach_probability": breach_probability,
                }
            )

    # If no treaties, use route characteristics to determine baseline tension
    if breach_components:
        treaty_break_base = sum(breach_components) / len(breach_components)
    else:
        # Use risk, cost, and country hash to create unique baseline for each pair
        route_tension = (total_risk * 0.45) + (total_cost / 80.0 * 0.25) + (country_hash * 0.35)
        treaty_break_base = _clamp(0.10 + route_tension, 0.05, 0.55)

    global_factor_pressure = factor_impacts.get("global_pressure", 0.5)
    exogenous_shock = params.get("shock", 0.1)
    aggression = params.get("aggression", 0.35)

    # Path complexity affects trade gains (more hops = more complexity)
    path_complexity = len(path) - 1  # Number of hops
    complexity_penalty = path_complexity * 15.0  # Each hop reduces gains significantly
    
    # Country variation already calculated at top of function
    country_variation = (country_hash - 0.5) * 45.0  # -22.5 to +22.5
    
    # Base utilities inspired by trade gains minus risk/pressure costs
    base_trade_gain = max(15.0, 185.0 - (total_cost * 5.5 + total_time * 3.2) - complexity_penalty + country_variation)
    risk_penalty = total_risk * 135.0
    pressure_penalty = (global_factor_pressure + exogenous_shock) * 35.0

    support_scale = 95.0
    reward_src = base_trade_gain + src_support * support_scale - risk_penalty - pressure_penalty
    reward_dst = base_trade_gain + dst_support * support_scale - risk_penalty - pressure_penalty

    temptation_src = reward_src + 15.0 + aggression * 20.0
    temptation_dst = reward_dst + 15.0 + aggression * 20.0
    punishment_src = reward_src - 12.0 - global_factor_pressure * 10.0
    punishment_dst = reward_dst - 12.0 - global_factor_pressure * 10.0
    sucker_src = reward_src - 28.0
    sucker_dst = reward_dst - 28.0

    payoff_matrix = {
        "cooperate_cooperate": {"src": reward_src, "dst": reward_dst},
        "cooperate_defect": {"src": sucker_src, "dst": temptation_dst},
        "defect_cooperate": {"src": temptation_src, "dst": sucker_dst},
        "defect_defect": {"src": punishment_src, "dst": punishment_dst},
    }

    # Repeated game cooperation threshold
    discount = params.get("discount", 0.92)
    critical_delta_src = (temptation_src - reward_src) / max(0.0001, (temptation_src - punishment_src))
    critical_delta_dst = (temptation_dst - reward_dst) / max(0.0001, (temptation_dst - punishment_dst))
    safety_margin = discount - max(critical_delta_src, critical_delta_dst)

    # Cost and risk affect trust - expensive/risky routes reduce cooperation
    route_trust_factor = 1.0 - (total_cost / 120.0) * 0.45 - total_risk * 0.35
    trust_bonus = (1 - treaty_break_base) * 0.5 + shared_deterrence * 0.4 + route_trust_factor * 0.35
    cooperation_probability = _clamp(
        _sigmoid(3.2 * safety_margin + 2.1 * trust_bonus - 2.2 * global_factor_pressure),
        0.02,
        0.98,
    )

    treaty_break_probability = _clamp(
        (1 - cooperation_probability) * 0.55
        + treaty_break_base * 0.3
        + exogenous_shock * 0.25,
        0.01,
        0.995,
    )

    stability_index = _clamp(
        cooperation_probability * (1 - treaty_break_probability) * (0.65 + shared_deterrence * 0.5),
        0.0,
        1.0,
    )
    escalation_risk = 1 - stability_index

    expected_rounds = max(2, int(round(params.get("rounds", 6) * (0.6 + cooperation_probability))))

    equilibrium_strategy = (
        "Sustain cooperation via grim-trigger" if safety_margin > 0 else "Prepare tit-for-tat retaliation"
    )

    recommendation = (
        "Leverage alliances and confidence-building" if stability_index >= 0.6 else "Hedge with diversified routing"
    )

    summary = (
        f"Cooperation likelihood at {cooperation_probability*100:.1f}% with treaty break risk {treaty_break_probability*100:.1f}%. "
        f"Equilibrium favors {equilibrium_strategy.lower()} while escalation risk sits at {escalation_risk*100:.1f}%."
    )

    factor_records = [
        {
            "name": name,
            "effect": data.get("effect", 0.0),
            "strength": data.get("strength", 0.0),
        }
        for name, data in (factors or {}).items()
    ]

    return {
        "alliances": alliance_records,
        "treaties": treaty_records,
        "payoff_matrix": payoff_matrix,
        "cooperation_probability": cooperation_probability,
        "treaty_break_probability": treaty_break_probability,
        "equilibrium_strategy": equilibrium_strategy,
        "stability_index": stability_index,
        "escalation_risk": escalation_risk,
        "expected_rounds": expected_rounds,
        "recommendation": recommendation,
        "summary": summary,
        "metrics": {
            "critical_delta_src": critical_delta_src,
            "critical_delta_dst": critical_delta_dst,
            "safety_margin": safety_margin,
            "global_pressure": global_factor_pressure,
        },
        "factors": {
            "records": factor_records,
            "impacts": factor_impacts,
        },
    }
