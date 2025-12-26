"""
Advanced hybrid multi-modal routing engine with realistic transport modeling.

This engine supports:
- Multi-modal transport (land -> sea -> air combinations)
- Route-specific factor impacts
- Commodity weight/volume affecting costs
- Realistic transfer costs and times at modal switches
"""

import networkx as nx
from typing import Dict, List, Tuple, Optional
from managers.factors_manager import get_factors
from simulation.game_theory_engine import compute_factor_impacts


MODAL_TRANSFER_COSTS = {
    ("land", "sea"): {"cost": 50, "time": 4, "risk": 0.02},  # Port handling
    ("sea", "land"): {"cost": 50, "time": 4, "risk": 0.02},
    ("land", "air"): {"cost": 100, "time": 2, "risk": 0.01},  # Airport handling
    ("air", "land"): {"cost": 100, "time": 2, "risk": 0.01},
    ("sea", "air"): {"cost": 150, "time": 6, "risk": 0.03},  # Complex transfer
    ("air", "sea"): {"cost": 150, "time": 6, "risk": 0.03},
}

MODAL_CAPACITY_MULTIPLIERS = {
    "land": 1.0,
    "sea": 0.5,   # Slower but cheaper for bulk
    "air": 2.5,   # Fast but expensive
}


def compute_route_entity_metrics(
    origin: str,
    destination: str,
    base_cost: float,
    base_time: float,
    base_risk: float,
    mode: str,
    factors: Dict,
    cargo_weight: float = 1.0
) -> Dict:
    """
    Compute realistic metrics for a route entity based on factors and cargo.
    
    Args:
        origin: Source country
        destination: Destination country
        base_cost: Base monetary cost
        base_time: Base time in hours
        base_risk: Base risk probability
        mode: Transport mode (land/sea/air)
        factors: Current factor state
        cargo_weight: Total cargo weight affecting capacity costs
        
    Returns:
        Dictionary with adjusted metrics and breakdown
    """
    factor_impacts = compute_factor_impacts(factors)
    
    # Mode-specific capacity adjustments
    # cargo_weight is now 1-10 scale representing cargo burden
    capacity_mult = MODAL_CAPACITY_MULTIPLIERS.get(mode, 1.0)
    # Each unit of cargo_weight adds 20-50% cost depending on mode
    cargo_cost_mult = cargo_weight * capacity_mult
    
    # Apply factor multipliers
    adjusted_cost = base_cost * factor_impacts["cost_multiplier"] * cargo_cost_mult
    adjusted_time = base_time * factor_impacts["time_multiplier"]
    adjusted_risk = min(0.99, base_risk * factor_impacts["risk_multiplier"])
    
    # Mode-specific factor sensitivity
    if mode == "sea":
        # Sea routes more affected by maritime security and climate
        maritime_pressure = 0.0
        climate_pressure = 0.0
        for name, data in factors.items():
            if "Maritime" in name or "Climate" in name:
                effect = float(data.get("effect", 0.0))
                strength = float(data.get("strength", 0.0))
                if effect < 0:
                    maritime_pressure += abs(effect) * strength
        
        adjusted_risk = min(0.99, adjusted_risk + maritime_pressure * 0.15)
        adjusted_time = adjusted_time * (1.0 + climate_pressure * 0.1)
    
    elif mode == "land":
        # Land routes affected by border tensions
        border_pressure = 0.0
        for name, data in factors.items():
            if "Border" in name or "Diplomatic" in name:
                effect = float(data.get("effect", 0.0))
                strength = float(data.get("strength", 0.0))
                if effect < 0:
                    border_pressure += abs(effect) * strength
        
        adjusted_cost = adjusted_cost * (1.0 + border_pressure * 0.25)
        adjusted_risk = min(0.99, adjusted_risk + border_pressure * 0.12)
    
    elif mode == "air":
        # Air routes affected by cyber and energy
        cyber_pressure = 0.0
        energy_pressure = 0.0
        for name, data in factors.items():
            if "Cyber" in name or "Energy" in name:
                effect = float(data.get("effect", 0.0))
                strength = float(data.get("strength", 0.0))
                if effect < 0:
                    if "Cyber" in name:
                        cyber_pressure += abs(effect) * strength
                    else:
                        energy_pressure += abs(effect) * strength
        
        adjusted_risk = min(0.99, adjusted_risk + cyber_pressure * 0.18)
        adjusted_cost = adjusted_cost * (1.0 + energy_pressure * 0.35)
    
    return {
        "adjusted_cost": adjusted_cost,
        "adjusted_time": adjusted_time,
        "adjusted_risk": adjusted_risk,
        "base_cost": base_cost,
        "base_time": base_time,
        "base_risk": base_risk,
        "factor_multipliers": {
            "cost": factor_impacts["cost_multiplier"],
            "time": factor_impacts["time_multiplier"],
            "risk": factor_impacts["risk_multiplier"],
        },
        "cargo_multiplier": cargo_cost_mult,
        "mode": mode,
    }


