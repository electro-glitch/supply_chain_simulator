from managers.data_manager import load_json, save_json
from utils.mode_profiles import VALID_ROUTE_MODES, MODE_PROFILES

FILE = "routes.json"
DEFAULT_FILE = "defaults/routes.json"
FACTORS_FILE = "factors.json"


def load_factors():
    """Load global factors from factors.json"""
    return load_json(FACTORS_FILE)


def save_factors(factors):
    """Save global factors to factors.json"""
    save_json(FACTORS_FILE, factors)


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _mutate_route(a: str, b: str, mutator):
    data = load_json(FILE)
    
    # Check if direct route exists
    if a in data and b in data[a]:
        mutator(data[a][b])
        save_json(FILE, data)
        return True
    
    # No direct route - find indirect path and apply to all segments
    import networkx as nx
    G = nx.DiGraph()
    for src in data:
        for dst in data[src]:
            G.add_edge(src, dst)
    
    try:
        # Find shortest path
        path = nx.shortest_path(G, a, b)
        # Apply mutation to each segment in the path
        for i in range(len(path) - 1):
            src, dst = path[i], path[i + 1]
            if src in data and dst in data[src]:
                mutator(data[src][dst])
        save_json(FILE, data)
        return True
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return False


def _mutate_route_guarded(a: str, b: str, predicate, mutator):
    data = load_json(FILE)
    if a not in data or b not in data[a]:
        return False

    route = data[a][b]
    if predicate and not predicate(route):
        return False

    mutator(route)
    save_json(FILE, data)
    return True


def _ensure_base(route: dict):
    if "base" not in route or not isinstance(route["base"], dict):
        route["base"] = {
            "cost": route["cost"],
            "time": route["time"],
            "risk": route["risk"],
        }


def _restore_route_from_defaults(a: str, b: str) -> bool:
    defaults = load_json(DEFAULT_FILE)
    if a not in defaults or b not in defaults[a]:
        return False

    data = load_json(FILE)
    if a not in data:
        data[a] = {}
    data[a][b] = defaults[a][b]
    save_json(FILE, data)
    return True


def declare_war(a, b):
    from managers.factors_manager import get_factors, save_factors
    
    # Delete routes between warring nations
    data = load_json(FILE)
    modified = False

    if a in data and b in data[a]:
        del data[a][b]
        modified = True

    if b in data and a in data[b]:
        del data[b][a]
        modified = True

    if modified:
        save_json(FILE, data)
    
    # Set extreme negative factors to reflect war conditions
    factors = get_factors()
    factors["Border Tension Pressure"] = {"effect": -1.0, "strength": 1.0}
    factors["Diplomatic Alignment"] = {"effect": -1.0, "strength": 1.0}
    factors["Cyber Threat Level"] = {"effect": -0.9, "strength": 1.0}
    save_factors(factors)

    return modified


def impose_tariff(a, b, percent):
    # Update global factors to reflect tariff pressure
    factors = load_factors()
    # Tariffs increase border tensions and economic pressure
    current_border = factors.get("Border Tension Pressure", {"effect": 0.0, "strength": 0.5})
    current_currency = factors.get("Currency Instability", {"effect": 0.0, "strength": 0.5})
    
    # Increase pressure based on tariff severity (normalized 0-1 scale)
    pressure_increase = min(percent / 100.0, 0.3)  # Max 0.3 increase
    current_border["effect"] = max(-1.0, min(0.0, current_border["effect"] - pressure_increase))
    current_border["strength"] = min(1.0, current_border["strength"] + 0.1)
    current_currency["effect"] = max(-1.0, min(0.0, current_currency["effect"] - pressure_increase * 0.5))
    
    factors["Border Tension Pressure"] = current_border
    factors["Currency Instability"] = current_currency
    save_factors(factors)
    
    # Also modify the route
    return _mutate_route(a, b, lambda route: route.__setitem__("cost", route["cost"] * (1 + percent / 100)))


def apply_risk_modification(a, b, delta):
    # Update global factors to reflect security/risk changes
    factors = load_factors()
    current_maritime = factors.get("Maritime Security Index", {"effect": 0.0, "strength": 0.5})
    current_cyber = factors.get("Cyber Threat Level", {"effect": 0.0, "strength": 0.5})
    
    # Negative delta = reduced risk (positive effect), positive delta = increased risk (negative effect)
    risk_factor = -delta * 2.0  # Amplify for factor impact
    current_maritime["effect"] = max(-1.0, min(1.0, current_maritime["effect"] + risk_factor))
    current_maritime["strength"] = min(1.0, current_maritime["strength"] + abs(delta) * 0.5)
    current_cyber["effect"] = max(-1.0, min(1.0, current_cyber["effect"] + risk_factor * 0.7))
    
    factors["Maritime Security Index"] = current_maritime
    factors["Cyber Threat Level"] = current_cyber
    save_factors(factors)
    
    return _mutate_route(
        a,
        b,
        lambda route: route.__setitem__("risk", _clamp(route["risk"] + delta, 0, 1)),
    )


