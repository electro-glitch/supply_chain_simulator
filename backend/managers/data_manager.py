import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "database"

def load_json(file):
    return json.load(open(BASE / file, "r"))

def save_json(file, data):
    json.dump(data, open(BASE / file, "w"), indent=4)