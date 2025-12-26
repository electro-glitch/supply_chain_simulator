from managers.network_manager import build_network
from managers.alliance_manager import get_alliances
from managers.treaty_manager import get_treaties
from managers.factors_manager import get_factors
from managers.data_manager import load_json
from simulation.routing_engine import cheapest_route
from simulation.game_theory_engine import evaluate_strategic_outlook, compute_factor_impacts
from simulation.hybrid_routing_engine import find_hybrid_optimal_route, compute_route_entity_metrics
from utils.mode_profiles import VALID_ROUTE_MODES, apply_mode_profile


DEFAULT_PARAMETERS = {
    "rounds": 6,
    "discount": 0.92,
    "shock": 0.12,
    "aggression": 0.35,
}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _evaluate_transport_modes(cost: float, time: float, risk: float, preference: str | None):
    evaluations = {mode: apply_mode_profile(cost, time, risk, mode) for mode in VALID_ROUTE_MODES}
    normalized_pref = (preference or "").lower()
    if normalized_pref in evaluations:
        chosen = normalized_pref
        auto = False
    else:
        chosen = min(
            evaluations.keys(),
            key=lambda mode: (evaluations[mode]["cost"], evaluations[mode]["time"]),
        )
        auto = True

    return chosen, auto, evaluations


def _find_producer_country(commodity: str, exclude_countries: list = None) -> str | None:
    """Find a country that produces the given commodity."""
    countries_db = load_json("countries.json")
    exclude_countries = exclude_countries or []
    
    # Normalize commodity name
    commodity_normalized = commodity.lower().replace(" ", "_")
    
    # Find countries that produce this commodity
    producers = []
    for country_name, country_data in countries_db.items():
        if country_name in exclude_countries:
            continue
        production = country_data.get("production", {})
        # Check if commodity exists in production
        if commodity_normalized in production or commodity in production:
            quantity = production.get(commodity_normalized, production.get(commodity, 0))
            producers.append((country_name, quantity))
    
    # Sort by production quantity (highest first)
    producers.sort(key=lambda x: x[1], reverse=True)
    
    return producers[0][0] if producers else None


def _check_source_has_commodities(source: str, cargo_manifest: list) -> dict:
    """Check which commodities the source country can provide."""
    if not cargo_manifest:
        return {"has_all": True, "missing": [], "available": []}
    
    countries_db = load_json("countries.json")
    source_data = countries_db.get(source, {})
    source_production = source_data.get("production", {})
    
    missing_commodities = []
    available_commodities = []
    
    for item in cargo_manifest:
        commodity = item.get("name", "")
        commodity_normalized = commodity.lower().replace(" ", "_")
        
        # Check if source produces this commodity
        if commodity_normalized not in source_production and commodity not in source_production:
            missing_commodities.append(commodity)
        else:
            available_commodities.append(commodity)
    
    return {
        "has_all": len(missing_commodities) == 0,
        "missing": missing_commodities,
        "available": available_commodities
    }


