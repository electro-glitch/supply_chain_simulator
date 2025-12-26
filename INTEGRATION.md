# Supply Chain Simulator - Integration Guide

## Overview
The frontend and backend are now fully integrated. The application allows you to manage countries, commodities, routes, factors, geopolitics, and run supply chain simulations.

## Architecture

### Backend (FastAPI)
- **Port**: 8000
- **Base URL**: http://127.0.0.1:8000
- **Location**: `c:\supply_chain_simulator\backend`

### Frontend (React + Vite)
- **Port**: 5173 (default Vite port)
- **Location**: `c:\supply_chain_simulator\frontend`

## Available Features

### 1. Dashboard
- Overview of all system data
- Statistics: Countries, Commodities, Routes, Network metrics
- Reset database to defaults (restores the curated 30-country / 30-commodity baseline)

### 2. Countries
- View all countries (30 major economies seeded by default)
- Add new countries
- Edit existing countries
- Delete countries
- Configure: name, demand, production, inflation

### 3. Commodities
- View all commodities (30 staple goods seeded by default, from gold/oil/steel to agri staples)
- Add new commodities with unit cost
- List all available commodities

### 4. Factors
- Add custom factors (JSON format)
- View and delete factors
- Flexible data structure

### 5. Routes
- Managed through the backend database
- Accessible via API: GET /routes, POST /routes, DELETE /routes/{origin}/{destination}

### 6. Geopolitics
- Declare war between countries
- Apply tariffs between countries
- Modify risk factors for routes

### 7. Simulation
- Run supply chain simulations between any two countries
- View optimal route path
- See detailed breakdown: cost, time, risk
- Visual path representation

### 8. Strategic Game Theory Layer
- Alliances and treaties now influence every scenario
- Adjustable parameters (discount factor, aggression, negotiation rounds, external shock)
- payoff matrices, cooperation likelihood, treaty break risk, stability/ escalation indices
- Reference panels list every alliance/treaty stored in the backend database

## API Endpoints

### Countries
- `GET /countries` - Get all countries
- `POST /countries` - Add a country
- `DELETE /countries/{name}` - Delete a country

### Commodities
- `GET /commodities` - Get all commodities
- `POST /commodities` - Add a commodity

### Routes
- `GET /routes` - Get all routes
- `POST /routes` - Add a route
- `DELETE /routes/{origin}/{destination}` - Delete a route

### Factors
- `GET /factors` - Get all factors
- `POST /factors` - Add a factor
- `DELETE /factors/{name}` - Delete a factor

### Geopolitics
- `POST /geo/war` - Declare war (body: {a, b})
- `POST /geo/tariff` - Apply tariff (body: {a, b, percent})
- `POST /geo/risk` - Modify risk (body: {a, b, delta})

### Alliances
- `GET /alliances` - Retrieve all defined alliances
- `POST /alliances` - Add/overwrite an alliance (body: {name, members, cohesion, support_multiplier, deterrence})
- `DELETE /alliances/{name}` - Remove an alliance

### Treaties
- `GET /treaties` - Retrieve all bilateral treaties
- `POST /treaties` - Add/overwrite a treaty (body: {name, parties, stability, enforcement, breach_history})
- `DELETE /treaties/{name}` - Remove a treaty

### Simulation
- `POST /simulate` - Run full simulation (body: {src, dst, parameters?})
   - `parameters.rounds` (int) negotiation rounds, default 6
   - `parameters.discount` (float) repeated-game discount, default 0.92
   - `parameters.shock` (float) exogenous disruption intensity, default 0.12
   - `parameters.aggression` (float) temptation bias, default 0.35

### System
- `GET /graph` - Get network graph data
- `POST /reset` - Reset database to defaults

## Running the Application

### Backend
```powershell
cd c:\supply_chain_simulator\backend
python -m uvicorn main:app --reload
```

The backend should be running on http://127.0.0.1:8000

### Frontend
```powershell
cd c:\supply_chain_simulator\frontend
npm run dev
```

The frontend should be running on http://localhost:5173

## Data Flow

1. Frontend makes HTTP requests to backend API
2. Backend manages JSON files in `backend/database/`
3. Changes are persisted to disk
4. Default data is stored in `backend/database/defaults/`
5. Reset operation copies defaults over current data

## Store Architecture (Frontend)

The frontend uses Zustand for state management with these stores:

- **countriesStore** - Manages country data
- **commoditiesStore** - Manages commodity data  
- **routesStore** - Manages route data
- **factorsStore** - Manages factor data
- **globalStore** - Legacy store for initial data loading

## Key Components

### Pages
- `DashboardPage` - Overview and statistics
- `CountriesPage` - Country management with drawer UI
- `CommoditiesPage` - Commodity list and addition
- `FactorsPage` - Factor management
- `GeopoliticsPage` - Geopolitical actions
- `SimulationPage` - Run and visualize simulations

### Types
- `Country` - Country entity
- `Commodity` - Commodity entity
- `Route` - Route entity with cost, time, risk
- `Factor` - Custom factor entity
- `SimulationResult` - Simulation output
- `Graph` - Network graph structure

## Testing the Integration

1. Start the backend server
2. Start the frontend development server
3. Navigate to http://localhost:5173
4. Try these actions:
   - View dashboard statistics
   - Add a new country
   - Add a new commodity
   - Run a simulation between two countries (adjust the strategic sliders to observe game-theory output changes)
   - Inspect alliance/treaty reference sections and confirm they match `backend/database/alliances.json` and `treaties.json`
   - Apply a geopolitical action (war, tariff, risk)
   - Reset the database (restores alliances/treaties as well as the 30-country and 30-commodity baselines)

## Troubleshooting

### CORS Issues
The backend has CORS enabled for all origins. If you still face issues, check that the backend is running on port 8000.

### API Connection
Verify the backend URL in `frontend/src/lib/api.ts` is set to `http://127.0.0.1:8000`

### Missing Data
Use the "Reset to Defaults" button on the dashboard to restore default data.

## Next Steps

Potential enhancements:
1. Add route management UI
2. Add data visualization charts
3. Implement authentication
4. Add export/import functionality
5. Add more complex simulation scenarios
6. Implement real-time updates with WebSockets
