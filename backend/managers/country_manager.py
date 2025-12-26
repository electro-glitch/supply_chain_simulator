from managers.data_manager import load_json, save_json

FILE = "countries.json"

def get_countries():
    return load_json(FILE)

def add_country(country):
    data = load_json(FILE)
    data[country["name"]] = country
    save_json(FILE, data)

def delete_country(name):
    data = load_json(FILE)
    if name in data:
        del data[name]
    save_json(FILE, data)
