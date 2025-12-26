import { useState } from "react";
import { Skull, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import { useFactorsStore } from "../store/factorsStore";
import { useRoutesStore } from "../store/routesStore";

interface RouteGeopoliticsControlsProps {
  source: string;
  destination: string;
  onAdjustment: () => void;
}

export function RouteGeopoliticsControls({ source, destination, onAdjustment }: RouteGeopoliticsControlsProps) {
  const [tariff, setTariff] = useState(0);
  const [risk, setRisk] = useState(0);
  const [subsidy, setSubsidy] = useState(0);
  const [delay, setDelay] = useState(0);
  const [customs, setCustoms] = useState(0);
  const { fetchFactors } = useFactorsStore();
  const { fetchRoutes } = useRoutesStore();

  const handleAdjustment = async (apiCall: Promise<any>) => {
    try {
      await apiCall;
      // Refresh both routes and factors after geopolitical action
      // Routes.json is modified (cost/time/risk changes)
      // Factors.json is modified (global factor updates)
      await Promise.all([fetchRoutes(), fetchFactors()]);
      // Trigger callback after data is refreshed
      onAdjustment();
    } catch (err) {
      console.error("Geopolitical action failed:", err);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/30 p-6 shadow-2xl shadow-purple-500/20">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-purple-500/30 p-3">
          <Skull className="h-8 w-8 text-purple-200" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-purple-100">🎮 Dynamic Risk Adjustments</h3>
          <p className="mt-1 text-sm text-purple-200/70">
            Adjust geopolitical factors for this route. Changes will automatically re-run the simulation with updated parameters.
          </p>
          
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-purple-400/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-100">Tariff Impact</p>
                <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-200">+{tariff}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tariff}
                className="mt-3 w-full"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setTariff(value);
                  handleAdjustment(api.applyTariff(source, destination, value));
                }}
              />
              <p className="mt-2 text-xs text-purple-300/60">Increase costs via tariffs</p>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-100">Security Risk</p>
                <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs text-rose-200">+{risk.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={risk}
                className="mt-3 w-full"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setRisk(value);
                  handleAdjustment(api.modifyRisk(source, destination, value));
                }}
              />
              <p className="mt-2 text-xs text-purple-300/60">Add security threats</p>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-100">Subsidy</p>
                <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">-{subsidy}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={subsidy}
                className="mt-3 w-full"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSubsidy(value);
                  handleAdjustment(api.grantSubsidy(source, destination, value));
                }}
              />
              <p className="mt-2 text-xs text-purple-300/60">Reduce costs via subsidy</p>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-100">Infrastructure Delay</p>
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200">+{delay}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="4"
                value={delay}
                className="mt-3 w-full"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setDelay(value);
                  handleAdjustment(api.disruptInfrastructure(source, destination, value));
                }}
              />
              <p className="mt-2 text-xs text-purple-300/60">Delay via disruption</p>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-100">Customs Speed</p>
                <span className="rounded-full bg-sky-500/20 px-2 py-1 text-xs text-sky-200">-{customs}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={customs}
                className="mt-3 w-full"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCustoms(value);
                  handleAdjustment(api.fastTrackCustoms(source, destination, value));
                }}
              />
              <p className="mt-2 text-xs text-purple-300/60">Fast-track clearance</p>
            </div>

            <div className="rounded-xl border border-rose-400/20 bg-black/20 p-4">
              <button
                className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:from-rose-600 hover:to-red-700"
                onClick={() => {
                  handleAdjustment(api.declareWar(source, destination));
                }}
              >
                ⚔️ Declare War
              </button>
              <p className="mt-2 text-xs text-rose-300/60">Maximum factor impact</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-200">
              💡 <strong>Auto-Rerun Enabled:</strong> Adjusting any control above will automatically re-run the simulation with updated factors. Watch costs and risks change in real-time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
