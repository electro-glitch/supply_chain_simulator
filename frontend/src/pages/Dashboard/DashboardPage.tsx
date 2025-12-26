import { useEffect, useState } from "react";
import { useCountriesStore } from "../../store/countriesStore";
import { useCommoditiesStore } from "../../store/commoditiesStore";
import { useRoutesStore } from "../../store/routesStore";
import { useFactorsStore } from "../../store/factorsStore";
import { api } from "../../lib/api";
import { Graph } from "../../types/Graph";
import { Globe, Package, Route, TrendingUp } from "lucide-react";
import { useMemoryStore } from "../../store/memoryStore";

export default function DashboardPage() {
  const { countries, fetchCountries } = useCountriesStore();
  const { commodities, fetchCommodities } = useCommoditiesStore();
  const { routes, fetchRoutes } = useRoutesStore();
  const [graph, setGraph] = useState<Graph | null>(null);
  const { clearMemory, factorDrafts, lastSimulation, markFactorUpdate } = useMemoryStore();
  const fetchFactors = useFactorsStore((state) => state.fetchFactors);
  const hasMemory = Boolean(lastSimulation || Object.keys(factorDrafts).length);

  useEffect(() => {
    fetchCountries();
    fetchCommodities();
    fetchRoutes();
    loadGraph();
  }, [fetchCountries, fetchCommodities, fetchRoutes]);

  async function loadGraph() {
    try {
      const data = await api.getGraph();
      setGraph(data);
    } catch (err) {
      console.error("Failed to load graph", err);
    }
  }

  const totalRoutes = Object.values(routes).reduce(
    (sum, destinations) => sum + Object.keys(destinations).length,
    0
  );

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all data to defaults?")) {
      await api.reset();
      fetchCountries();
      fetchCommodities();
      fetchRoutes();
      await loadGraph();
    }
  };

  const cards = [
    {
      label: "Countries",
      value: countries.length,
      Icon: Globe,
      color: "text-sky-400",
    },
    {
      label: "Commodities",
      value: Object.keys(commodities).length,
      Icon: Package,
      color: "text-emerald-400",
    },
    {
      label: "Routes",
      value: totalRoutes,
      Icon: Route,
      color: "text-fuchsia-400",
    },
    {
      label: "Network Nodes",
      value: graph?.nodes.length ?? 0,
      Icon: TrendingUp,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">overview</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasMemory && (
            <button
              onClick={async () => {
                if (confirm("Clear saved memory and reset all factors to neutral?")) {
                  clearMemory();
                  try {
                    await api.resetFactors("neutral");
                    await fetchFactors();
                    markFactorUpdate();
                  } catch (err) {
                    console.error("Failed to reset factors", err);
                  }
                }
              }}
              className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-5 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
            >
              Clear Saved Memory
            </button>
          )}
          <button
            onClick={handleReset}
            className="rounded-full border border-red-500/40 bg-red-600/15 px-5 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-600/30"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
              </div>
              <Icon className={color} size={38} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white">Recent Countries</h2>
          <div className="mt-4 space-y-3">
            {countries.slice(0, 5).map((country) => (
              <div
                key={country.name}
                className="flex items-center justify-between border-b border-gray-800 pb-2"
              >
                <span className="font-medium text-white">{country.name}</span>
                <span className="text-sm text-gray-400">
                  {country.inflation}% inflation
                </span>
              </div>
            ))}
            {countries.length === 0 && (
              <p className="text-sm text-gray-500">No countries available yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white">Network Overview</h2>
          {graph ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Edges</p>
                <p className="text-2xl font-bold text-white">{graph.edges.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Route Cost</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {graph.edges.length > 0
                    ? (
                        graph.edges.reduce((sum, e) => sum + e.cost, 0) /
                        graph.edges.length
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Risk</p>
                <p className="text-2xl font-bold text-white">
                  {graph.edges.length > 0
                    ? (
                        (graph.edges.reduce((sum, e) => sum + e.risk, 0) /
                          graph.edges.length) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Loading network graph...</p>
          )}
        </div>
      </div>
    </div>
  );
}
