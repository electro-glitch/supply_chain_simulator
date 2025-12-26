import { useCallback, useEffect, useMemo, useState } from "react";
import { useCountriesStore } from "../../store/countriesStore";
import { useCommoditiesStore } from "../../store/commoditiesStore";
import { api } from "../../lib/api";
import { SimulationResult, SimulationParameters } from "../../types/Simulation";
import { RouteMode } from "../../types/Route";
import { Alliance } from "../../types/Alliance";
import { Treaty } from "../../types/Treaty";
import { AlertTriangle, ArrowRight, Repeat, Shield, Skull, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemoryStore } from "../../store/memoryStore";
import type { FactorImpacts } from "../../types/Factor";
import { useRoutesStore } from "../../store/routesStore";
import { useFactorsStore } from "../../store/factorsStore";
import { RouteGeopoliticsControls } from "../../components/RouteGeopoliticsControls";

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

type ToastState = { text: string; tone: "success" | "error" } | null;

type ModeChoice = {
  key: RouteMode | "auto";
  label: string;
  description: string;
  highlights: { label: string; value: string }[];
};

type ModeFactorBlueprint = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  run: (origin: string, destination: string, payload: number) => Promise<void>;
};

const MODE_CHOICES: ModeChoice[] = [
  {
    key: "auto",
    label: "Auto Blend",
    description: "Let the solver mix every corridor for the best combined payoff",
    highlights: [
      { label: "Cost", value: "Optimized" },
      { label: "Speed", value: "Adaptive" },
      { label: "Risk", value: "Balanced" },
    ],
  },
  {
    key: "land",
    label: "Land Corridor",
    description: "Rail, trucking, and pipeline networks across continents",
    highlights: [
      { label: "Cost", value: "Low" },
      { label: "Speed", value: "Medium" },
      { label: "Risk", value: "Border ops" },
    ],
  },
  {
    key: "sea",
    label: "Sea Lane",
    description: "Global blue-water container routes",
    highlights: [
      { label: "Cost", value: "Scale" },
      { label: "Speed", value: "Slow" },
      { label: "Risk", value: "Storms" },
    ],
  },
  {
    key: "air",
    label: "Air Lift",
    description: "Express aviation for critical cargo",
    highlights: [
      { label: "Cost", value: "High" },
      { label: "Speed", value: "Fast" },
      { label: "Risk", value: "Airspace" },
    ],
  },
];

const MODE_FACTOR_BLUEPRINTS: Record<RouteMode, ModeFactorBlueprint[]> = {
  land: [
    {
      id: "rail-sabotage",
      key: "rail_sabotage",
      title: "Rail Sabotage",
      description: "Simulate damaged rail bridges to spike transit time",
      icon: Skull,
      defaultValue: 12,
      min: 0,
      max: 48,
      step: 4,
      suffix: "hrs",
      run: (origin, destination, hours) => api.disruptInfrastructure(origin, destination, hours),
    },
    {
      id: "convoy-escort",
      key: "convoy_escort",
      title: "Convoy Escort",
      description: "Deploy armored escorts to temper ambush risk",
      icon: Shield,
      defaultValue: 0.1,
      min: 0,
      max: 0.4,
      step: 0.05,
      suffix: "Δrisk",
      run: (origin, destination, delta) => api.bolsterSecurity(origin, destination, delta),
    },
    {
      id: "customs-fast-track",
      key: "customs_fast_track",
      title: "Fast-Track Customs",
      description: "Shave wait times at land borders via emergency clearances",
      icon: ArrowRight,
      defaultValue: 6,
      min: 0,
      max: 24,
      step: 2,
      suffix: "hrs",
      run: (origin, destination, hours) => api.fastTrackCustoms(origin, destination, hours),
    },
  ],
  sea: [
    {
      id: "seasonal-storm",
      key: "seasonal_storm",
      title: "Seasonal Storm",
      description: "Introduce cyclones that slow blue-water lanes",
      icon: Waves,
      defaultValue: 35,
      min: 0,
      max: 100,
      step: 5,
      suffix: "%",
      run: (origin, destination, severity) => api.triggerStorm(origin, destination, severity),
    },
    {
      id: "pirate-activity",
      key: "pirate_activity",
      title: "Piracy Surge",
      description: "Increase pirate sightings to inflate insurance risk",
      icon: Skull,
      defaultValue: 40,
      min: 0,
      max: 100,
      step: 5,
      suffix: "%",
      run: (origin, destination, severity) => api.reportPirates(origin, destination, severity),
    },
    {
      id: "naval-escort",
      key: "naval_escort",
      title: "Naval Escort",
      description: "Deploy escorts to stabilize contested sea lanes",
      icon: Shield,
      defaultValue: 0.12,
      min: 0,
      max: 0.35,
      step: 0.01,
      suffix: "Δrisk",
      run: (origin, destination, delta) => api.bolsterSecurity(origin, destination, delta),
    },
  ],
  air: [
    {
      id: "airspace-restriction",
      key: "airspace_restriction",
      title: "Airspace Restriction",
      description: "Impose diversions or no-fly zones above the corridor",
      icon: AlertTriangle,
      defaultValue: 0.15,
      min: 0,
      max: 0.5,
      step: 0.05,
      suffix: "Δrisk",
      run: (origin, destination, delta) => api.modifyRisk(origin, destination, delta),
    },
    {
      id: "cyber-attack",
      key: "cyber_attack",
      title: "Cyber Sabotage",
      description: "Simulate airport cyber attacks delaying departures",
      icon: Skull,
      defaultValue: 0.2,
      min: 0,
      max: 0.6,
      step: 0.05,
      suffix: "Δrisk",
      run: (origin, destination, delta) => api.launchCyberAttack(origin, destination, delta),
    },
    {
      id: "rapid-clearance",
      key: "rapid_clearance",
      title: "Rapid Clearance",
      description: "Expedite security and customs to shave airborne hours",
      icon: Repeat,
      defaultValue: 4,
      min: 0,
      max: 18,
      step: 1,
      suffix: "hrs",
      run: (origin, destination, hours) => api.fastTrackCustoms(origin, destination, hours),
    },
  ],
};

