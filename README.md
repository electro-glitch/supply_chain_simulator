# Supply Chain Simulator

A sophisticated full-stack web application for simulating complex global supply chain routes with real-time geopolitical factors, multi-modal transport optimization, and strategic game theory analysis.

## 🌟 Features

### Core Simulation Engine
- **Multi-Modal Routing**: Optimizes routes using land, sea, and air transport with realistic transfer costs
- **Three Route Options**: Generates cheapest, fastest, and most secure route alternatives
- **Hybrid Path Finding**: Automatically finds indirect routes when no direct connection exists
- **Geopolitical Factors**: 12 dynamic global factors affecting costs, times, and risks:
  - Cyber Threat Level
  - Diplomatic Alignment
  - Border Tension Pressure
  - Maritime Security Index
  - Energy Price Shock
  - Currency Instability
  - Debt Distress Signal
  - Climate Disruption
  - Innovation Subsidy
  - Regulatory Burden
  - Supply Chain Capacity
  - Conflict Proximity

### Geopolitical Actions
- **Tariff Application**: Increases route costs (affects Border Tension & Currency Instability factors)
- **Risk Modification**: Adjusts security threats (affects Maritime Security & Cyber Threat factors)
- **Subsidies**: Reduces costs and risks (affects Innovation Subsidy & Supply Chain Capacity)
- **Sanctions**: Spike costs and political risk (affects Diplomatic Alignment & Debt Distress)
- **Infrastructure Disruption**: Add delays to specific routes
- **Fast-Track Customs**: Reduce clearance times
- **War Declaration**: Complete route severance

### Advanced Features
- **Cargo Weight Modeling**: Logarithmic scaling based on commodity value (1-10x multiplier)
- **Auto-Rerun System**: Automatically re-simulates when factors or routes change
- **Strategic Outlook**: Game theory analysis with Nash equilibrium calculations
- **Alliance & Treaty System**: Track diplomatic relationships between countries
- **Multi-Leg Sourcing**: Automatically sources commodities from producer countries
- **Real-Time Factor Impacts**: Live visualization of factor contributions and multipliers

### User Interface
- Interactive map-based route visualization
- Country and commodity management
- Real-time factor tuning with slider controls
- Route comparison between three optimization strategies
- Detailed cost/time/risk breakdowns per route segment
- Geopolitical action history tracking

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with Uvicorn ASGI server
- **Routing Engines**: 
  - `hybrid_routing_engine.py`: Multi-modal pathfinding with NetworkX
  - `routing_engine.py`: Traditional cheapest path algorithms
  - `game_theory_engine.py`: Strategic analysis and factor impact calculations
  - `scenario_engine.py`: Main orchestrator for multi-leg simulations
- **Managers**: Data access layer for countries, routes, factors, commodities, geopolitics
- **Database**: JSON file storage (routes.json, countries.json, factors.json, etc.)

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand stores (countries, routes, factors, geopolitics, memory)
- **Styling**: TailwindCSS with custom gradient designs
- **UI Components**: Custom-built simulation interface with real-time updates

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **Git** (to clone the repository)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/electro-glitch/supply_chain_simulator.git
cd supply_chain_simulator
```

2. **Backend Setup**
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn networkx pydantic

# Run the backend server
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://127.0.0.1:8000`

