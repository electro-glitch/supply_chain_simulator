from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from managers.country_manager import *
from managers.commodity_manager import *
from managers.route_manager import *
from managers.factors_manager import *
from managers.geopolitics_manager import *
from managers.alliance_manager import *
from managers.treaty_manager import *
from simulation.scenario_engine import simulate_scenario
from simulation.game_theory_engine import compute_factor_impacts

app = FastAPI()
def _extract_countries(payload: dict):
    a = payload.get("a")
    b = payload.get("b")
    if not a or not b:
        raise HTTPException(status_code=400, detail="payload must include 'a' and 'b'")
    return a, b


def _parse_float(payload: dict, key: str, minimum: float | None = None, maximum: float | None = None):
    if key not in payload:
        raise HTTPException(status_code=400, detail=f"payload must include '{key}'")
    try:
        value = float(payload[key])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"{key} must be numeric")

    if minimum is not None and value < minimum:
        raise HTTPException(status_code=400, detail=f"{key} must be >= {minimum}")
    if maximum is not None and value > maximum:
        raise HTTPException(status_code=400, detail=f"{key} must be <= {maximum}")
    return value


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------- Countries ----------------------

@app.get("/countries")
def api_get_countries():
    return get_countries()

@app.post("/countries")
def api_add_country(country: dict):
    add_country(country)
    return {"status": "added"}

@app.delete("/countries/{name}")
def api_delete_country(name: str):
    delete_country(name)
    return {"status": "deleted"}

# ---------------------- Commodities ----------------------

@app.get("/commodities")
def api_get_goods():
    return get_commodities()

@app.post("/commodities")
def api_add_goods(goods: dict):
    add_commodity(goods)
    return {"status": "added"}

# ---------------------- Routes ----------------------

@app.get("/routes")
def api_get_routes():
    return get_routes()

@app.post("/routes")
def api_add_route(route: dict):
    add_route(route)
    return {"status": "added"}

@app.delete("/routes/{origin}/{destination}")
def api_delete_route(origin: str, destination: str):
    delete_route(origin, destination)
    return {"status": "deleted"}

# ---------------------- Factors ----------------------

@app.get("/factors")
def api_get_factors():
    return get_factors()

@app.post("/factors")
def api_add_factors(factor: dict):
    add_factor(factor)
    return {"status": "added"}

@app.put("/factors/{name}")
def api_update_factor(name: str, payload: dict):
    if "effect" not in payload or "strength" not in payload:
        raise HTTPException(status_code=400, detail="effect and strength are required")

    try:
        effect = float(payload["effect"])
        strength = float(payload["strength"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="effect and strength must be numbers")

    try:
        update_factor(name, effect, strength)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {"status": "updated"}

@app.delete("/factors/{name}")
def api_delete_factor(name: str):
    delete_factor(name)
    return {"status": "deleted"}


@app.get("/factors/metrics")
def api_factor_metrics():
    factors = get_factors()
    impacts = compute_factor_impacts(factors)
    return {"factors": factors, "impacts": impacts}


@app.post("/factors/reset")
def api_reset_factors(payload: dict | None = None):
    payload = payload or {}
    mode = (payload.get("mode") or "defaults").lower()

    if mode == "neutral":
        data = set_all_factors(0.0, 0.5)
    elif mode == "crisis":
        data = set_all_factors(-1.0, 1.0)
    elif mode == "optimal":
        data = set_all_factors(1.0, 1.0)
    else:
        data = reset_factors_to_defaults()

    impacts = compute_factor_impacts(data)
    return {"status": "reset", "mode": mode, "factors": data, "impacts": impacts}

# ---------------------- Geopolitics ----------------------

@app.post("/geo/war")
def api_declare_war(payload: dict):
    a, b = _extract_countries(payload)
    declare_war(a, b)
    return {"status": "war_declared"}

@app.post("/geo/tariff")
def api_apply_tariff(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent")
    if not impose_tariff(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "tariff_applied"}

@app.post("/geo/risk")
def api_modify_risk(payload: dict):
    a, b = _extract_countries(payload)
    delta = _parse_float(payload, "delta")
    if not apply_risk_modification(a, b, delta):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "risk_modified"}


@app.post("/geo/sanction")
def api_impose_sanction(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent", minimum=0)
    if not impose_sanction(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "sanction_applied"}


@app.post("/geo/subsidy")
def api_grant_subsidy(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent", minimum=0)
    if not grant_subsidy(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "subsidy_granted"}


@app.post("/geo/customs")
def api_fast_track_customs(payload: dict):
    a, b = _extract_countries(payload)
    hours = _parse_float(payload, "hours", minimum=0)
    if not fast_track_customs(a, b, hours):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "customs_fast_tracked"}


@app.post("/geo/infrastructure")
def api_disrupt_infrastructure(payload: dict):
    a, b = _extract_countries(payload)
    hours = _parse_float(payload, "hours", minimum=0)
    if not disrupt_infrastructure(a, b, hours):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "infrastructure_disrupted"}


@app.post("/geo/security")
def api_bolster_security(payload: dict):
    a, b = _extract_countries(payload)
    delta = _parse_float(payload, "delta", minimum=0)
    if not bolster_security(a, b, delta):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "security_bolstered"}


