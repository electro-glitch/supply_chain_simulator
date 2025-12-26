import networkx as nx

def compute_route(G, src, dst, weight):
    try:
        path = nx.shortest_path(G, src, dst, weight=weight)
        cost = nx.shortest_path_length(G, src, dst, weight=weight)
        return path, cost
    except:
        return None, None

def cheapest_route(G, src, dst):
    return compute_route(G, src, dst, "cost")

def fastest_route(G, src, dst):
    return compute_route(G, src, dst, "time")

def safest_route(G, src, dst):
    return compute_route(G, src, dst, "risk")
