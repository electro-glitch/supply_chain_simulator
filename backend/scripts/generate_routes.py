from collections import defaultdict
import json
from pathlib import Path
from typing import Literal, Sequence, Tuple

RouteMode = Literal["land", "sea", "air"]
Edge = Tuple[str, str, RouteMode, float, float, float]

EDGES: Sequence[Edge] = [
    ("United States", "Canada", "land", 6, 5, 0.08),
    ("United States", "Mexico", "land", 5, 6, 0.12),
    ("United States", "United Kingdom", "sea", 10, 12, 0.10),
    ("United States", "Germany", "sea", 11, 13, 0.11),
    ("United States", "Brazil", "sea", 12, 14, 0.18),
    ("United States", "China", "air", 16, 20, 0.22),
    ("United States", "Japan", "air", 14, 18, 0.20),
    ("United States", "Australia", "air", 17, 22, 0.19),
    ("United States", "Netherlands", "sea", 11, 13, 0.11),
    ("Canada", "United Kingdom", "sea", 11, 12, 0.10),
    ("Canada", "Germany", "sea", 12, 13, 0.11),
    ("Canada", "Japan", "air", 15, 18, 0.17),
    ("Mexico", "Brazil", "sea", 10, 12, 0.17),
    ("Mexico", "Spain", "sea", 11, 13, 0.16),
    ("Mexico", "China", "air", 17, 21, 0.23),
    ("Brazil", "Argentina", "land", 6, 8, 0.15),
    ("Brazil", "Chile", "land", 8, 10, 0.16),
    ("Brazil", "Spain", "sea", 9, 11, 0.15),
    ("Brazil", "South Africa", "sea", 11, 13, 0.19),
    ("Brazil", "United Kingdom", "sea", 11, 13, 0.16),
    ("Brazil", "Nigeria", "sea", 11, 13, 0.19),
    ("Argentina", "Spain", "sea", 12, 15, 0.18),
    ("Argentina", "South Africa", "sea", 13, 16, 0.21),
    ("Chile", "China", "sea", 15, 20, 0.22),
    ("Chile", "Australia", "sea", 13, 18, 0.20),
    ("United Kingdom", "France", "land", 4, 5, 0.08),
    ("United Kingdom", "Germany", "air", 4, 5, 0.08),
    ("United Kingdom", "India", "sea", 12, 14, 0.16),
    ("United Kingdom", "South Africa", "sea", 13, 15, 0.17),
    ("United Kingdom", "United Arab Emirates", "sea", 11, 13, 0.15),
    ("United Kingdom", "Norway", "sea", 4, 5, 0.08),
    ("Germany", "France", "land", 3, 4, 0.07),
    ("Germany", "Italy", "land", 4, 5, 0.08),
    ("Germany", "Netherlands", "land", 2, 3, 0.06),
    ("Germany", "Sweden", "sea", 4, 5, 0.07),
    ("Germany", "Russia", "land", 7, 9, 0.14),
    ("France", "Spain", "land", 4, 5, 0.08),
    ("France", "Italy", "land", 4, 5, 0.08),
    ("France", "Nigeria", "sea", 10, 13, 0.18),
    ("France", "United Arab Emirates", "air", 11, 13, 0.15),
    ("Italy", "Spain", "land", 4, 5, 0.08),
    ("Italy", "Turkey", "land", 6, 7, 0.11),
    ("Italy", "Egypt", "sea", 7, 9, 0.12),
    ("Spain", "Nigeria", "sea", 9, 11, 0.17),
    ("Spain", "Mexico", "sea", 11, 13, 0.16),
    ("Netherlands", "Norway", "sea", 5, 6, 0.09),
    ("Netherlands", "Sweden", "sea", 4, 5, 0.08),
    ("Netherlands", "Singapore", "sea", 15, 18, 0.17),
    ("Switzerland", "Germany", "land", 3, 4, 0.07),
    ("Switzerland", "France", "land", 3, 4, 0.07),
    ("Switzerland", "Italy", "land", 3, 4, 0.07),
    ("Sweden", "Norway", "land", 3, 4, 0.07),
    ("Sweden", "Russia", "sea", 6, 8, 0.12),
    ("Norway", "Russia", "sea", 5, 7, 0.11),
    ("Russia", "China", "land", 9, 11, 0.15),
    ("Russia", "India", "land", 11, 13, 0.17),
    ("Turkey", "Germany", "air", 6, 7, 0.11),
    ("Turkey", "Saudi Arabia", "land", 7, 9, 0.13),
    ("Turkey", "Egypt", "sea", 5, 6, 0.10),
    ("Turkey", "United Arab Emirates", "air", 7, 9, 0.13),
    ("Saudi Arabia", "United Arab Emirates", "land", 3, 4, 0.08),
    ("Saudi Arabia", "India", "sea", 8, 10, 0.13),
    ("Saudi Arabia", "Egypt", "sea", 4, 5, 0.09),
    ("United Arab Emirates", "India", "sea", 6, 7, 0.12),
    ("United Arab Emirates", "Singapore", "sea", 10, 12, 0.14),
    ("United Arab Emirates", "Nigeria", "sea", 9, 11, 0.15),
    ("India", "Singapore", "sea", 6, 7, 0.12),
    ("India", "Vietnam", "sea", 5, 6, 0.11),
    ("India", "Australia", "sea", 11, 14, 0.15),
    ("India", "South Africa", "sea", 12, 16, 0.19),
    ("China", "Japan", "sea", 5, 6, 0.09),
    ("China", "South Korea", "sea", 4, 5, 0.08),
    ("China", "Vietnam", "land", 4, 5, 0.09),
    ("China", "Malaysia", "sea", 5, 6, 0.10),
    ("China", "Indonesia", "sea", 6, 7, 0.11),
    ("Japan", "South Korea", "sea", 3, 4, 0.07),
    ("Japan", "Australia", "sea", 10, 13, 0.14),
    ("South Korea", "Singapore", "sea", 7, 9, 0.12),
    ("South Korea", "Vietnam", "sea", 5, 6, 0.10),
    ("Singapore", "Indonesia", "sea", 3, 4, 0.08),
    ("Singapore", "Malaysia", "land", 2, 3, 0.07),
    ("Singapore", "Australia", "sea", 9, 11, 0.13),
    ("Singapore", "Japan", "sea", 11, 13, 0.14),
    ("Singapore", "Thailand", "land", 4, 5, 0.09),
    ("Indonesia", "Vietnam", "sea", 4, 5, 0.10),
    ("Indonesia", "Australia", "sea", 7, 9, 0.12),
    ("Vietnam", "Thailand", "land", 3, 4, 0.08),
    ("Vietnam", "Malaysia", "sea", 3, 4, 0.08),
    ("Thailand", "Malaysia", "land", 3, 4, 0.08),
    ("Thailand", "Singapore", "land", 4, 5, 0.09),
    ("Malaysia", "Australia", "sea", 9, 11, 0.13),
    ("Australia", "South Africa", "sea", 12, 16, 0.18),
    ("South Africa", "Nigeria", "sea", 8, 10, 0.16),
    ("South Africa", "Egypt", "land", 8, 10, 0.15),
    ("Nigeria", "Egypt", "land", 5, 6, 0.13),
    ("Egypt", "Saudi Arabia", "sea", 4, 5, 0.09)
]


def _make_entry(mode: RouteMode, cost: float, time: float, risk: float) -> dict:
    base = {"cost": cost, "time": time, "risk": risk}
    return {
        "cost": cost,
        "time": time,
        "risk": risk,
        "mode": mode,
        "base": base,
    }


def build_routes():
    routes = defaultdict(dict)
    for origin, destination, mode, cost, time, risk in EDGES:
        forward = _make_entry(mode, cost, time, risk)
        reverse = _make_entry(mode, cost, time, risk)
        routes[origin][destination] = forward
        routes[destination][origin] = reverse
    return routes


def main():
    base_dir = Path(__file__).resolve().parents[1]
    payload = json.dumps(build_routes(), indent=4)
    targets = [
        base_dir / "database" / "routes.json",
        base_dir / "database" / "defaults" / "routes.json",
    ]
    for target in targets:
        target.write_text(payload + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
