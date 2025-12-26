import json

with open('database/factors.json') as f:
    data = json.load(f)

print("Current factors:")
for k, v in data.items():
    print(f'  {k}: effect={v["effect"]}, strength={v["strength"]}')

# Calculate multipliers
positive = 0.0
negative = 0.0
strength_sum = 0.0

for v in data.values():
    effect = v["effect"]
    strength = abs(v["strength"])
    contribution = effect * strength
    strength_sum += strength
    if contribution >= 0:
        positive += contribution
    else:
        negative += abs(contribution)

pressure_index = negative / max(1.0, strength_sum)
support_index = positive / max(1.0, strength_sum)
cost_multiplier = 1 + (pressure_index - support_index) * 0.35 + (positive + negative) / max(1.0, strength_sum) * 0.12
cost_multiplier = max(0.65, min(1.55, cost_multiplier))

print(f"\nCalculated multipliers:")
print(f"  Positive contributions: {positive:.4f}")
print(f"  Negative contributions: {negative:.4f}")
print(f"  Support index: {support_index:.4f}")
print(f"  Pressure index: {pressure_index:.4f}")
print(f"  Cost multiplier: {cost_multiplier:.4f}")