@app.post("/geo/cyber")
def api_launch_cyber_attack(payload: dict):
    a, b = _extract_countries(payload)
    delta = _parse_float(payload, "delta", minimum=0)
    if not launch_cyber_attack(a, b, delta):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "cyber_attack_launched"}


@app.post("/geo/corridor")
def api_open_corridor(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent", minimum=0)
    if not open_humanitarian_corridor(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "corridor_opened"}


@app.post("/geo/peace")
def api_broker_peace(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent", minimum=0, maximum=80)
    if not broker_peace_treaty(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "peace_brokered"}


@app.post("/geo/annex")
def api_annex(payload: dict):
    a, b = _extract_countries(payload)
    percent = _parse_float(payload, "percent", minimum=0, maximum=60)
    if not annex_territory(a, b, percent):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "territory_annexed"}


@app.post("/geo/famine")
def api_trigger_famine(payload: dict):
    country = payload.get("country")
    if not country:
        raise HTTPException(status_code=400, detail="Country required")
    severity = _parse_float(payload, "severity", minimum=0, maximum=100)
    from managers.geopolitics_manager import trigger_famine
    if not trigger_famine(country, severity):
        raise HTTPException(status_code=404, detail="Country not found or no routes affected")
    return {"status": "famine_triggered", "country": country, "severity": severity}


@app.post("/geo/civil_war")
def api_trigger_civil_war(payload: dict):
    country = payload.get("country")
    if not country:
        raise HTTPException(status_code=400, detail="Country required")
    intensity = _parse_float(payload, "intensity", minimum=0, maximum=100)
    from managers.geopolitics_manager import trigger_civil_war
    if not trigger_civil_war(country, intensity):
        raise HTTPException(status_code=404, detail="Country not found or no routes affected")
    return {"status": "civil_war_triggered", "country": country, "intensity": intensity}


@app.post("/geo/natural_disaster")
def api_trigger_natural_disaster(payload: dict):
    country = payload.get("country")
    disaster_type = payload.get("type", "earthquake")
    if not country:
        raise HTTPException(status_code=400, detail="Country required")
    magnitude = _parse_float(payload, "magnitude", minimum=0, maximum=100)
    from managers.geopolitics_manager import trigger_natural_disaster
    if not trigger_natural_disaster(country, disaster_type, magnitude):
        raise HTTPException(status_code=404, detail="Country not found or no routes affected")
    return {"status": "natural_disaster_triggered", "country": country, "type": disaster_type, "magnitude": magnitude}

    return {"status": "annexation_applied"}


@app.post("/geo/disaster")
def api_disaster(payload: dict):
    a, b = _extract_countries(payload)
    severity = _parse_float(payload, "severity", minimum=0, maximum=100)
    if not trigger_natural_disaster(a, b, severity):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "disaster_applied"}


