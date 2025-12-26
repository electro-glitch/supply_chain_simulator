from managers.data_manager import load_json, save_json

FILE = "commodities.json"


def get_commodities():
    return load_json(FILE)


def _parse_payload(payload: dict):
    if "name" in payload and "unit_cost" in payload:
        return payload["name"], payload["unit_cost"]
    if payload:
        name, data = next(iter(payload.items()))
        if isinstance(data, dict):
            return name, data.get("unit_cost", 0)
    raise ValueError("Invalid commodity payload")


def add_commodity(payload):
    data = load_json(FILE)
    name, unit_cost = _parse_payload(payload)
    data[name] = {"unit_cost": unit_cost}
    save_json(FILE, data)