def find_hybrid_optimal_route(
    G: nx.DiGraph,
    source: str,
    destination: str,
    factors: Dict,
    cargo_weight: float = 1.0,
    allow_modal_switches: bool = True,
    max_switches: int = 3,
    optimization: str = "cost"  # "cost", "time", or "risk"
) -> Tuple[Optional[List], Optional[float], Optional[List]]:
    """
    Find optimal route allowing hybrid multi-modal transport.
    
    Returns:
        (path, total_cost, modal_sequence)
    """
    if source not in G or destination not in G:
        return None, None, None
    
    factor_impacts = compute_factor_impacts(factors)
    
    # Build expanded graph with mode-specific nodes
    expanded = nx.DiGraph()
    
    # Add mode-specific versions of each node
    for node in G.nodes():
        for mode in ["land", "sea", "air"]:
            expanded.add_node(f"{node}_{mode}", country=node, mode=mode)
    
    # Add edges within same mode
    for u, v, data in G.edges(data=True):
        route_mode = data.get("mode", "land")
        
        metrics = compute_route_entity_metrics(
            u, v,
            data["cost"],
            data["time"],
            data["risk"],
            route_mode,
            factors,
            cargo_weight
        )
        
        # Calculate weight based on optimization priority
        if optimization == "cost":
            weight = metrics["adjusted_cost"]
        elif optimization == "time":
            weight = metrics["adjusted_time"]
        elif optimization == "risk":
            weight = metrics["adjusted_risk"] * 1000  # Scale risk to be comparable
        else:
            weight = metrics["adjusted_cost"]
        
        # Add edge for the route's native mode
        expanded.add_edge(
            f"{u}_{route_mode}",
            f"{v}_{route_mode}",
            cost=metrics["adjusted_cost"],
            weight=weight,
            time=metrics["adjusted_time"],
            risk=metrics["adjusted_risk"],
            mode=route_mode
        )
    
    # Add modal transfer edges if allowed
    if allow_modal_switches:
        for node in G.nodes():
            modes = ["land", "sea", "air"]
            for i, mode1 in enumerate(modes):
                for mode2 in modes[i+1:]:
                    transfer_key = (mode1, mode2)
                    rev_transfer_key = (mode2, mode1)
                    
                    if transfer_key in MODAL_TRANSFER_COSTS:
                        transfer = MODAL_TRANSFER_COSTS[transfer_key]
                        # Calculate transfer weight based on optimization
                        if optimization == "cost":
                            transfer_weight = transfer["cost"] * factor_impacts["cost_multiplier"]
                        elif optimization == "time":
                            transfer_weight = transfer["time"] * factor_impacts["time_multiplier"]
                        elif optimization == "risk":
                            transfer_weight = transfer["risk"] * factor_impacts["risk_multiplier"] * 1000
                        else:
                            transfer_weight = transfer["cost"] * factor_impacts["cost_multiplier"]
                        
                        expanded.add_edge(
                            f"{node}_{mode1}",
                            f"{node}_{mode2}",
                            cost=transfer["cost"] * factor_impacts["cost_multiplier"],
                            weight=transfer_weight,
                            time=transfer["time"] * factor_impacts["time_multiplier"],
                            risk=transfer["risk"] * factor_impacts["risk_multiplier"],
                            mode="transfer"
                        )
                    
                    if rev_transfer_key in MODAL_TRANSFER_COSTS:
                        transfer = MODAL_TRANSFER_COSTS[rev_transfer_key]
                        # Calculate transfer weight based on optimization
                        if optimization == "cost":
                            transfer_weight = transfer["cost"] * factor_impacts["cost_multiplier"]
                        elif optimization == "time":
                            transfer_weight = transfer["time"] * factor_impacts["time_multiplier"]
                        elif optimization == "risk":
                            transfer_weight = transfer["risk"] * factor_impacts["risk_multiplier"] * 1000
                        else:
                            transfer_weight = transfer["cost"] * factor_impacts["cost_multiplier"]
                        
                        expanded.add_edge(
                            f"{node}_{mode2}",
                            f"{node}_{mode1}",
                            cost=transfer["cost"] * factor_impacts["cost_multiplier"],
                            weight=transfer_weight,
                            time=transfer["time"] * factor_impacts["time_multiplier"],
                            risk=transfer["risk"] * factor_impacts["risk_multiplier"],
                            mode="transfer"
                        )
    
    # Find shortest path across all modal combinations
    best_path = None
    best_cost = float('inf')
    
    for source_mode in ["land", "sea", "air"]:
        for dest_mode in ["land", "sea", "air"]:
            try:
                path = nx.shortest_path(
                    expanded,
                    f"{source}_{source_mode}",
                    f"{destination}_{dest_mode}",
                    weight="weight"  # Use optimization-specific weight
                )
                
                # Count modal switches
                switches = sum(1 for i in range(len(path)-1) 
                             if path[i].split('_')[1] != path[i+1].split('_')[1])
                
                if switches <= max_switches:
                    cost = sum(
                        expanded[path[i]][path[i+1]]["cost"]
                        for i in range(len(path)-1)
                    )
                    
                    if cost < best_cost:
                        best_cost = cost
                        best_path = path
            except nx.NetworkXNoPath:
                continue
    
    if best_path is None:
        return None, None, None
    
    # Extract country sequence and modal sequence
    country_path = [node.split('_')[0] for node in best_path]
    modal_sequence = [node.split('_')[1] for node in best_path]
    
    # Remove consecutive duplicates from country path
    clean_path = [country_path[0]]
    clean_modes = [modal_sequence[0]]
    for i in range(1, len(country_path)):
        if country_path[i] != clean_path[-1] or modal_sequence[i] != clean_modes[-1]:
            clean_path.append(country_path[i])
            clean_modes.append(modal_sequence[i])
    
    return clean_path, best_cost, clean_modes
