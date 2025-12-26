#!/usr/bin/env python3
"""Test script to verify factor impacts are being calculated correctly."""

from managers.factors_manager import get_factors
from simulation.game_theory_engine import compute_factor_impacts
import json

print("=" * 60)
print("FACTOR IMPACT TEST")
print("=" * 60)

# Get current factors from database
factors = get_factors()

print("\nCurrent factors from database:")
print(json.dumps(factors, indent=2))

# Compute impacts
impacts = compute_factor_impacts(factors)

print("\nComputed factor impacts:")
for key, value in impacts.items():
    print(f"  {key}: {value:.4f}")

print("\n" + "=" * 60)
print("Key multipliers that should affect simulation:")
print(f"  Cost Multiplier:  {impacts['cost_multiplier']:.4f}")
print(f"  Time Multiplier:  {impacts['time_multiplier']:.4f}")
print(f"  Risk Multiplier:  {impacts['risk_multiplier']:.4f}")
print("=" * 60)

print("\nIf cost_multiplier = 1.0000, factors have NO EFFECT (neutral)")
print("If cost_multiplier > 1.0000, factors INCREASE costs")
print("If cost_multiplier < 1.0000, factors DECREASE costs")
print("\nSame logic applies to time and risk multipliers.")
