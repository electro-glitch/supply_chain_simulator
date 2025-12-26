"""Test to verify factor math is working correctly"""

# Simulate the factor calculation logic
def compute_factor_impacts_test(factors):
    positive = 0.0
    negative = 0.0
    strength_sum = 0.0

    for data in factors.values():
        effect = float(data.get("effect", 0.0))
        strength = abs(float(data.get("strength", 0.0))) or 0.5
        contribution = effect * strength
        strength_sum += strength
        if contribution >= 0:
            positive += contribution
        else:
            negative += abs(contribution)

    pressure_index = negative / max(1.0, strength_sum)
    support_index = positive / max(1.0, strength_sum)
    volatility_index = (positive + negative) / max(1.0, strength_sum)
    
    cost_multiplier = max(0.65, min(1.55,
        1 + (pressure_index - support_index) * 0.35 + volatility_index * 0.12
    ))
    
    return {
        "positive": positive,
        "negative": negative,
        "strength_sum": strength_sum,
        "pressure_index": pressure_index,
        "support_index": support_index,
        "cost_multiplier": cost_multiplier,
    }

# Test 1: All crisis factors (should give HIGH cost multiplier)
crisis_factors = {
    "Energy Shock Index": {"effect": -1.0, "strength": 1.0},
    "Rare Earth Embargo": {"effect": -1.0, "strength": 1.0},
}

# Test 2: All supportive factors (should give LOW cost multiplier)
optimal_factors = {
    "Energy Shock Index": {"effect": 1.0, "strength": 1.0},
    "Rare Earth Embargo": {"effect": 1.0, "strength": 1.0},
}

print("=" * 60)
print("CRISIS MODE (all negative effects):")
crisis_result = compute_factor_impacts_test(crisis_factors)
for key, value in crisis_result.items():
    print(f"  {key}: {value:.4f}")

print("\n" + "=" * 60)
print("OPTIMAL MODE (all positive effects):")
optimal_result = compute_factor_impacts_test(optimal_factors)
for key, value in crisis_result.items():
    print(f"  {key}: {value:.4f}")

print("\n" + "=" * 60)
print("COMPARISON:")
print(f"  Crisis cost_multiplier:  {crisis_result['cost_multiplier']:.4f}")
print(f"  Optimal cost_multiplier: {optimal_result['cost_multiplier']:.4f}")
print(f"  Difference: {crisis_result['cost_multiplier'] - optimal_result['cost_multiplier']:.4f}")

if crisis_result['cost_multiplier'] > optimal_result['cost_multiplier']:
    print("\n  ✓ CORRECT: Crisis mode gives HIGHER costs (worse)")
else:
    print("\n  ✗ BUG: Crisis mode gives LOWER costs (better) - MATH IS BACKWARDS!")