def simulate_scenario(source: str, destination: str, parameters=None, mode_preference: str | None = None, cargo_manifest=None, optimization: str = "cost"):
    """Run a supply-chain scenario with hybrid multi-modal routing and realistic cargo modeling.
    
    Args:
        optimization: "cost" for cheapest, "time" for fastest, "risk" for most secure
    """

    params = {**DEFAULT_PARAMETERS, **(parameters or {})}
    factors = get_factors()
    factor_impacts = compute_factor_impacts(factors)
    
    # Calculate total cargo weight from manifest
    # Weight represents cargo volume/mass impact on route capacity
    cargo_weight = 1.0
    if cargo_manifest and isinstance(cargo_manifest, list):
        commodities_db = load_json("commodities.json")
        total_value = 0.0
        for item in cargo_manifest:
            commodity_name = item.get("name", "").lower().replace(" ", "_")
            quantity = item.get("quantity", 1)
            unit_cost = commodities_db.get(commodity_name, {}).get("unit_cost", 1)
            total_value += quantity * unit_cost
        # Scale cargo weight logarithmically to keep multipliers reasonable
        # $1M cargo ≈ 3x multiplier, $100M cargo ≈ 6x multiplier
        if total_value > 0:
            import math
            cargo_weight = 1.0 + math.log10(max(1.0, total_value / 100000))
        cargo_weight = max(1.0, min(10.0, cargo_weight))  # Clamp between 1x and 10x
    
    # Check if source produces all required commodities
    commodity_check = _check_source_has_commodities(source, cargo_manifest)
    
    # Build multi-leg route if commodities need to be sourced
    route_legs = []
    supply_chain_narrative = []
    routes_db = load_json("routes.json")
    
    if not commodity_check["has_all"] and commodity_check["missing"]:
        # Need to source commodities from producer countries
        sourcing_countries = {}
        for commodity in commodity_check["missing"]:
            producer = _find_producer_country(commodity, exclude_countries=[source, destination])
            if producer:
                if producer not in sourcing_countries:
                    sourcing_countries[producer] = []
                sourcing_countries[producer].append(commodity)
        
        # Build route: Producers → Source → Destination
        for producer, commodities in sourcing_countries.items():
            # Determine transport mode for this leg
            leg_mode = routes_db.get(producer, {}).get(source, {}).get("mode", "air")
            mode_emoji = "🚢" if leg_mode == "sea" else "✈️" if leg_mode == "air" else "🚛"
            
            route_legs.append({
                "from": producer,
                "to": source,
                "purpose": "sourcing",
                "commodities": commodities,
                "mode": leg_mode,
                "narrative": f"Import {', '.join(commodities)} from {producer}"
            })
            supply_chain_narrative.append(f"🏭 Source {', '.join(commodities)} from {producer} ({mode_emoji} {leg_mode.upper()})")
        
        # Final leg: Source to Destination
        delivery_mode = routes_db.get(source, {}).get(destination, {}).get("mode", "air")
        mode_emoji = "🚢" if delivery_mode == "sea" else "✈️" if delivery_mode == "air" else "🚛"
        
        route_legs.append({
            "from": source,
            "to": destination,
            "purpose": "delivery",
            "commodities": [c.get("name") for c in (cargo_manifest or [])],
            "mode": delivery_mode,
            "narrative": f"Deliver consolidated cargo to {destination}"
        })
        supply_chain_narrative.append(f"📦 Consolidate and deliver all cargo from {source} to {destination} ({mode_emoji} {delivery_mode.upper()})")
    else:
        # Simple route: Source → Destination (source has everything)
        direct_mode = routes_db.get(source, {}).get(destination, {}).get("mode", "air")
        mode_emoji = "🚢" if direct_mode == "sea" else "✈️" if direct_mode == "air" else "🚛"
        
        route_legs.append({
            "from": source,
            "to": destination,
            "purpose": "direct",
            "commodities": [c.get("name") for c in (cargo_manifest or [])],
            "mode": direct_mode,
            "narrative": f"Direct delivery from {source} to {destination}"
        })
        supply_chain_narrative.append(f"✈️ Direct shipment from {source} to {destination} ({mode_emoji} {direct_mode.upper()})")
    
    # Build detailed factor breakdown for transparency
    factor_breakdown = []
    for name, data in factors.items():
        effect = float(data.get("effect", 0.0))
        strength = float(data.get("strength", 0.0))
        contribution = effect * strength
        factor_breakdown.append({
            "name": name,
            "effect": effect,
            "strength": strength,
            "contribution": contribution,
            "impact_type": "support" if contribution > 0 else "pressure" if contribution < 0 else "neutral"
        })
    factor_breakdown.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    # Execute all route legs and accumulate costs
    all_paths = []
    all_breakdowns = []
    total_accumulated_cost = 0.0
    total_accumulated_time = 0.0
    total_accumulated_risk_survival = 1.0
    
    for leg_idx, leg in enumerate(route_legs):
        leg_source = leg["from"]
        leg_dest = leg["to"]
        leg_commodities = leg["commodities"]
        
        G = build_network()
        
        # Try hybrid multi-modal routing for this leg
        hybrid_path, hybrid_cost, modal_sequence = find_hybrid_optimal_route(
            G, leg_source, leg_dest, factors, cargo_weight, 
            allow_modal_switches=True, max_switches=2, optimization=optimization
        )
        
        # Fallback to traditional routing if hybrid fails
        if hybrid_path is None:
            path, base_route_cost = cheapest_route(G, leg_source, leg_dest)
            modal_sequence = None
        else:
            # Hybrid path has mode-suffixed nodes like "Country_sea"
            # Extract just the country names for edge lookup
            path = [node.rsplit('_', 1)[0] for node in hybrid_path]
            base_route_cost = hybrid_cost

        if not path:
            # If any leg fails, return None
            return None

        breakdown = []
        base_totals = {"cost": 0.0, "time": 0.0}
        adjusted_totals = {"cost": 0.0, "time": 0.0}
        base_survival = 1.0
        adjusted_survival = 1.0

        routes_reference = load_json("routes.json")

        for idx in range(len(path) - 1):
            origin = path[idx]
            step_destination = path[idx + 1]
            edge = G[origin][step_destination]
            route_meta = routes_reference.get(origin, {}).get(step_destination, {})
            
            # Determine mode for this step
            if modal_sequence and idx < len(modal_sequence) - 1:
                step_mode = modal_sequence[idx]
            else:
                step_mode = route_meta.get("mode", "land")

            base_cost = edge["cost"]
            base_time = edge["time"]
            base_risk = edge["risk"]
            
            # Use realistic route entity metrics
            route_metrics = compute_route_entity_metrics(
                origin, step_destination,
                base_cost, base_time, base_risk,
                step_mode, factors, cargo_weight
            )

            adj_cost = route_metrics["adjusted_cost"]
            adj_time = route_metrics["adjusted_time"]
            adj_risk = route_metrics["adjusted_risk"]

            breakdown.append(
                {
                    "country": step_destination,
                    "step_cost": adj_cost,
                    "step_time": adj_time,
                    "step_risk": adj_risk,
                    "base_cost": base_cost,
                    "base_time": base_time,
                    "base_risk": base_risk,
                    "factor_modifiers": {
                        "cost": factor_impacts["cost_multiplier"],
                        "time": factor_impacts["time_multiplier"],
                        "risk": factor_impacts["risk_multiplier"],
                    },
                    "route_mode": route_meta.get("mode"),
                    "route_base": route_meta.get("base"),
                    "leg_index": leg_idx,
                    "leg_purpose": leg["purpose"],
                    "leg_commodities": leg_commodities,
                }
            )

            base_totals["cost"] += base_cost
            base_totals["time"] += base_time
            adjusted_totals["cost"] += adj_cost
            adjusted_totals["time"] += adj_time

            base_survival *= (1 - _clamp(base_risk, 0.0, 0.999))
            adjusted_survival *= (1 - adj_risk)
        
        # Accumulate totals from this leg
        total_accumulated_cost += adjusted_totals["cost"]
        total_accumulated_time += adjusted_totals["time"]
        total_accumulated_risk_survival *= adjusted_survival
        
        all_paths.extend(path)
        all_breakdowns.extend(breakdown)

    # Calculate final totals
    base_total_risk = 1 - base_survival  # Using last leg's base survival
    total_risk = 1 - total_accumulated_risk_survival
    total_cost = total_accumulated_cost
    total_time = total_accumulated_time

    # Build detailed factor breakdown showing accumulated impact across all legs
    factor_breakdown = []
    for name, data in factors.items():
        effect = float(data.get("effect", 0.0))
        strength = float(data.get("strength", 0.0))
        contribution = effect * strength
        
        # Calculate actual impact on costs/time/risk for this factor
        # The contribution represents how this factor influenced the total multipliers
        actual_cost_impact = contribution * (total_cost / max(1.0, total_accumulated_cost or 1.0))
        
        factor_breakdown.append({
            "name": name,
            "effect": effect,
            "strength": strength,
            "contribution": contribution,
            "actual_impact": actual_cost_impact,
            "impact_type": "support" if contribution > 0 else "pressure" if contribution < 0 else "neutral"
        })
    factor_breakdown.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    chosen_mode, auto_selected, evaluations = _evaluate_transport_modes(
        total_cost,
        total_time,
        total_risk,
        mode_preference,
    )
    transport_adjusted = evaluations[chosen_mode]
    total_cost = transport_adjusted["cost"]
    total_time = transport_adjusted["time"]
    total_risk = transport_adjusted["risk"]

    game_theory = evaluate_strategic_outlook(
        source,
        destination,
        all_paths,
        all_breakdowns,
        total_cost,
        total_time,
        total_risk,
        get_alliances(),
        get_treaties(),
        factors,
        factor_impacts,
        params,
    )

    # Build comprehensive supply chain summary
    supply_chain_summary = {
        "is_multi_leg": len(route_legs) > 1,
        "total_legs": len(route_legs),
        "route_legs": route_legs,
        "narrative": supply_chain_narrative,
        "commodity_sourcing": commodity_check,
    }

    return {
        "src": source,
        "dst": destination,
        "total_cost": total_cost,
        "total_time": total_time,
        "total_risk": total_risk,
        "path": all_paths,
        "breakdown": all_breakdowns,
        "game_theory": game_theory,
        "scenario_parameters": params,
        "strategic_summary": game_theory.get("summary"),
        "supply_chain": supply_chain_summary,
        "baseline_totals": {
            "cost": base_totals["cost"],
            "time": base_totals["time"],
            "risk": base_total_risk,
            "route_cost": base_route_cost or base_totals["cost"],
        },
        "factor_impacts": factor_impacts,
        "factor_breakdown": factor_breakdown,
        "transport": {
            "selected_mode": chosen_mode,
            "auto_selected": auto_selected,
            "modes": evaluations,
        },
    }