const ROUTE_MODE_TILES: { key: RouteMode; label: string; detail: string; badge: string }[] = [
  {
    key: "land",
    label: "Land",
    detail: "Rail & convoy networks",
    badge: "Cheapest overland",
  },
  {
    key: "sea",
    label: "Sea",
    detail: "Containerized blue water",
    badge: "Scale + storms",
  },
  {
    key: "air",
    label: "Air",
    detail: "Express lift",
    badge: "Fastest, highest cost",
  },
];

export default function SimulationPage() {
  const { countries, fetchCountries } = useCountriesStore();
  const { commodities, fetchCommodities } = useCommoditiesStore();
  const routes = useRoutesStore((state) => state.routes);
  const fetchRoutes = useRoutesStore((state) => state.fetchRoutes);
  const routesLoading = useRoutesStore((state) => state.loading);
  const routesError = useRoutesStore((state) => state.error);
  const routesLastUpdated = useRoutesStore((state) => state.lastUpdated);
  const factorsStore = useFactorsStore();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [cargoManifest, setCargoManifest] = useState<Array<{name: string; quantity: number}>>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [allRouteOptions, setAllRouteOptions] = useState<{cheapest?: SimulationResult; fastest?: SimulationResult; most_secure?: SimulationResult} | null>(null);
  const [selectedRouteOption, setSelectedRouteOption] = useState<"cheapest" | "fastest" | "most_secure">("cheapest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [treaties, setTreaties] = useState<Treaty[]>([]);
  const [parameters, setParameters] = useState<SimulationParameters>(
    {
      rounds: 6,
      discount: 0.92,
      shock: 0.12,
      aggression: 0.35,
    }
  );
  const { rememberSimulation, lastFactorUpdateAt } = useMemoryStore();
  const [modePreference, setModePreference] = useState<RouteMode | "auto">("auto");
  const [hasRunSimulation, setHasRunSimulation] = useState(false);
  const [syncedFactorStamp, setSyncedFactorStamp] = useState<number | null>(null);
  const [syncedRouteStamp, setSyncedRouteStamp] = useState<number | null>(null);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);
  const [routeToast, setRouteToast] = useState<ToastState>(null);
  const [modeLoading, setModeLoading] = useState<RouteMode | null>(null);
  const [factorControls, setFactorControls] = useState<Record<string, number>>({});
  const [factorLoading, setFactorLoading] = useState<string | null>(null);
  const [liveFactorImpacts, setLiveFactorImpacts] = useState<FactorImpacts | null>(null);
  const [autoRerunNotice, setAutoRerunNotice] = useState(false);
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);
  const [allFactors, setAllFactors] = useState<Array<{name: string; effect: number; strength: number}>>([]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    fetchCommodities();
  }, [fetchCommodities]);

  useEffect(() => {
    const loadAllFactors = async () => {
      try {
        const factorsData = await api.getFactors();
        const factorsArray = Object.entries(factorsData).map(([name, data]: [string, any]) => ({
          name,
          effect: data.effect,
          strength: data.strength
        }));
        setAllFactors(factorsArray);
        // Also refresh metrics
        await refreshFactorMetrics();
      } catch (err) {
        console.error("Failed to load all factors", err);
      }
    };
    loadAllFactors();
  }, []);
  
  // Refresh factors when Advanced Tuning is opened
  useEffect(() => {
    if (showAdvancedTuning) {
      const reloadFactors = async () => {
        try {
          const factorsData = await api.getFactors();
          const factorsArray = Object.entries(factorsData).map(([name, data]: [string, any]) => ({
            name,
            effect: data.effect,
            strength: data.strength
          }));
          setAllFactors(factorsArray);
        } catch (err) {
          console.error("Failed to reload factors", err);
        }
      };
      reloadFactors();
    }
  }, [showAdvancedTuning]);

  const updateFactorInBackend = async (name: string, effect: number, strength: number) => {
    try {
      // Use the store's updateFactor which will also fetch updated factors
      await factorsStore.updateFactor(name, { effect, strength });
      useMemoryStore.getState().markFactorUpdate();
      
      // Reload allFactors to sync with slider display
      const factorsData = await api.getFactors();
      const factorsArray = Object.entries(factorsData).map(([fname, data]: [string, any]) => ({
        name: fname,
        effect: data.effect,
        strength: data.strength
      }));
      setAllFactors(factorsArray);
      
      // Refresh factor metrics
      await refreshFactorMetrics();
      
      // The auto-rerun will be triggered by the useEffect watching factorsStore.factors
      setAutoRerunNotice(true);
      setTimeout(() => setAutoRerunNotice(false), 2000);
    } catch (err) {
      console.error("Failed to update factor", err);
    }
  };

  const refreshFactorMetrics = useCallback(async () => {
    try {
      const payload = await api.getFactorMetrics();
      setLiveFactorImpacts(payload.impacts);
    } catch (err) {
      console.error("Failed to load factor metrics", err);
    }
  }, []);

  useEffect(() => {
    refreshFactorMetrics();
  }, [refreshFactorMetrics]);

  useEffect(() => {
    if (lastFactorUpdateAt) {
      refreshFactorMetrics();
    }
  }, [lastFactorUpdateAt, refreshFactorMetrics]);

  const currentRoute = source && destination ? routes[source]?.[destination] : undefined;
  const currentRouteMode = (currentRoute?.mode ?? undefined) as RouteMode | undefined;



  useEffect(() => {
    const hydrateReferenceData = async () => {
      try {
        const [alliancesData, treatiesData] = await Promise.all([
          api.getAlliances(),
          api.getTreaties(),
        ]);
        setAlliances(alliancesData);
        setTreaties(treatiesData);
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    };
    hydrateReferenceData();
  }, []);

  const updateParameter = (key: keyof SimulationParameters, val: number) => {
    setParameters((prev) => ({ ...prev, [key]: val }));
  };

  const baselineTotals = result?.baseline_totals;
  const factorImpacts = result?.factor_impacts ?? result?.game_theory?.factors?.impacts;
  const factorLedger = result?.game_theory?.factors?.records ?? [];
  const currentFactorImpacts = liveFactorImpacts ?? factorImpacts;

  const modeFactorActions = useMemo(() => {
    if (!currentRouteMode || !source || !destination) {
      return [];
    }
    return (MODE_FACTOR_BLUEPRINTS[currentRouteMode] ?? []).map((blueprint) => ({
      ...blueprint,
      execute: (value: number) => blueprint.run(source, destination, value),
    }));
  }, [currentRouteMode, source, destination]);

  useEffect(() => {
    setFactorControls((prev) => {
      let changed = false;
      const next = { ...prev };
      modeFactorActions.forEach((action) => {
        if (next[action.key] === undefined) {
          next[action.key] = action.defaultValue;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [modeFactorActions]);

  const factorsData = useFactorsStore((state) => state.factors);
  const factorsLastUpdate = useFactorsStore((state) => state.factors);
  const fetchFactors = useFactorsStore((state) => state.fetchFactors);
  const updateFactor = useFactorsStore((state) => state.updateFactor);

  // Load all factors on mount
  useEffect(() => {
    const loadFactors = async () => {
      await fetchFactors();
      const factorsArray = Object.entries(factorsData).map(([name, factor]) => ({
        name,
        effect: factor.effect,
        strength: factor.strength,
      }));
      setAllFactors(factorsArray);
    };
    loadFactors();
  }, []);

  // Update allFactors when factorsData changes
  useEffect(() => {
    const factorsArray = Object.entries(factorsData).map(([name, factor]) => ({
      name,
      effect: factor.effect,
      strength: factor.strength,
    }));
    setAllFactors(factorsArray);
  }, [factorsData]);

  // Auto-rerun simulation when factors change (for persistent simulation)
  useEffect(() => {
    if (!hasRunSimulation || !source || !destination || loading) return;
    setAutoRerunNotice(true);
    const timer = setTimeout(() => {
      handleSimulate();
      setTimeout(() => setAutoRerunNotice(false), 3000);
    }, 1000); // 1 second debounce
    return () => clearTimeout(timer);
  }, [factorsData]);

  useEffect(() => {
    if (!hasRunSimulation) return;
    if (!syncedFactorStamp) return;
    if (lastFactorUpdateAt && lastFactorUpdateAt > syncedFactorStamp) {
      setResult(null);
      setStaleNotice("Factors changed since last run. Run the simulation again.");
    }
  }, [hasRunSimulation, lastFactorUpdateAt, syncedFactorStamp]);

  useEffect(() => {
    if (!hasRunSimulation) return;
    if (!syncedRouteStamp) return;
    if (routesLastUpdated && routesLastUpdated > syncedRouteStamp) {
      setResult(null);
      setStaleNotice("Routes changed since last run. Run the simulation again.");
    }
  }, [hasRunSimulation, routesLastUpdated, syncedRouteStamp]);

  // Watch for factor changes and auto-rerun simulation
  useEffect(() => {
    if (!hasRunSimulation || !source || !destination) return;
    const timer = setTimeout(() => {
      handleSimulate();
    }, 800);
    return () => clearTimeout(timer);
  }, [factorsStore.factors]);

  const handleSimulate = async () => {
    if (!source || !destination) {
      setError("Please select both source and destination");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.simulate({
        src: source,
        dst: destination,
        mode: "auto",
        parameters,
        cargo_manifest: cargoManifest.map(item => ({
          name: item.name,
          quantity: item.quantity
        })),
      });
      
      // Store all three route options
      setAllRouteOptions(data);
      
      // Set the default selected option (cheapest)
      const defaultOption = data.cheapest || data.fastest || data.most_secure;
      setResult(defaultOption);
      
      rememberSimulation(defaultOption);
      setHasRunSimulation(true);
      setSyncedFactorStamp(lastFactorUpdateAt ?? Date.now());
      setSyncedRouteStamp(routesLastUpdated ?? Date.now());
      if (defaultOption?.factor_impacts) {
        setLiveFactorImpacts(defaultOption.factor_impacts);
      }
      setStaleNotice(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRouteMode = async (mode: RouteMode) => {
    if (!source || !destination) {
      setRouteToast({ text: "Select source and destination first", tone: "error" });
      return;
    }
    setModeLoading(mode);
    setRouteToast(null);
    try {
      await api.setTradeRouteMode(source, destination, mode);
      await fetchRoutes();
      setRouteToast({ text: `${mode.toUpperCase()} corridor locked in`, tone: "success" });
    } catch (err) {
      console.error(err);
      setRouteToast({ text: "Failed to update trade modality", tone: "error" });
    } finally {
      setModeLoading(null);
    }
  };

  const handleModeFactorChange = (key: string, value: number) => {
    setFactorControls((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecuteModeFactor = async (actionId: string) => {
    const action = modeFactorActions.find((item) => item.id === actionId);
    if (!action) return;
    if (!source || !destination) {
      setRouteToast({ text: "Select source and destination first", tone: "error" });
      return;
    }
    const payload = factorControls[action.key] ?? action.defaultValue;
    setFactorLoading(action.id);
    setRouteToast(null);
    try {
      await action.execute(payload);
      await fetchRoutes();
      setRouteToast({
        text: `${action.title} applied at ${payload}${action.suffix ?? ""}`,
        tone: "success",
      });
    } catch (err) {
      console.error(err);
      setRouteToast({ text: `Failed to apply ${action.title}`, tone: "error" });
    } finally {
      setFactorLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-purple-950/30 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-pink-950/30 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300/60">⚡ Advanced Analytics Engine</p>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">Strategic Simulation Lab</h1>
          <p className="text-sm text-indigo-300/70">Real-time global trade route optimization with dynamic geopolitical modeling and hybrid multi-modal transport</p>
        </div>
      </div>

      {/* Auto-Rerun Notification */}
      {autoRerunNotice && (
        <div className="animate-pulse rounded-2xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-950/50 to-orange-950/40 p-4 shadow-xl shadow-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/30 p-2">
              <svg className="animate-spin h-5 w-5 text-amber-200" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-amber-100">🔄 Auto-Updating Simulation</p>
              <p className="text-sm text-amber-200/70">Geopolitical factors changed - recalculating optimal route...</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-purple-950/40 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">Scenario Configuration</h2>
            <p className="mt-1 text-sm text-indigo-300/70">Configure your supply chain simulation with source, destination, and cargo parameters</p>
          </div>
          <button
            onClick={handleSimulate}
            disabled={loading || !source || !destination}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-indigo-500/50 transition-all hover:shadow-indigo-500/70 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing Routes...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Run Strategic Simulation</span>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {staleNotice && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <div>
                <p className="font-semibold text-amber-100">Simulation results may be stale</p>
                <p className="text-amber-200/80">{staleNotice}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-indigo-200 uppercase tracking-wider">Source Country</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-3 w-full rounded-xl border-2 border-indigo-500/30 bg-indigo-950/30 px-4 py-3 text-white placeholder-indigo-400/50 shadow-lg shadow-indigo-500/10 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            >
              <option value="" className="bg-slate-900">Select source</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-purple-200 uppercase tracking-wider">Destination Country</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-3 w-full rounded-xl border-2 border-purple-500/30 bg-purple-950/30 px-4 py-3 text-white placeholder-purple-400/50 shadow-lg shadow-purple-500/10 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
            >
              <option value="" className="bg-slate-900">Select destination</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Commodity to Add</label>
            <div className="mt-2 flex gap-2">
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="flex-1 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-gray-100 focus:border-indigo-400 focus:outline-none"
              >
                <option value="">Select commodity</option>
                {Object.entries(commodities).map(([name, details]) => (
                  <option key={name} value={name}>
                    {name} (${details.unit_cost}/unit)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedCommodity && !cargoManifest.find(c => c.name === selectedCommodity)) {
                    setCargoManifest([...cargoManifest, { name: selectedCommodity, quantity: 100 }]);
                    setSelectedCommodity("");
                  }
                }}
                disabled={!selectedCommodity}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Cargo Manifest */}
        {cargoManifest.length > 0 && (
          <div className="mt-8 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-teal-950/30 p-6 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">📦 Cargo Manifest</h3>
                <p className="text-xs text-emerald-300/60 mt-1">{cargoManifest.length} commodity {cargoManifest.length === 1 ? 'type' : 'types'} configured</p>
              </div>
              <button
                onClick={() => setCargoManifest([])}
                className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30 transition"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cargoManifest.map((cargo, idx) => (
                <div key={idx} className="flex items-center gap-4 rounded-2xl border-2 border-emerald-500/20 bg-black/30 p-4 shadow-lg hover:border-emerald-400/40 transition">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-emerald-100">{cargo.name}</p>
                    <p className="text-sm text-emerald-300/60">Volume: {cargo.quantity.toLocaleString()} units</p>
                  </div>
                  <input
                    type="number"
                    value={cargo.quantity}
                    onChange={(e) => {
                      const updated = [...cargoManifest];
                      updated[idx].quantity = Math.max(1, Number(e.target.value));
                      setCargoManifest(updated);
                    }}
                    className="w-28 rounded-xl border-2 border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-center text-lg font-bold text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    min="1"
                  />
                  <button
                    onClick={() => setCargoManifest(cargoManifest.filter((_, i) => i !== idx))}
                    className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/40 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Tuning Section */}
        <div className="mt-8 rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-indigo-950/30 p-6 shadow-xl shadow-purple-500/10">
          <button
            onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
            className="w-full flex items-center justify-between rounded-2xl bg-black/30 p-4 hover:bg-black/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/30 p-2">
                <Shield className="h-6 w-6 text-purple-200" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">🔧 Advanced Tuning</h3>
                <p className="text-xs text-purple-300/60">12 global factors that dynamically shape routing costs, times, and risks</p>
              </div>
            </div>
            <div className={`transform transition-transform ${showAdvancedTuning ? "rotate-180" : ""}`}>
              <svg className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showAdvancedTuning && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allFactors.map((factor) => {
                  const isPositive = factor.effect > 0;
                  const isNegative = factor.effect < 0;
                  const isNeutral = factor.effect === 0;
                  
                  return (
                    <div key={factor.name} className="rounded-2xl border-2 border-purple-500/20 bg-black/30 p-5 hover:border-purple-400/40 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-purple-100">{factor.name}</p>
                          <p className="text-xs text-purple-300/60 mt-1">
                            {isPositive && "📈 Positive pressure · Increases costs/risks"}
                            {isNegative && "📉 Negative relief · Decreases costs/risks"}
                            {isNeutral && "⚖️ Neutral · No net impact"}
                          </p>
                        </div>
                        <div className={`rounded-lg px-3 py-1 text-xs font-bold ${
                          isPositive ? "bg-rose-500/20 text-rose-200" : 
                          isNegative ? "bg-emerald-500/20 text-emerald-200" : 
                          "bg-gray-500/20 text-gray-200"
                        }`}>
                          {factor.effect.toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Effect Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs uppercase tracking-wider text-purple-300/80">Effect Direction</label>
                            <span className="text-sm font-semibold text-purple-100">{factor.effect.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            value={factor.effect}
                            onChange={(e) => {
                              const newEffect = parseFloat(e.target.value);
                              const updatedFactors = allFactors.map((f) =>
                                f.name === factor.name ? { ...f, effect: newEffect } : f
                              );
                              setAllFactors(updatedFactors);
                            }}
                            onMouseUp={(e) => {
                                const newEffect = parseFloat((e.target as HTMLInputElement).value);
                                const latestStrength =
                                  allFactors.find((f) => f.name === factor.name)?.strength ?? factor.strength;
                                updateFactorInBackend(factor.name, newEffect, latestStrength);
                            }}
                            className="w-full h-2 bg-gradient-to-r from-emerald-500 via-gray-500 to-rose-500 rounded-full appearance-none cursor-pointer slider-thumb"
                          />
                          <div className="flex justify-between text-xs text-purple-300/60 mt-1">
                            <span>-1.0 Relief</span>
                            <span>0.0 Neutral</span>
                            <span>1.0 Pressure</span>
                          </div>
                        </div>

                        {/* Strength Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs uppercase tracking-wider text-purple-300/80">Strength Magnitude</label>
                            <span className="text-sm font-semibold text-purple-100">{factor.strength.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={factor.strength}
                            onChange={(e) => {
                              const newStrength = parseFloat(e.target.value);
                              const updatedFactors = allFactors.map((f) =>
                                f.name === factor.name ? { ...f, strength: newStrength } : f
                              );
                              setAllFactors(updatedFactors);
                            }}
                            onMouseUp={(e) => {
                                const newStrength = parseFloat((e.target as HTMLInputElement).value);
                                const latestEffect =
                                  allFactors.find((f) => f.name === factor.name)?.effect ?? factor.effect;
                                updateFactorInBackend(factor.name, latestEffect, newStrength);
                            }}
                            className="w-full h-2 bg-gradient-to-r from-gray-600 to-purple-500 rounded-full appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-purple-300/60 mt-1">
                            <span>0.0 Weak</span>
                            <span>1.0 Strong</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border-2 border-purple-400/30 bg-purple-500/10 p-4">
                <p className="text-sm text-purple-200/90">
                  💡 <strong>How factors work:</strong> Effect determines direction (-1 relief, 0 neutral, +1 pressure). 
                  Strength determines magnitude (0-1). Combined contribution = effect × strength. 
                  All 12 factors feed into cost, time, and risk multipliers that cascade through every route segment.
                </p>
              </div>
            </div>
          )}
        </div>





      </div>

      {result && (
        <div className="space-y-6">
          {/* Route Options Selector */}
          {allRouteOptions && (allRouteOptions.cheapest || allRouteOptions.fastest || allRouteOptions.most_secure) && (
            <div className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 to-teal-950/30 p-6 shadow-2xl shadow-emerald-500/20">
              <h3 className="text-xl font-bold text-emerald-100 mb-4">📊 Route Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allRouteOptions.cheapest && (
                  <button
                    onClick={() => {
                      setSelectedRouteOption("cheapest");
                      setResult(allRouteOptions.cheapest!);
                      if (allRouteOptions.cheapest?.factor_impacts) {
                        setLiveFactorImpacts(allRouteOptions.cheapest.factor_impacts);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRouteOption === "cheapest"
                        ? "border-emerald-400 bg-emerald-500/20"
                        : "border-emerald-400/20 bg-black/20 hover:bg-emerald-500/10"
                    }`}
                  >
                    <div className="text-3xl mb-2">💰</div>
                    <div className="font-bold text-emerald-100">Cheapest</div>
                    <div className="text-2xl font-bold text-white mt-2">${allRouteOptions.cheapest.total_cost.toFixed(2)}</div>
                    <div className="text-xs text-emerald-200/70 mt-1">{allRouteOptions.cheapest.total_time.toFixed(0)} hrs</div>
                  </button>
                )}
                {allRouteOptions.fastest && (
                  <button
                    onClick={() => {
                      setSelectedRouteOption("fastest");
                      setResult(allRouteOptions.fastest!);
                      if (allRouteOptions.fastest?.factor_impacts) {
                        setLiveFactorImpacts(allRouteOptions.fastest.factor_impacts);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRouteOption === "fastest"
                        ? "border-blue-400 bg-blue-500/20"
                        : "border-blue-400/20 bg-black/20 hover:bg-blue-500/10"
                    }`}
                  >
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-bold text-blue-100">Fastest</div>
                    <div className="text-2xl font-bold text-white mt-2">{allRouteOptions.fastest.total_time.toFixed(0)} hrs</div>
                    <div className="text-xs text-blue-200/70 mt-1">${allRouteOptions.fastest.total_cost.toFixed(2)}</div>
                  </button>
                )}
                {allRouteOptions.most_secure && (
                  <button
                    onClick={() => {
                      setSelectedRouteOption("most_secure");
                      setResult(allRouteOptions.most_secure!);
                      if (allRouteOptions.most_secure?.factor_impacts) {
                        setLiveFactorImpacts(allRouteOptions.most_secure.factor_impacts);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRouteOption === "most_secure"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-purple-400/20 bg-black/20 hover:bg-purple-500/10"
                    }`}
                  >
                    <div className="text-3xl mb-2">🛡️</div>
                    <div className="font-bold text-purple-100">Most Secure</div>
                    <div className="text-2xl font-bold text-white mt-2">{(allRouteOptions.most_secure.total_risk * 100).toFixed(1)}%</div>
                    <div className="text-xs text-purple-200/70 mt-1">${allRouteOptions.most_secure.total_cost.toFixed(2)}</div>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Enhanced Factor Impact Alert */}
          {currentFactorImpacts && (
            <div className="rounded-2xl border-2 border-indigo-400/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 p-6 shadow-2xl shadow-indigo-500/20">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-indigo-500/30 p-3">
                  <Shield className="h-8 w-8 text-indigo-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-indigo-100">⚡ Active Factor Multipliers Applied</h3>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-indigo-400/20 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wider text-indigo-300">Cost Impact</p>
                      <p className="text-2xl font-bold text-white">{currentFactorImpacts.cost_multiplier.toFixed(3)}×</p>
                      <p className="text-xs text-indigo-200/70">
                        {currentFactorImpacts.cost_multiplier > 1.0 ? "+" : ""}{((currentFactorImpacts.cost_multiplier - 1.0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-indigo-400/20 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wider text-indigo-300">Time Impact</p>
                      <p className="text-2xl font-bold text-white">{currentFactorImpacts.time_multiplier.toFixed(3)}×</p>
                      <p className="text-xs text-indigo-200/70">
                        {currentFactorImpacts.time_multiplier > 1.0 ? "+" : ""}{((currentFactorImpacts.time_multiplier - 1.0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-indigo-400/20 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wider text-indigo-300">Risk Impact</p>
                      <p className="text-2xl font-bold text-white">{currentFactorImpacts.risk_multiplier.toFixed(3)}×</p>
                      <p className="text-xs text-indigo-200/70">
                        {currentFactorImpacts.risk_multiplier > 1.0 ? "+" : ""}{((currentFactorImpacts.risk_multiplier - 1.0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-indigo-200/80">
                    💡 These multipliers from your factor settings are applied to every route segment. 
                    Adjust factors on the Factors page to see dramatic changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Factor Breakdown */}
          {result.factor_breakdown && result.factor_breakdown.length > 0 && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-purple-100">🎯 Individual Factor Contributions</h3>
              <p className="mt-1 text-sm text-purple-200/70">
                Each factor's effect × strength determines its contribution to the final multipliers
              </p>
              <div className="mt-4 space-y-2">
                {result.factor_breakdown.slice(0, 8).map((factor) => {
                  const absContribution = Math.abs(factor.contribution);
                  const maxContribution = Math.max(...result.factor_breakdown!.map(f => Math.abs(f.contribution)));
                  const widthPercent = maxContribution > 0 ? (absContribution / maxContribution) * 100 : 0;
                  const isSupport = factor.impact_type === "support";
                  const isPressure = factor.impact_type === "pressure";
                  
                  return (
                    <div key={factor.name} className="rounded-lg border border-purple-400/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-purple-100">{factor.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                              <div
                                className={`h-full transition-all ${
                                  isSupport ? "bg-emerald-500" : isPressure ? "bg-rose-500" : "bg-gray-600"
                                }`}
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${
                            isSupport ? "text-emerald-300" : isPressure ? "text-rose-300" : "text-gray-400"
                          }`}>
                            {factor.contribution > 0 ? "+" : ""}{factor.contribution.toFixed(3)}
                          </p>
                          <p className="text-[0.65rem] text-purple-300/50">
                            {factor.effect.toFixed(2)} × {factor.strength.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-200">Support (reduces costs/risk)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-rose-200">Pressure (increases costs/risk)</span>
                </div>
              </div>
            </div>
          )}

          {/* Original Factor Impact Indicator */}
          {currentFactorImpacts && (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 shadow-xl shadow-indigo-500/10">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-indigo-500/20 p-3">
                  <Shield className="h-6 w-6 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-200">Factors are actively influencing this simulation</h3>
                  <p className="mt-1 text-sm text-indigo-300/70">
                    Current factors produce a <strong className="text-indigo-200">{currentFactorImpacts.cost_multiplier.toFixed(3)}×</strong> cost multiplier,{" "}
                    <strong className="text-indigo-200">{currentFactorImpacts.time_multiplier.toFixed(3)}×</strong> time multiplier, and{" "}
                    <strong className="text-indigo-200">{currentFactorImpacts.risk_multiplier.toFixed(3)}×</strong> risk multiplier.{" "}
                    With 12 factors balancing each other, changes may appear subtle. For dramatic effects, adjust multiple factors to extreme values.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
            <h2 className="text-xl font-semibold text-white">Route & Cost Metrics</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  label: "Total Cost",
                  value: `$${result.total_cost.toFixed(2)}`,
                  accent: "text-sky-300",
                },
                {
                  label: "Total Time",
                  value: `${result.total_time.toFixed(1)} days`,
                  accent: "text-emerald-300",
                },
                {
                  label: "Logistics Risk",
                  value: formatPercent(result.total_risk),
                  accent: "text-amber-300",
                },
              ].map(({ label, value, accent }) => (
                <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                  <p className="text-sm uppercase tracking-wide text-gray-500">{label}</p>
                  <p className={`text-2xl font-bold ${accent}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white">Optimal Route Visualization</h3>
              <p className="mt-1 text-sm text-gray-400">
                Multi-modal transport showing modal transitions and route complexity
              </p>
              <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-purple-950/20 p-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {result.path.map((country, idx) => {
                    const nextCountry = result.path[idx + 1];
                    const legMode = result.breakdown[idx]?.route_mode || "land";
                    const hasTransfer = idx > 0 && result.breakdown[idx - 1]?.route_mode !== legMode;
                    
                    return (
                      <div key={country + idx} className="flex items-center gap-3">
                        {hasTransfer && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                              ⚡ TRANSFER
                            </div>
                            <div className="text-[0.6rem] uppercase tracking-wider text-amber-300/60">
                              {result.breakdown[idx - 1]?.route_mode} → {legMode}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-2xl border-2 border-indigo-400/50 bg-indigo-500/20 px-6 py-3 text-center shadow-lg shadow-indigo-500/20">
                            <p className="text-lg font-bold text-white">{country}</p>
                            {idx === 0 && (
                              <p className="text-[0.65rem] uppercase tracking-wider text-emerald-300">Origin</p>
                            )}
                            {idx === result.path.length - 1 && (
                              <p className="text-[0.65rem] uppercase tracking-wider text-sky-300">Destination</p>
                            )}
                          </div>
                          {nextCountry && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className={`rounded-full px-2 py-0.5 ${
                                legMode === "sea" ? "bg-blue-500/20 text-blue-200" :
                                legMode === "air" ? "bg-purple-500/20 text-purple-200" :
                                "bg-green-500/20 text-green-200"
                              }`}>
                                {legMode === "sea" ? "🚢 SEA" : legMode === "air" ? "✈️ AIR" : "🚛 LAND"}
                              </div>
                            </div>
                          )}
                        </div>
                        {nextCountry && <ArrowRight className="text-indigo-400" size={24} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Geopolitical Controls */}
            <RouteGeopoliticsControls
              source={source}
              destination={destination}
              onAdjustment={() => handleSimulate()}
            />
          </div>



          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
            <h2 className="text-xl font-semibold text-white">Game-Theory Dashboard</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[{
                label: "Cooperation Likelihood",
                value: formatPercent(result.game_theory.cooperation_probability),
                accent: "text-emerald-300",
                icon: <Shield size={16} />,
              }, {
                label: "Treaty Break Risk",
                value: formatPercent(result.game_theory.treaty_break_probability),
                accent: "text-rose-300",
                icon: <AlertTriangle size={16} />,
              }, {
                label: "Stability Index",
                value: formatPercent(result.game_theory.stability_index),
                accent: "text-sky-300",
                icon: <Shield size={16} />,
              }, {
                label: "Escalation Risk",
                value: formatPercent(result.game_theory.escalation_risk),
                accent: "text-orange-300",
                icon: <AlertTriangle size={16} />,
              }].map(({ label, value, accent, icon }) => (
                <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                    {icon} {label}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Supply Chain Route Visualization */}
            {result.supply_chain?.is_multi_leg && (
              <div className="mt-6 rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-pink-950/20 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Multi-Leg Supply Chain</h3>
                    <p className="text-sm text-indigo-300/70">Complex routing with {result.supply_chain.total_legs} leg{result.supply_chain.total_legs > 1 ? 's' : ''} · Optimal sourcing strategy</p>
                  </div>
                </div>

                {/* Supply Chain Narrative */}
                <div className="space-y-3 mb-6">
                  {result.supply_chain.narrative?.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="flex-1 text-white font-medium mt-1">{step}</p>
                    </div>
                  ))}
                </div>

                {/* Route Legs Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.supply_chain.route_legs?.map((leg: any, idx: number) => (
                    <div key={idx} className={`rounded-xl border p-4 ${
                      leg.purpose === 'sourcing' ? 'border-purple-500/30 bg-purple-950/20' : 
                      'border-emerald-500/30 bg-emerald-950/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          leg.purpose === 'sourcing' ? 'text-purple-300' : 'text-emerald-300'
                        }`}>
                          {leg.purpose === 'sourcing' ? '🏭 Sourcing' : '📦 Delivery'}
                        </span>
                        <span className="text-xs text-gray-400">Leg {idx + 1}</span>
                      </div>
                      <p className="text-white font-bold text-lg mb-2">
                        {leg.from} → {leg.to}
                      </p>
                      {leg.mode && (
                        <div className={`inline-block mb-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          leg.mode === "sea" ? "bg-blue-500/20 text-blue-200" :
                          leg.mode === "air" ? "bg-purple-500/20 text-purple-200" :
                          "bg-green-500/20 text-green-200"
                        }`}>
                          {leg.mode === "sea" ? "🚢 SEA" : leg.mode === "air" ? "✈️ AIR" : "🚛 LAND"}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {leg.commodities?.map((commodity: string, cidx: number) => (
                          <span key={cidx} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">
                            {commodity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commodity Sourcing Info */}
                {result.supply_chain.commodity_sourcing && !result.supply_chain.commodity_sourcing.has_all && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                    <p className="text-sm font-semibold text-amber-300 mb-2">⚠️ Commodity Sourcing Required</p>
                    <p className="text-sm text-amber-200/80">
                      Source country doesn't produce: <span className="font-bold">{result.supply_chain.commodity_sourcing.missing?.join(', ')}</span>
                    </p>
                    <p className="text-xs text-amber-300/60 mt-1">
                      System automatically sourced from optimal producer countries
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">strategic summary</p>
                <p className="mt-2 text-lg font-semibold text-white">{result.strategic_summary}</p>
                <p className="mt-4 text-sm text-gray-300">
                  Recommendation: <span className="font-semibold text-indigo-300">{result.game_theory.recommendation}</span>
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Equilibrium: <span className="font-semibold text-gray-100">{result.game_theory.equilibrium_strategy}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">payoff matrix (src,dst)</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="px-3 py-2" />
                        <th className="px-3 py-2">Dest Cooperate</th>
                        <th className="px-3 py-2">Dest Defect</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-100">
                      {[{
                        label: "Source Cooperate",
                        coopKey: "cooperate_cooperate",
                        defectKey: "cooperate_defect",
                      }, {
                        label: "Source Defect",
                        coopKey: "defect_cooperate",
                        defectKey: "defect_defect",
                      }].map((row) => (
                        <tr key={row.label} className="border-t border-gray-800">
                          <td className="px-3 py-2 text-xs uppercase tracking-wide text-gray-400">{row.label}</td>
                          {[row.coopKey, row.defectKey].map((key) => {
                            const cell = result.game_theory.payoff_matrix[key as keyof typeof result.game_theory.payoff_matrix];
                            return (
                              <td key={key} className="px-3 py-2 text-sm">
                                <p className="text-indigo-300">Src: {cell.src.toFixed(1)}</p>
                                <p className="text-teal-300">Dst: {cell.dst.toFixed(1)}</p>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
            <h3 className="text-xl font-semibold text-white">Alliance & Treaty Context</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-300">Activated Alliances</p>
                {result.game_theory.alliances.length ? (
                  <div className="mt-3 space-y-3">
                    {result.game_theory.alliances.map((alliance) => (
                      <div key={alliance.name} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <p className="text-sm font-semibold text-indigo-200">{alliance.name}</p>
                        <p className="text-xs text-gray-400">Members: {alliance.members.join(", ")}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Cohesion {formatPercent(alliance.cohesion)} · Support {formatPercent(alliance.support_multiplier)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No alliance leverage engaged.</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-300">Binding Treaties</p>
                {result.game_theory.treaties.length ? (
                  <div className="mt-3 space-y-3">
                    {result.game_theory.treaties.map((treaty) => (
                      <div key={treaty.name} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <p className="text-sm font-semibold text-amber-200">{treaty.name}</p>
                        <p className="text-xs text-gray-400">Parties: {treaty.parties.join(", ")}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Stability {formatPercent(treaty.stability)} · Break risk {formatPercent(treaty.breach_probability)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No treaties govern this corridor.</p>
                )}
              </div>
            </div>
          </div>



          {result.breakdown && result.breakdown.length > 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
              <h3 className="text-xl font-semibold text-white">Route Breakdown</h3>
              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900/80 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Country</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Step Cost</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Step Time</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Step Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-950/40 text-gray-100">
                    {result.breakdown.map((step, idx) => (
                      <tr key={idx} className="hover:bg-gray-900/60">
                        <td className="px-4 py-3 font-medium">{step.country}</td>
                        <td className="px-4 py-3">
                          <p>${step.step_cost.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">
                            Base ${step.base_cost.toFixed(2)} · x{step.factor_modifiers.cost.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{step.step_time.toFixed(1)} days</p>
                          <p className="text-xs text-gray-400">
                            Base {step.base_time.toFixed(1)} · x{step.factor_modifiers.time.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{formatPercent(step.step_risk)}</p>
                          <p className="text-xs text-gray-400">
                            Base {formatPercent(step.base_risk)} · x{step.factor_modifiers.risk.toFixed(2)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
            <h3 className="text-xl font-semibold text-white">Reference Library</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <p className="text-sm font-semibold text-gray-300">All Alliances</p>
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-2">
                  {alliances.map((alliance) => (
                    <div key={alliance.name} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                      <p className="text-sm font-semibold text-indigo-200">{alliance.name}</p>
                      <p className="text-xs text-gray-400">Members: {alliance.members.join(", ")}</p>
                    </div>
                  ))}
                  {!alliances.length && <p className="text-xs text-gray-500">No alliances defined.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <p className="text-sm font-semibold text-gray-300">All Treaties</p>
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-2">
                  {treaties.map((treaty) => (
                    <div key={treaty.name} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                      <p className="text-sm font-semibold text-amber-200">{treaty.name}</p>
                      <p className="text-xs text-gray-400">Parties: {treaty.parties.join(", ")}</p>
                    </div>
                  ))}
                  {!treaties.length && <p className="text-xs text-gray-500">No treaties defined.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