def impose_sanction(a, b, percent):
    # Update global factors to reflect sanction pressure
    factors = load_factors()
    current_diplomatic = factors.get("Diplomatic Alignment", {"effect": 0.0, "strength": 0.5})
    current_debt = factors.get("Debt Distress Signal", {"effect": 0.0, "strength": 0.5})
    
    # Sanctions create diplomatic and economic pressure
    pressure = min(percent / 100.0, 0.35)
    current_diplomatic["effect"] = max(-1.0, min(0.0, current_diplomatic["effect"] - pressure))
    current_diplomatic["strength"] = min(1.0, current_diplomatic["strength"] + 0.2)
    current_debt["effect"] = max(-1.0, min(0.0, current_debt["effect"] - pressure * 0.8))
    
    factors["Diplomatic Alignment"] = current_diplomatic
    factors["Debt Distress Signal"] = current_debt
    save_factors(factors)
    
    def mutate(route):
        route["cost"] *= (1 + percent / 100)
        route["risk"] = _clamp(route["risk"] + 0.05, 0, 1)

    return _mutate_route(a, b, mutate)


def grant_subsidy(a, b, percent):
    # Update global factors to reflect subsidy benefits
    factors = load_factors()
    current_innovation = factors.get("Innovation Subsidy", {"effect": 0.0, "strength": 0.5})
    current_supply = factors.get("Supply Chain Capacity", {"effect": 0.0, "strength": 0.5})
    
    # Subsidies provide positive relief (positive effect reduces costs)
    relief_factor = min(percent / 100.0, 0.4)  # Max 0.4 relief
    current_innovation["effect"] = max(-1.0, min(1.0, current_innovation["effect"] + relief_factor))
    current_innovation["strength"] = min(1.0, current_innovation["strength"] + 0.15)
    current_supply["effect"] = max(-1.0, min(1.0, current_supply["effect"] + relief_factor * 0.6))
    
    factors["Innovation Subsidy"] = current_innovation
    factors["Supply Chain Capacity"] = current_supply
    save_factors(factors)
    
    def mutate(route):
        route["cost"] = max(route["cost"] * (1 - percent / 100), 0.1)
        route["risk"] = _clamp(route["risk"] - 0.03, 0, 1)

    return _mutate_route(a, b, mutate)


def fast_track_customs(a, b, hours):
    def mutate(route):
        route["time"] = max(route["time"] - hours, 1)

    return _mutate_route(a, b, mutate)


def disrupt_infrastructure(a, b, hours):
    def mutate(route):
        route["time"] += hours
        route["risk"] = _clamp(route["risk"] + 0.07, 0, 1)

    return _mutate_route(a, b, mutate)


def bolster_security(a, b, delta):
    def mutate(route):
        route["risk"] = _clamp(route["risk"] - delta, 0, 1)

    return _mutate_route(a, b, mutate)


def launch_cyber_attack(a, b, delta):
    def mutate(route):
        route["risk"] = _clamp(route["risk"] + delta, 0, 1)
        route["time"] += max(delta * 10, 1)

    return _mutate_route(a, b, mutate)


def open_humanitarian_corridor(a, b, percent):
    def mutate(route):
        route["cost"] = max(route["cost"] * (1 - percent / 100), 0.1)
        route["time"] = max(route["time"] * (1 - percent / 200), 1)
        route["risk"] = _clamp(route["risk"] - 0.05, 0, 1)

    return _mutate_route(a, b, mutate)


def broker_peace_treaty(a, b, percent):
    def mutate(route):
        _ensure_base(route)
        reduction = percent / 100
        route["cost"] = max(route["cost"] * (1 - reduction * 0.6), route["base"]["cost"] * 0.35)
        route["time"] = max(route["time"] * (1 - reduction * 0.4), 0.5)
        route["risk"] = _clamp(route["risk"] - reduction * 0.3, 0, 1)
        route.setdefault("mode", "land")

    if _mutate_route(a, b, mutate):
        return True
    if not _restore_route_from_defaults(a, b):
        return False
    return _mutate_route(a, b, mutate)


