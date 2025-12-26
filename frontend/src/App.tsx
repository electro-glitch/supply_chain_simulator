import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CountriesPage from "./pages/Countries/CountriesPage";
import CommoditiesPage from "./pages/Commodities/CommoditiesPage";
import GeopoliticsPage from "./pages/Geopolitics/GeopoliticsPage";
import SimulationPage from "./pages/Simulation/SimulationPage";
import AtlasPage from "./pages/Atlas/AtlasPage";

export default function App() {
  return (
    <Router>
      <div className="relative flex min-h-screen w-screen items-stretch gap-6 overflow-hidden bg-transparent px-4 py-6 text-slate-100 sm:px-8">
        <Sidebar />
        <div className="flex-1">
          <div className="glass-panel h-full min-h-[82vh] overflow-y-auto rounded-3xl border border-white/10 p-6 shadow-[0_40px_120px_rgba(1,5,25,0.55)] sm:p-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/countries" element={<CountriesPage />} />
              <Route path="/commodities" element={<CommoditiesPage />} />
              <Route path="/geopolitics" element={<GeopoliticsPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/atlas" element={<AtlasPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
