# Hybrid Multi-Modal Routing Implementation

## Overview
This document describes the comprehensive implementation of hybrid multi-modal routing and realistic cargo modeling in the supply chain simulator.

## Key Features Implemented

### 1. Streamlined Simulation Interface
- **Simplified Controls**: Removed transport mode selection - system automatically finds optimal route
- **Direct Corridor Removed**: No manual mode locking - hybrid routing determines best path
- **Clean UI**: Only essential controls remain: source, destination, commodities, and cargo

### 2. Enhanced Route Visualization
- **Visual Route Path**: Routes displayed with country nodes and directional arrows
- **Modal Transitions**: Clear indicators when transport mode changes (land→sea→air)
- **Transfer Points**: Visual badges showing modal transfers with mode indicators
- **Mode Icons**: 🚛 LAND, 🚢 SEA, ✈️ AIR for easy identification
- **Origin/Destination Labels**: Clear marking of start and end points

### 3. Dynamic Geopolitical Controls
- **Post-Simulation Controls**: Appear only after route is calculated
- **Auto-Rerun**: Adjustments automatically trigger simulation re-execution
- **Real-Time Updates**: Watch costs/risks change as factors are adjusted
- **6 Control Types**:
  - **Tariff Impact**: 0-100% cost increase
  - **Security Risk**: 0-0.5 risk delta
  - **Subsidy**: 0-50% cost reduction  
  - **Infrastructure Delay**: 0-48 hours added
  - **Customs Speed**: 0-24 hours saved
  - **Declare War**: Maximum factor impact button

### 4. Multi-Modal Transport System
- **Hybrid Routes**: Routes can now combine multiple transport modes (land → sea → air)
- **Modal Transfers**: Realistic transfer costs and times when switching between modes
- **Capacity Modeling**: Different modes have different capacity multipliers affecting costs
  - Land: 1.0x baseline
  - Sea: 0.5x (cheaper for bulk cargo)
  - Air: 2.5x (premium for fast delivery)

### 2. Route Entity Metrics
Each route segment is now treated as an entity with dynamically calculated metrics:
- **Base Metrics**: Cost, time, and risk from route database
- **Factor Adjustments**: Mode-specific factor sensitivity
  - Sea routes affected by Maritime Security and Climate factors
  - Land routes affected by Border Tension and Diplomatic factors
  - Air routes affected by Cyber Threat and Energy factors
- **Cargo Weight Impact**: Heavier cargo increases costs via capacity multipliers

### 3. Cargo Manifest System
- **Multiple Commodities**: Users can add multiple commodities with quantities
- **Weight Calculation**: Total cargo weight = Σ(quantity × unit_cost × 0.01)
- **Cost Scaling**: Heavier cargo increases route costs realistically
- **UI Integration**: Add/remove commodities with quantity controls

### 4. Factor Breakdown Visualization
- **Transparency**: All factors shown with individual contributions
- **Visual Representation**: Color-coded progress bars
  - Green = Support (positive contribution)
  - Red = Pressure (negative contribution)
  - Gray = Neutral
- **Top 8 Factors**: Sorted by absolute contribution magnitude

### 5. War Impact on Factors
When war is declared between two countries:
- Border Tension set to -1.0 (maximum negative)
- Diplomatic Alignment set to -1.0 (complete breakdown)
- Cyber Threat set to -0.9 (high risk)
- These changes immediately affect route costs and risks

## Implementation Details

### Backend Changes

#### `simulation/hybrid_routing_engine.py` (NEW)
```python
# Key components:
- MODAL_TRANSFER_COSTS: Define costs for switching between modes
- MODAL_CAPACITY_MULTIPLIERS: Mode-specific cost scaling
- compute_route_entity_metrics(): Calculate adjusted metrics per leg
- find_hybrid_optimal_route(): NetworkX-based hybrid pathfinding
```

**Transfer Costs:**
- Land ↔ Sea: $50, 4 hours, 2% risk (port handling)
- Land ↔ Air: $100, 2 hours, 1% risk (airport handling)
- Sea ↔ Air: $150, 6 hours, 3% risk (complex transfer)

**Mode-Specific Factor Sensitivity:**
- **Sea Routes**: +15% risk from Maritime/Climate factors
- **Land Routes**: +25% cost and +12% risk from Border/Diplomatic factors
- **Air Routes**: +20% cost and +8% risk from Cyber/Energy factors

#### `simulation/scenario_engine.py` (UPDATED)
- Accepts `cargo_manifest` parameter
- Calculates `cargo_weight` from manifest
- Calls `find_hybrid_optimal_route()` for pathfinding
- Uses `compute_route_entity_metrics()` for each leg
- Returns `factor_breakdown` for visualization
- Tracks `modal_sequence` for UI display

#### `managers/geopolitics_manager.py` (UPDATED)
- `declare_war()` now calls `save_factors()` to set extreme negative values
- Ensures war immediately impacts factor state

