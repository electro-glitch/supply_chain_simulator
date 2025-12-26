#!/usr/bin/env python3
"""Test script to verify game theory produces unique results for different country pairs."""

from simulation.scenario_engine import simulate_scenario

print("=" * 80)
print("GAME THEORY VARIATION TEST")
print("=" * 80)

# Test different country pairs
test_pairs = [
    ("USA", "China"),
    ("USA", "Germany"),
    ("Russia", "Mexico"),
    ("India", "Australia"),
    ("Brazil", "Japan"),
]

results = []

for source, destination in test_pairs:
    print(f"\nSimulating: {source} → {destination}")
    result = simulate_scenario(source, destination)
    
    if result:
        gt = result["game_theory"]
        results.append({
            "pair": f"{source} → {destination}",
            "cooperation": gt["cooperation_probability"],
            "treaty_break": gt["treaty_break_probability"],
            "stability": gt["stability_index"],
            "escalation": gt["escalation_risk"],
            "cost": result["total_cost"],
            "time": result["total_time"],
            "risk": result["total_risk"],
        })
        print(f"  Cooperation: {gt['cooperation_probability']:.1%}")
        print(f"  Treaty Break: {gt['treaty_break_probability']:.1%}")
        print(f"  Stability: {gt['stability_index']:.1%}")
        print(f"  Escalation: {gt['escalation_risk']:.1%}")
    else:
        print(f"  ❌ No route found")

print("\n" + "=" * 80)
print("COMPARISON TABLE")
print("=" * 80)
print(f"{'Route':<20} {'Coop%':<10} {'Treaty%':<10} {'Stabil%':<10} {'Escal%':<10}")
print("-" * 80)

for r in results:
    print(f"{r['pair']:<20} {r['cooperation']*100:<10.1f} {r['treaty_break']*100:<10.1f} "
          f"{r['stability']*100:<10.1f} {r['escalation']*100:<10.1f}")

print("\n" + "=" * 80)
print("VARIANCE CHECK")
print("=" * 80)

if len(results) >= 2:
    cooperation_values = [r["cooperation"] for r in results]
    treaty_values = [r["treaty_break"] for r in results]
    stability_values = [r["stability"] for r in results]
    
    coop_variance = max(cooperation_values) - min(cooperation_values)
    treaty_variance = max(treaty_values) - min(treaty_values)
    stability_variance = max(stability_values) - min(stability_values)
    
    print(f"Cooperation range: {coop_variance:.3f} ({min(cooperation_values):.3f} to {max(cooperation_values):.3f})")
    print(f"Treaty break range: {treaty_variance:.3f} ({min(treaty_values):.3f} to {max(treaty_values):.3f})")
    print(f"Stability range: {stability_variance:.3f} ({min(stability_values):.3f} to {max(stability_values):.3f})")
    
    if coop_variance > 0.05 and treaty_variance > 0.05 and stability_variance > 0.05:
        print("\n✅ PASS: Game theory produces unique results for different country pairs!")
    else:
        print("\n❌ FAIL: Values are too similar across different country pairs.")
        print("   Expected variance > 0.05 in all metrics")
else:
    print("Not enough successful simulations to check variance")
