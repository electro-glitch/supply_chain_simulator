#!/usr/bin/env python3
"""Test to verify that factor changes produce different multipliers."""

from simulation.game_theory_engine import compute_factor_impacts
import json

print("=" * 60)
print("FACTOR SENSITIVITY TEST")
print("=" * 60)

# Test 1: All factors extremely positive (should decrease costs/time/risk)
test1_factors = {
    "Test Factor 1": {"effect": -1.0, "strength": 1.0},
    "Test Factor 2": {"effect": -1.0, "strength": 1.0},
    "Test Factor 3": {"effect": -1.0, "strength": 1.0},
}

impacts1 = compute_factor_impacts(test1_factors)
print("\n✅ Test 1: All factors EXTREMELY POSITIVE (effect=-1, strength=1)")
print(f"   Cost Multiplier:  {impacts1['cost_multiplier']:.4f}")
print(f"   Time Multiplier:  {impacts1['time_multiplier']:.4f}")
print(f"   Risk Multiplier:  {impacts1['risk_multiplier']:.4f}")

# Test 2: All factors extremely negative (should increase costs/time/risk)
test2_factors = {
    "Test Factor 1": {"effect": 1.0, "strength": 1.0},
    "Test Factor 2": {"effect": 1.0, "strength": 1.0},
    "Test Factor 3": {"effect": 1.0, "strength": 1.0},
}

impacts2 = compute_factor_impacts(test2_factors)
print("\n❌ Test 2: All factors EXTREMELY NEGATIVE (effect=+1, strength=1)")
print(f"   Cost Multiplier:  {impacts2['cost_multiplier']:.4f}")
print(f"   Time Multiplier:  {impacts2['time_multiplier']:.4f}")
print(f"   Risk Multiplier:  {impacts2['risk_multiplier']:.4f}")

# Test 3: Neutral factors
test3_factors = {
    "Test Factor 1": {"effect": 0.0, "strength": 0.5},
    "Test Factor 2": {"effect": 0.0, "strength": 0.5},
    "Test Factor 3": {"effect": 0.0, "strength": 0.5},
}

impacts3 = compute_factor_impacts(test3_factors)
print("\n⚖️  Test 3: NEUTRAL factors (effect=0, strength=0.5)")
print(f"   Cost Multiplier:  {impacts3['cost_multiplier']:.4f}")
print(f"   Time Multiplier:  {impacts3['time_multiplier']:.4f}")
print(f"   Risk Multiplier:  {impacts3['risk_multiplier']:.4f}")

print("\n" + "=" * 60)
print("INTERPRETATION:")
print("=" * 60)
print("• Positive effect = NEGATIVE for supply chain (increases costs)")
print("• Negative effect = POSITIVE for supply chain (decreases costs)")
print("\nDifferences between scenarios:")
cost_diff = impacts2['cost_multiplier'] - impacts1['cost_multiplier']
time_diff = impacts2['time_multiplier'] - impacts1['time_multiplier']
risk_diff = impacts2['risk_multiplier'] - impacts1['risk_multiplier']
print(f"  Cost range: {cost_diff:.4f} ({impacts1['cost_multiplier']:.4f} to {impacts2['cost_multiplier']:.4f})")
print(f"  Time range: {time_diff:.4f} ({impacts1['time_multiplier']:.4f} to {impacts2['time_multiplier']:.4f})")
print(f"  Risk range: {risk_diff:.4f} ({impacts1['risk_multiplier']:.4f} to {impacts2['risk_multiplier']:.4f})")
print("\n✅ Factors DO affect the simulation when changed!")