#### `main.py` (UPDATED)
- `/simulate` endpoint accepts `cargo_manifest` in payload
- Passes cargo manifest to `simulate_scenario()`

### Frontend Changes

#### `pages/Simulation/SimulationPage.tsx` (UPDATED)
**New State:**
```typescript
const [cargoManifest, setCargoManifest] = useState<Array<{name: string, quantity: number}>>([]);
```

**Cargo UI:**
- Commodity selection dropdown
- Quantity input field
- Add/Remove buttons
- Total items display

**Factor Breakdown UI:**
- Visual bars showing contribution magnitude
- Color-coded by impact type (support/pressure/neutral)
- Sorted by absolute contribution
- Shows top 8 factors

**API Integration:**
- Passes `cargo_manifest` to `api.simulate()`
- Maps local state to API format

#### `types/Simulation.ts` (UPDATED)
```typescript
export interface FactorBreakdownItem {
  name: string;
  effect: number;
  strength: number;
  contribution: number;
  impact_type: "support" | "pressure" | "neutral";
}

export interface CommodityCargo {
  name: string;
  quantity: number;
  unit_cost: number;
}
```

#### `lib/api.ts` (UPDATED)
- `simulate()` accepts optional `cargo_manifest` parameter
- Properly typed as `{ name: string; quantity: number }[]`

## Usage Example

### Scenario: Transporting Electronics from China to Germany

1. **Select Route**: China → Germany
2. **Add Cargo**:
   - Electronics: 100 units
   - Machinery: 50 units
3. **Run Simulation**

**Result:**
- Cargo weight: (100 × unit_cost × 0.01) + (50 × unit_cost × 0.01)
- Optimal route might be: China [LAND] → Port → [SEA] → European Port → [LAND] → Germany
- Each leg has mode-specific costs adjusted by relevant factors
- Modal transfers add realistic handling costs

### War Impact Example

1. **Declare War**: USA vs Russia
2. **Factor Changes**:
   - Border Tension: 0.0 → -1.0
   - Diplomatic Alignment: 0.3 → -1.0
   - Cyber Threat: 0.1 → -0.9

3. **Route Impact**:
   - Land routes through border: +25% cost, +12% risk
   - All routes: Global pressure increases costs
   - Risk multiplier dramatically increases

## Testing Recommendations

### 1. Basic Functionality
- Add multiple commodities to cargo manifest
- Run simulation and verify cargo weight affects costs
- Check that factor breakdown appears with visual bars

### 2. Multi-Modal Routing
- Test routes that might benefit from modal switches
- Verify transfer costs appear in breakdown
- Check modal_sequence tracking

### 3. War Scenario
- Declare war between two countries
- Verify factors set to extreme negatives
- Run simulation and confirm costs/risks spike
- Check factor breakdown shows red pressure bars

### 4. Factor Transparency
- Modify individual factors
- Run simulation
- Verify factor breakdown updates correctly
- Check that mode-specific sensitivities apply

## Technical Notes

### Cargo Weight Formula
```python
cargo_weight = sum(
    item.get("quantity", 1) * 
    commodities_db.get(item.get("name", ""), {}).get("unit_cost", 1) * 
    0.01
    for item in cargo_manifest
)
cargo_weight = max(1.0, cargo_weight)  # Minimum weight of 1
```

### Route Entity Metric Calculation
```python
route_metrics = compute_route_entity_metrics(
    origin, destination,
    base_cost, base_time, base_risk,
    leg_mode, factors, cargo_weight
)
# Returns: {adjusted_cost, adjusted_time, adjusted_risk}
```

### Modal Sequence Tracking
```python
# Example output:
modal_sequence = ["land", "sea", "land"]
# Means: Start land → switch to sea → switch to land
```

## Future Enhancements

### Potential Improvements
1. **Visual Route Map**: Show modal transfers on map with icons
2. **Transfer Node Details**: Display exact transfer locations and costs
3. **Cargo Types**: Different cargo types (perishable, hazardous) with special handling
4. **Dynamic Pricing**: Time-of-day or seasonal pricing adjustments
5. **Multi-Stop Routes**: Support for waypoints and intermediate stops
6. **Capacity Constraints**: Limit cargo based on available capacity
7. **Insurance Costs**: Add insurance based on cargo value and risk

### Performance Optimizations
1. **Route Caching**: Cache frequently used routes
2. **Partial Updates**: Only recalculate affected route segments when factors change
3. **Graph Preprocessing**: Pre-compute modal transfer nodes

## Conclusion

The system now provides:
- ✅ Realistic multi-modal routing with transfer costs
- ✅ Route entity metrics responding to factor changes
- ✅ Cargo manifest with weight-based cost scaling
- ✅ Factor breakdown visualization for transparency
- ✅ War properly impacts factors and costs
- ✅ Mode-specific factor sensitivity

All components are integrated and ready for testing. The simulator now behaves like a realistic trading system with accurate economic modeling.
