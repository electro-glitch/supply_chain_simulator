from managers.data_manager import load_json, save_json

FILE = "treaties.json"


def get_treaties():
    return load_json(FILE)


def add_treaty(payload):
    data = load_json(FILE)
    name = payload["name"]
    data[name] = {
        "parties": payload.get("parties", []),
        "stability": payload.get("stability", 0.5),
        "enforcement": payload.get("enforcement", 0.5),
        "breach_history": payload.get(
            "breach_history", {"breaches": 0, "years_active": 1}
        ),
    }
    save_json(FILE, data)


def delete_treaty(name):
    data = load_json(FILE)
    if name in data:
        del data[name]
    save_json(FILE, data)
