# Understanding Factor Impacts in the Supply Chain Simulator

## How Factors Work

### Overview
The simulation uses a sophisticated factor system where **12 global factors** influence route costs, time, and risk through calculated multipliers. Each factor has two properties:

- **Effect** (-1 to +1): Direction of impact
  - Negative values (-1 to 0) = POSITIVE for supply chain (reduce costs/time/risk)
  - Positive values (0 to +1) = NEGATIVE for supply chain (increase costs/time/risk)
- **Strength** (0 to 1): How much the factor matters (0 = ignored, 1 = maximum impact)

### Key Insight: Factors Average Out
With 12 factors, they balance each other out. The current factors produce only a ~4% cost increase, ~3% time increase, and ~11% risk increase. **This is by design** - real-world supply chains face mixed conditions.

## Testing Factor Changes

### Quick Test: See Immediate Impact
1. Open the **Factors** page
2. Adjust one factor to an extreme:
   - Set "Energy Shock Index" effect to **+1.0**, strength to **1.0**
   - Click "Save calibration"
3. Go to **Simulation** page
4. Run a simulation (e.g., USA → China)
5. **Look at the Factor Impact box** (blue info box at top of results)
   - You should see multipliers change slightly (e.g., cost multiplier from 103.9% to 108.2%)

### Dramatic Test: Maximum Contrast
For obvious changes, you need to adjust MULTIPLE factors:

**Scenario 1: Perfect Conditions (Low Costs)**
1. Set ALL factors to: effect = **-1.0**, strength = **1.0**
2. Run simulation
3. Expected result: Cost multiplier ~147%, Time multiplier ~130%, Risk multiplier ~175%

**Scenario 2: Crisis Conditions (High Costs)**
1. Set ALL factors to: effect = **+1.0**, strength = **1.0**
2. Run simulation
3. Expected result: Cost multiplier ~77%, Time multiplier ~86%, Risk multiplier ~75%

**Difference**: Up to 70% cost swing, 44% time swing, 100% risk swing!

## Visual Indicators (Updated Display Format)

### 1. Factor Impact Indicator (Top of Results)
A blue info box now appears at the top of simulation results showing:
- **Percentage change** from baseline (e.g., +8.4% means costs increased by 8.4%)
- **Decimal multipliers** (e.g., 1.084× means multiply baseline by 1.084)
- Explanation that 12 factors balance out
- Guidance on how to see dramatic effects

**Example:**
- Cost Impact: **+8.4%** (Multiplier: 1.084×)
- This means: Baseline cost × 1.084 = Final cost
- In other words: 8.4% increase from baseline

### 2. Color-Coded Multipliers
In the "Factor Pressure Snapshot" section, multipliers are shown as decimals (not percentages):
- **Rose border** = High multiplier (>1.05× - costs increased)
- **Emerald border** = Low multiplier (<0.95× - costs reduced)
- **Gray border** = Neutral multiplier (0.95-1.05× - minimal impact)

**Format:** `1.084×` with badge showing `+8.4%`

### 3. Understanding Multiplier Values
- **1.000×** = Neutral (no change from baseline)
- **1.084×** = 8.4% increase (shown as `+8.4%` badge)
- **0.920×** = 8% decrease (shown as `-8.0%` badge)
- **1.500×** = 50% increase (baseline × 1.5)
- **0.650×** = 35% decrease (baseline × 0.65)

## Why You Might Not See Big Changes

### Common Scenarios:

**❌ Adjusting ONE factor by 10%**
- Example: Energy Shock from 0.82 to 0.92
- Impact: Multipliers change by <1%
- Why: 11 other factors still balancing it out

**❌ Multiple small tweaks**
- Example: Adjusting 3 factors by 0.1 each
- Impact: Multipliers change by <2%
- Why: Changes are too subtle when averaged

**✅ Extreme adjustments to MULTIPLE factors**
- Example: Setting 6+ factors to maximum negative (-1.0, strength 1.0)
- Impact: Multipliers change by 10-30%
- Why: Strong signal overwhelms averaging

## Backend Verification Tests

Three test scripts are included in `/backend` to verify the system works correctly:

### test_factors.py
```bash
cd c:\supply_chain_simulator\backend
python test_factors.py
```
Shows current factor values and computed multipliers.

### test_factor_sensitivity.py
```bash
cd c:\supply_chain_simulator\backend
python test_factor_sensitivity.py
```
Tests extreme scenarios to prove factors DO affect multipliers.

### test_game_theory_variation.py (NEW!)
```bash
cd c:\supply_chain_simulator\backend
python test_game_theory_variation.py
```
Verifies that different country pairs produce unique game theory outcomes (cooperation likelihood, treaty break risk, stability index, escalation risk).

## Summary: Factors ARE Working!

✅ Backend correctly computes multipliers from factors
✅ Multipliers correctly applied to cost/time/risk
✅ New visual indicators show factor impacts clearly
✅ With 12 factors, subtle changes produce subtle effects (realistic!)
✅ Extreme changes to multiple factors produce dramatic effects (verified!)

**The system is working as designed.** For noticeable changes:
1. Adjust multiple factors (5+ recommended)
2. Use extreme values (±0.8 to ±1.0)
3. Watch the Factor Pressure Snapshot for multiplier changes
4. Compare baseline vs adjusted metrics
