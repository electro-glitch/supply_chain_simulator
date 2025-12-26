from managers.data_manager import load_json, save_json

FILE = "routes.json"


def get_routes():
    return load_json(FILE)


def add_route(route):
    data = load_json(FILE)
    src = route["origin"]
    dst = route["destination"]

    if src not in data:
        data[src] = {}

    cost = route["cost"]
    time = route["time"]
    risk = route["risk"]
    mode = route.get("mode", "land")
    base = route.get("base") or {"cost": cost, "time": time, "risk": risk}

    data[src][dst] = {
        "cost": cost,
        "time": time,
        "risk": risk,
        "mode": mode,
        "base": base,
    }
    save_json(FILE, data)

def delete_route(origin, destination):
    data = load_json(FILE)
    if origin in data and destination in data[origin]:
        del data[origin][destination]
    save_json(FILE, data)