@app.post("/geo/mode")
def api_set_mode(payload: dict):
    a, b = _extract_countries(payload)
    mode = payload.get("mode")
    if not isinstance(mode, str):
        raise HTTPException(status_code=400, detail="payload must include 'mode'")
    mode = mode.lower()
    if mode not in VALID_ROUTE_MODES:
        raise HTTPException(status_code=400, detail=f"mode must be one of {sorted(VALID_ROUTE_MODES)}")
    if not set_trade_route_mode(a, b, mode):
        raise HTTPException(status_code=404, detail="Route not found")
    return {"status": "mode_updated", "mode": mode}


@app.post("/geo/storm")
def api_trigger_storm(payload: dict):
    a, b = _extract_countries(payload)
    severity = _parse_float(payload, "severity", minimum=0, maximum=100)
    if not trigger_sea_storm(a, b, severity):
        raise HTTPException(status_code=404, detail="Sea route not found")
    return {"status": "storm_registered"}


@app.post("/geo/pirates")
def api_pirates(payload: dict):
    a, b = _extract_countries(payload)
    severity = _parse_float(payload, "severity", minimum=0, maximum=100)
    if not report_pirate_activity(a, b, severity):
        raise HTTPException(status_code=404, detail="Sea route not found")
    return {"status": "piracy_noted"}

# ---------------------- Alliances ----------------------

@app.get("/alliances")
def api_get_alliances():
    return get_alliances()

@app.post("/alliances")
def api_add_alliance(payload: dict):
    add_alliance(payload)
    return {"status": "added"}

@app.delete("/alliances/{name}")
def api_delete_alliance(name: str):
    delete_alliance(name)
    return {"status": "deleted"}

# ---------------------- Treaties ----------------------

@app.get("/treaties")
def api_get_treaties():
    return get_treaties()

@app.post("/treaties")
def api_add_treaty(payload: dict):
    add_treaty(payload)
    return {"status": "added"}

@app.delete("/treaties/{name}")
def api_delete_treaty(name: str):
    delete_treaty(name)
    return {"status": "deleted"}

# ---------------------- Simulation ----------------------

@app.post("/simulate")
def api_simulate(payload: dict):
    try:
        src = payload.get("src")
        dst = payload.get("dst")
        
        if not src:
            raise HTTPException(status_code=400, detail="Missing required field: 'src' (source country)")
        if not dst:
            raise HTTPException(status_code=400, detail="Missing required field: 'dst' (destination country)")
        
        # Get three route options: cheapest, fastest, most secure
        options = {}
        
        for opt_type in ["cost", "time", "risk"]:
            result = simulate_scenario(
                src,
                dst,
                payload.get("parameters", {}),
                payload.get("mode"),
                payload.get("cargo_manifest"),
                optimization=opt_type,
            )
            if result:
                options[opt_type] = result
        
        if not options:
            raise HTTPException(status_code=404, detail="No viable route found")
        
        # Return all three options with labels
        return {
            "cheapest": options.get("cost"),
            "fastest": options.get("time"),
            "most_secure": options.get("risk"),
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(status_code=500, detail=error_detail)

import shutil
from pathlib import Path

@app.post("/reset")
def reset_database():
    base = Path(__file__).resolve().parent / "database"
    defaults = base / "defaults"

    # overwrite live JSON files with defaults
    shutil.copy(defaults / "countries.json", base / "countries.json")
    shutil.copy(defaults / "commodities.json", base / "commodities.json")
    shutil.copy(defaults / "routes.json", base / "routes.json")
    shutil.copy(defaults / "factors.json", base / "factors.json")
    shutil.copy(defaults / "alliances.json", base / "alliances.json")
    shutil.copy(defaults / "treaties.json", base / "treaties.json")

    return {"status": "reset_complete"}

from managers.network_manager import build_network

@app.get("/graph")
def get_graph():
    G = build_network()
    
    edges = []
    for u, v, d in G.edges(data=True):
        edges.append({
            "origin": u,
            "destination": v,
            "cost": d["cost"],
            "time": d["time"],
            "risk": d["risk"]
        })

    return {
        "nodes": list(G.nodes()),
        "edges": edges
    }
