"""Shared transport mode profiles for simulations and route tools."""
from typing import Dict, Tuple

RouteMode = str

VALID_ROUTE_MODES: Tuple[RouteMode, ...] = ("land", "sea", "air")

MODE_PROFILES: Dict[RouteMode, Dict[str, float]] = {
    "land": {"cost_scale": 0.95, "time_scale": 1.15, "risk_delta": 0.02},
    "sea": {"cost_scale": 0.70, "time_scale": 1.35, "risk_delta": 0.05},
    "air": {"cost_scale": 1.25, "time_scale": 0.65, "risk_delta": -0.02},
}


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def apply_mode_profile(cost: float, time: float, risk: float, mode: RouteMode) -> Dict[str, float]:
    profile = MODE_PROFILES.get(mode, MODE_PROFILES["land"])
    return {
        "cost": max(cost * profile["cost_scale"], 0.01),
        "time": max(time * profile["time_scale"], 0.1),
        "risk": clamp(risk + profile["risk_delta"], 0.0001, 0.999),
    }