3. **Frontend Setup** (in a new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Quick Start Commands

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 📁 Project Structure

```
supply_chain_simulator/
├── backend/
│   ├── main.py                      # FastAPI application entry point
│   ├── database/
│   │   ├── routes.json              # Route definitions (cost, time, risk, mode)
│   │   ├── countries.json           # Country data with production capabilities
│   │   ├── commodities.json         # Commodity pricing and metadata
│   │   ├── factors.json             # Global factor effects and strengths
│   │   ├── alliances.json           # Diplomatic alliances
│   │   └── treaties.json            # Trade treaties
│   ├── managers/
│   │   ├── network_manager.py       # Graph construction from routes
│   │   ├── route_manager.py         # Route CRUD operations
│   │   ├── factors_manager.py       # Factor CRUD operations
│   │   ├── geopolitics_manager.py   # Geopolitical actions (tariffs, sanctions, etc.)
│   │   └── ...
│   ├── simulation/
│   │   ├── scenario_engine.py       # Main simulation orchestrator
│   │   ├── hybrid_routing_engine.py # Multi-modal optimization engine
│   │   ├── routing_engine.py        # Traditional pathfinding
│   │   └── game_theory_engine.py    # Factor impacts & strategic analysis
│   └── utils/
│       ├── helpers.py               # Utility functions
│       └── mode_profiles.py         # Transport mode characteristics
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Simulation/SimulationPage.tsx   # Main simulation interface
│   │   │   ├── Factors/FactorsPage.tsx         # Factor management
│   │   │   ├── Countries/CountriesPage.tsx     # Country management
│   │   │   ├── Geopolitics/GeopoliticsPage.tsx # Geopolitical actions
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── RouteGeopoliticsControls.tsx    # Route-specific controls
│   │   ├── store/
│   │   │   ├── factorsStore.ts      # Global factors state
│   │   │   ├── routesStore.ts       # Routes state
│   │   │   ├── countriesStore.ts    # Countries state
│   │   │   └── geopoliticsStore.ts  # Geopolitical actions history
│   │   ├── lib/
│   │   │   └── api.ts               # Backend API client
│   │   └── types/                   # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── FACTOR_TESTING_GUIDE.md          # Guide for testing factor system
├── HYBRID_ROUTING_IMPLEMENTATION.md # Routing engine documentation
└── INTEGRATION.md                   # Integration documentation
```

## 🎮 Usage

### Running a Simulation

1. **Configure Source & Destination**: Select countries from the dropdowns
2. **Add Commodities**: Choose cargo to transport (affects weight/cost multipliers)
3. **Adjust Parameters** (optional):
   - Rounds: Game theory iterations (default: 6)
   - Discount: Future value discount factor (default: 0.92)
   - Shock: Supply disruption probability (default: 0.12)
   - Aggression: Conflict escalation factor (default: 0.35)
4. **Run Simulation**: Click "Run Strategic Simulation"
5. **View Results**: Compare three route options (cheapest, fastest, most secure)

### Applying Geopolitical Actions

1. Navigate to **Geopolitics** page or use **Route Geopolitics Controls** in simulation
2. Select source and destination countries
3. Choose an action (Tariff, Sanction, Subsidy, etc.)
4. Adjust the value slider
5. Action automatically:
   - Modifies routes.json (direct cost/time/risk changes)
   - Updates factors.json (global factor effects)
   - Triggers simulation auto-rerun

### Adjusting Global Factors

1. Navigate to **Factors** page
2. Adjust **Effect** slider (-1.0 to +1.0): Negative = penalties, Positive = benefits
3. Adjust **Strength** slider (0.0 to 1.0): How much the factor influences the simulation
4. Changes auto-save and trigger simulation rerun

## ⚠️ Known Issues & Limitations

### Current Limitations

1. **No Direct Route Handling**: When adjusting geopolitical controls in the Simulation page, if no direct route exists between source and destination, you'll see 404 errors. The system now applies changes to ALL segments in the indirect path, but the UI doesn't clearly indicate this.

2. **Route Options May Be Identical**: Sometimes all three route options (cheapest/fastest/secure) return the same path if there's only one viable route between countries.

3. **No Persistent Database**: All data is stored in JSON files. Changes are not version-controlled, so git pulls will overwrite local modifications.

4. **Limited Error Messages**: Some backend errors don't surface clearly in the frontend UI.

5. **No Authentication**: The application has no user authentication or multi-tenancy support.

6. **Static Country Data**: Country production capabilities are hardcoded and don't update dynamically based on geopolitical actions.

### Partially Implemented Features

- **War Declaration**: Removes routes but doesn't fully implement conflict cascades
- **Alliance System**: Tracked but not fully integrated into routing decisions
- **Treaty System**: Stored but not actively affecting trade calculations
- **Historical Tracking**: Geopolitical actions are logged but not visualized over time

### Performance Notes

- Large cargo manifests (10+ commodities) may cause slower simulations
- Complex multi-leg routes (5+ segments) can take 2-3 seconds to calculate
- Factor changes trigger debounced reruns (800ms delay) to avoid excessive calculations

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Test factor math
python test_factor_math.py

# Test factor sensitivity
python test_factor_sensitivity.py

# Test game theory variations
python test_game_theory_variation.py

# Check factor consistency
python check_factors.py
```

### Manual Testing
- Use FACTOR_TESTING_GUIDE.md for systematic factor testing
- Test geopolitical actions on different country pairs
- Verify route changes persist across page refreshes

## 🔧 Configuration

### Backend Configuration
- **Port**: Default 8000 (change in `uvicorn` command)
- **CORS**: Enabled for `http://localhost:5173`
- **File Paths**: Relative to `backend/database/`

### Frontend Configuration
- **API URL**: `http://127.0.0.1:8000` (hardcoded in `src/lib/api.ts`)
- **Port**: Default 5173 (Vite default)

## 📊 API Endpoints

### Core Simulation
- `POST /simulate` - Run simulation with three route options

### Data Management
- `GET/POST/DELETE /countries` - Country CRUD
- `GET/POST/DELETE /commodities` - Commodity CRUD
- `GET/POST/DELETE /routes` - Route CRUD
- `GET/PUT /factors/{name}` - Factor management
- `GET /factors/metrics` - Current factor impact calculations

### Geopolitics
- `POST /geo/tariff` - Apply tariff between countries
- `POST /geo/risk` - Modify security risk
- `POST /geo/subsidy` - Grant subsidy
- `POST /geo/sanction` - Impose sanction
- `POST /geo/war` - Declare war
- `POST /geo/peace` - Broker peace
- `POST /geo/infrastructure` - Disrupt infrastructure
- `POST /geo/customs` - Fast-track customs

### Analysis
- `GET /alliances` - List alliances
- `GET /treaties` - List treaties
- `GET /graph` - Get route network graph

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- `FACTOR_TESTING_GUIDE.md` - Comprehensive guide to testing the 12-factor system
- `HYBRID_ROUTING_IMPLEMENTATION.md` - Details on multi-modal routing engine
- `INTEGRATION.md` - Integration patterns and data flow

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NetworkX for graph algorithms
- FastAPI for the high-performance backend
- React and Vite for the modern frontend stack
- TailwindCSS for rapid UI development

## 🐛 Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed: `python --version`
- Check if port 8000 is available: `netstat -ano | findstr :8000`
- Verify all dependencies are installed: `pip list`

### Frontend won't connect to backend
- Confirm backend is running at `http://127.0.0.1:8000`
- Check browser console for CORS errors
- Verify API_URL in `frontend/src/lib/api.ts`

### Simulation returns 404
- Ensure source and destination countries exist in routes.json
- Check if a path exists between countries (direct or indirect)
- Verify cargo manifest commodities exist in commodities.json

### Factors not updating
- Check browser console for errors
- Verify factorsStore is being called
- Ensure factors.json is writable

### Geopolitical actions failing
- Verify a route path exists between countries (direct or indirect)
- Check backend terminal for detailed error messages
- Ensure routes.json is writable

---

**Current Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintainer**: tnk

For questions or issues, please open an issue on GitHub.
