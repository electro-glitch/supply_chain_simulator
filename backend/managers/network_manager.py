import networkx as nx
from managers.data_manager import load_json

def build_network():
    routes = load_json("routes.json")
    G = nx.DiGraph()

    for src in routes:
        for dst, vals in routes[src].items():
            # Use current (possibly modified) values, not base values
            # This ensures geopolitical actions (tariffs, sanctions, etc.) are reflected
            G.add_edge(
                src,
                dst,
                cost=vals["cost"],
                time=vals["time"],
                risk=vals["risk"],
                mode=vals.get("mode", "land")
            )
    return G