def annex_territory(a, b, percent):
    def mutate(route):
        _ensure_base(route)
        relief = percent / 100
        route["time"] = max(route["time"] * (1 - relief), 0.5)
        route["cost"] = max(route["cost"] * (1 - relief * 0.6), 0.1)
        route["risk"] = _clamp(route["risk"] + 0.05, 0, 1)
        route["mode"] = "land"

    return _mutate_route(a, b, mutate)


def trigger_natural_disaster(a, b, severity):
    def mutate(route):
        impact = severity / 10
        route["time"] += impact * 0.8
        route["cost"] *= (1 + severity / 140)
        route["risk"] = _clamp(route["risk"] + severity / 120, 0, 1)

    return _mutate_route(a, b, mutate)


def set_trade_route_mode(a, b, mode):
    mode = mode.lower()
    if mode not in VALID_ROUTE_MODES:
        return False

    profile = MODE_PROFILES[mode]
    data = load_json(FILE)
    
    # If route doesn't exist, create it with default values based on mode
    if a not in data or b not in data[a]:
        # Create default route values based on mode type
        if mode == "air":
            base_cost, base_time, base_risk = 15.0, 18.0, 0.18
        elif mode == "sea":
            base_cost, base_time, base_risk = 11.0, 13.0, 0.15
        else:  # land
            base_cost, base_time, base_risk = 8.0, 10.0, 0.12
        
        if a not in data:
            data[a] = {}
        if b not in data:
            data[b] = {}
        
        # Create bidirectional route
        for origin, dest in [(a, b), (b, a)]:
            data[origin][dest] = {
                "cost": base_cost * profile["cost_scale"],
                "time": base_time * profile["time_scale"],
                "risk": _clamp(base_risk + profile["risk_delta"], 0, 1),
                "mode": mode,
                "base": {
                    "cost": base_cost,
                    "time": base_time,
                    "risk": base_risk,
                }
            }
        
        save_json(FILE, data)
        return True
    
    # Route exists, update it
    def mutate(route):
        _ensure_base(route)
        base = route["base"]
        route["mode"] = mode
        route["cost"] = max(base["cost"] * profile["cost_scale"], 0.05)
        route["time"] = max(base["time"] * profile["time_scale"], 0.25)
        route["risk"] = _clamp(base["risk"] + profile["risk_delta"], 0, 1)

    return _mutate_route(a, b, mutate)


def trigger_sea_storm(a, b, severity):
    severity = _clamp(severity, 0, 100)

    def mutate(route):
        route["time"] += severity / 5
        route["cost"] *= (1 + severity / 200)
        route["risk"] = _clamp(route["risk"] + severity / 150, 0, 1)

    return _mutate_route_guarded(a, b, lambda route: route.get("mode") == "sea", mutate)


def report_pirate_activity(a, b, severity):
    severity = _clamp(severity, 0, 100)

    def mutate(route):
        route["cost"] *= (1 + severity / 120)
        route["risk"] = _clamp(route["risk"] + severity / 80 + 0.02, 0, 1)
        route["time"] += severity / 20

    return _mutate_route_guarded(a, b, lambda route: route.get("mode") == "sea", mutate)


def trigger_famine(country: str, severity: float) -> bool:
    """
    Trigger a famine event in a country, affecting all routes through it.
    Severity: 0-100 (higher = worse impact)
    Effects: Increased costs (humanitarian aid, food imports), delays, moderate risk increase
    """
    from managers.data_manager import load_json as load_factors, save_json as save_factors
    severity = _clamp(severity, 0, 100)
    
    # Update Food Security Buffer factor
    factors = load_factors("factors.json")
    if "Food Security Buffer" in factors:
        # Negative effect indicates lack of food security
        factors["Food Security Buffer"]["effect"] = -severity / 100.0
        factors["Food Security Buffer"]["strength"] = min(1.0, severity / 60.0)
        save_factors("factors.json", factors)
    
    # Impact all routes from/to this country
    data = load_json(FILE)
    impact_count = 0
    
    for origin in data:
        if country in data[origin]:
            route = data[origin][country]
            route["cost"] *= (1 + severity / 100)
            route["time"] *= (1 + severity / 150)
            route["risk"] = _clamp(route["risk"] + severity / 200, 0, 1)
            impact_count += 1
    
    if country in data:
        for dest in data[country]:
            route = data[country][dest]
            route["cost"] *= (1 + severity / 100)
            route["time"] *= (1 + severity / 150)
            route["risk"] = _clamp(route["risk"] + severity / 200, 0, 1)
            impact_count += 1
    
    if impact_count > 0:
        save_json(FILE, data)
        return True
    return False


