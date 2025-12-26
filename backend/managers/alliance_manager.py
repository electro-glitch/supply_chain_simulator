from managers.data_manager import load_json, save_json

FILE = "alliances.json"


def get_alliances():
    return load_json(FILE)


def add_alliance(payload):
    data = load_json(FILE)
    name = payload["name"]
    data[name] = {
        "members": payload.get("members", []),
        "cohesion": payload.get("cohesion", 0.5),
        "support_multiplier": payload.get("support_multiplier", 0.1),
        "deterrence": payload.get("deterrence", 0.4),
    }
    save_json(FILE, data)


def delete_alliance(name):
    data = load_json(FILE)
    if name in data:
        del data[name]
    save_json(FILE, data)
