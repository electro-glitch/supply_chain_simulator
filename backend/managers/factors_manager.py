from managers.data_manager import load_json, save_json

FILE = "factors.json"
DEFAULT_FILE = "defaults/factors.json"


def get_factors():
    return load_json(FILE)


def add_factor(factor):
    data = load_json(FILE)
    data[factor["name"]] = {
        "effect": factor["effect"],
        "strength": factor["strength"],
    }
    save_json(FILE, data)


def update_factor(name: str, effect: float, strength: float):
    data = load_json(FILE)
    if name not in data:
        raise ValueError(f"Factor '{name}' does not exist")

    data[name] = {"effect": effect, "strength": strength}
    save_json(FILE, data)


def delete_factor(name):
    data = load_json(FILE)
    if name in data:
        del data[name]
    save_json(FILE, data)


def reset_factors_to_defaults():
    defaults = load_json(DEFAULT_FILE)
    save_json(FILE, defaults)
    return defaults


def set_all_factors(effect: float, strength: float):
    data = load_json(FILE)
    normalized_effect = float(effect)
    normalized_strength = float(strength)
    for name in data:
        data[name] = {
            "effect": normalized_effect,
            "strength": normalized_strength,
        }
    save_json(FILE, data)
    return data


def save_factors(factors):
    save_json(FILE, factors)
    save_json(FILE, data)
    return data