def trigger_civil_war(country: str, intensity: float) -> bool:
    """
    Trigger a civil war in a country, severely affecting all routes.
    Intensity: 0-100 (higher = more violent conflict)
    Effects: Massive cost increases (security, insurance), severe delays, extreme risk
    """
    from managers.data_manager import load_json as load_factors, save_json as save_factors
    intensity = _clamp(intensity, 0, 100)
    
    # Update Border Tension Pressure and Diplomatic Alignment factors
    factors = load_factors("factors.json")
    if "Border Tension Pressure" in factors:
        factors["Border Tension Pressure"]["effect"] = intensity / 100.0
        factors["Border Tension Pressure"]["strength"] = min(1.0, intensity / 50.0)
    if "Diplomatic Alignment" in factors:
        factors["Diplomatic Alignment"]["effect"] = -intensity / 100.0
        factors["Diplomatic Alignment"]["strength"] = min(1.0, intensity / 50.0)
    save_factors("factors.json", factors)
    
    # Severe impact on all routes from/to this country
    data = load_json(FILE)
    impact_count = 0
    
    for origin in data:
        if country in data[origin]:
            route = data[origin][country]
            route["cost"] *= (1 + intensity / 40)  # 2.5x at max intensity
            route["time"] *= (1 + intensity / 60)  # 1.67x at max intensity
            route["risk"] = _clamp(route["risk"] + intensity / 100 + 0.2, 0, 1)  # +20% base risk
            impact_count += 1
    
    if country in data:
        for dest in data[country]:
            route = data[country][dest]
            route["cost"] *= (1 + intensity / 40)
            route["time"] *= (1 + intensity / 60)
            route["risk"] = _clamp(route["risk"] + intensity / 100 + 0.2, 0, 1)
            impact_count += 1
    
    if impact_count > 0:
        save_json(FILE, data)
        return True
    return False


def trigger_natural_disaster(country: str, disaster_type: str, magnitude: float) -> bool:
    """
    Trigger a natural disaster (earthquake, hurricane, flood, etc.) in a country.
    Magnitude: 0-100 (higher = more severe)
    Effects: Infrastructure damage, delays, moderate cost increase from reconstruction
    """
    from managers.data_manager import load_json as load_factors, save_json as save_factors
    magnitude = _clamp(magnitude, 0, 100)
    
    # Update Climate Shock Exposure factor
    factors = load_factors("factors.json")
    if "Climate Shock Exposure" in factors:
        factors["Climate Shock Exposure"]["effect"] = magnitude / 100.0
        factors["Climate Shock Exposure"]["strength"] = min(1.0, magnitude / 55.0)
        save_factors("factors.json", factors)
    
    # Impact all routes from/to this country
    data = load_json(FILE)
    impact_count = 0
    
    # Different disaster types have different impact profiles
    cost_mult = 1.0
    time_mult = 1.0
    risk_add = 0.0
    
    if disaster_type.lower() in ["earthquake", "tsunami"]:
        cost_mult = 1 + magnitude / 80  # Infrastructure rebuilding
        time_mult = 1 + magnitude / 50  # Severe delays
        risk_add = magnitude / 150
    elif disaster_type.lower() in ["hurricane", "typhoon", "cyclone"]:
        cost_mult = 1 + magnitude / 100
        time_mult = 1 + magnitude / 40  # Major delays
        risk_add = magnitude / 120
    elif disaster_type.lower() in ["flood", "drought"]:
        cost_mult = 1 + magnitude / 120
        time_mult = 1 + magnitude / 70
        risk_add = magnitude / 180
    else:  # Generic disaster
        cost_mult = 1 + magnitude / 100
        time_mult = 1 + magnitude / 60
        risk_add = magnitude / 150
    
    for origin in data:
        if country in data[origin]:
            route = data[origin][country]
            route["cost"] *= cost_mult
            route["time"] *= time_mult
            route["risk"] = _clamp(route["risk"] + risk_add, 0, 1)
            impact_count += 1
    
    if country in data:
        for dest in data[country]:
            route = data[country][dest]
            route["cost"] *= cost_mult
            route["time"] *= time_mult
            route["risk"] = _clamp(route["risk"] + risk_add, 0, 1)
            impact_count += 1
    
    if impact_count > 0:
        save_json(FILE, data)
        return True
    return False

