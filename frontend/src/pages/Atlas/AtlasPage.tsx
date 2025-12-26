import { useEffect, useMemo, useState } from "react";
import type { Feature } from "geojson";
import worldData from "world-atlas/countries-110m.json";
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from "react-simple-maps";
import { RefreshCcw, Globe2 } from "lucide-react";
import { useCountriesStore } from "../../store/countriesStore";
import { useRoutesStore } from "../../store/routesStore";
import { api } from "../../lib/api";
import { Graph } from "../../types/Graph";
import { countryCoordinates } from "../../lib/countryCoordinates";
import type { RouteMode } from "../../types/Route";

type GeoFeature = Feature & { rsmKey: string };
type GeographiesRenderProps = { geographies: GeoFeature[] };

export default function AtlasPage() {
  const { countries, fetchCountries } = useCountriesStore();
  const { routes, fetchRoutes } = useRoutesStore();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchCountries();
    fetchRoutes();
  }, [fetchCountries, fetchRoutes]);

  useEffect(() => {
    loadGraph();
  }, [countries]);

  const loadGraph = async () => {
    setLoadingGraph(true);
    try {
      const data = await api.getGraph();
      setGraph(data);
    } catch (err) {
      console.error("Failed to load graph", err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const mappedCountries = useMemo(
    () => countries.filter((country) => countryCoordinates[country.name]),
    [countries]
  );

  const mappedEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter((edge) => countryCoordinates[edge.origin] && countryCoordinates[edge.destination]);
  }, [graph]);

  const getRouteColor = (origin: string, destination: string): { color: string; mode: RouteMode | null } => {
    const mode = routes[origin]?.[destination]?.mode || null;
    if (mode === "air") return { color: "#f87171", mode }; // Red for air
    if (mode === "sea") return { color: "#38bdf8", mode }; // Blue for sea
    if (mode === "land") return { color: "#4ade80", mode }; // Green for land
    return { color: "#94a3b8", mode }; // Gray for undesignated
  };

  return (
    <div className="space-y-6 p-6 text-gray-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-purple-400/70">🌍 global network</p>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">Trade Atlas</h1>
          <p className="mt-2 text-sm text-gray-300">
            Real-time visualization of {mappedCountries.length} countries and {mappedEdges.length} trade routes across land, sea, and air corridors.
          </p>
        </div>
        <button
          onClick={loadGraph}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 px-6 py-3 text-sm font-bold text-indigo-100 shadow-lg shadow-indigo-500/20 transition hover:border-indigo-400/60 hover:bg-indigo-500/30 hover:shadow-indigo-500/30"
          disabled={loadingGraph}
        >
          <RefreshCcw size={18} className={loadingGraph ? "animate-spin" : ""} />
          {loadingGraph ? "Synchronizing" : "Refresh Network"}
        </button>
      </div>

      <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-gray-950/90 to-indigo-950/40 p-6 shadow-2xl shadow-indigo-500/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2">
                <Globe2 size={24} className="text-white" />
              </div>
              Interactive Network Map
            </h2>
            <p className="mt-2 text-sm text-indigo-200/80">
              🖱️ Scroll to zoom • ✋ Drag to pan • 🎯 Hover countries to inspect
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 border-indigo-400/30 bg-indigo-500/20 px-5 py-2.5 text-center">
              <p className="text-xs uppercase tracking-wider text-indigo-300">Network Density</p>
              <p className="text-2xl font-bold text-white">{mappedCountries.length}<span className="text-sm text-indigo-300 ml-1">nodes</span></p>
            </div>
            <div className="rounded-2xl border-2 border-purple-400/30 bg-purple-500/20 px-5 py-2.5 text-center">
              <p className="text-xs uppercase tracking-wider text-purple-300">Active Routes</p>
              <p className="text-2xl font-bold text-white">{mappedEdges.length}<span className="text-sm text-purple-300 ml-1">edges</span></p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-purple-950/20 p-3 overflow-hidden shadow-inner shadow-black/60">
          <div className="mb-3 flex items-center justify-center gap-8 text-xs bg-black/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-12 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/50"></div>
              <span className="text-gray-200 font-semibold">🚛 Land</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50" style={{ backgroundImage: "repeating-linear-gradient(90deg, #22d3ee 0, #22d3ee 5px, #3b82f6 5px, #3b82f6 8px)" }}></div>
              <span className="text-gray-200 font-semibold">🚢 Sea</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-12 rounded-full bg-gradient-to-r from-rose-400 to-red-500 shadow-lg shadow-rose-500/50" style={{ backgroundImage: "repeating-linear-gradient(90deg, #fb7185 0, #fb7185 3px, #ef4444 3px, #ef4444 5px)" }}></div>
              <span className="text-gray-200 font-semibold">✈️ Air</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-12 rounded-full bg-gradient-to-r from-gray-500 to-slate-600 opacity-40 shadow-lg shadow-gray-500/30"></div>
              <span className="text-gray-400 font-semibold">⚪ Unset</span>
            </div>
          </div>
          <ComposableMap projectionConfig={{ scale: 150 }} height={480}>
            <ZoomableGroup
              zoom={zoom}
              onMoveEnd={({ zoom: newZoom }) => setZoom(newZoom)}
              minZoom={1}
              maxZoom={8}
              center={[0, 20]}
            >
            <Geographies geography={worldData}>
              {({ geographies }: GeographiesRenderProps) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#0a0f1e"
                    stroke="#1e293b"
                    strokeWidth={0.5}
                    style={{ 
                      default: { outline: "none" }, 
                      hover: { fill: "#1e2a4a", outline: "none", transition: "all 0.2s ease" } 
                    }}
                  />
                ))
              }
            </Geographies>

            {mappedEdges.map((edge, idx) => {
              const origin = countryCoordinates[edge.origin];
              const destination = countryCoordinates[edge.destination];
              if (!origin || !destination) return null;
              const { color, mode } = getRouteColor(edge.origin, edge.destination);
              const riskFactor = edge.risk || 0.15;
              const baseWidth = mode === "air" ? 1.8 : mode === "sea" ? 1.4 : 1.2;
              return (
                <Line
                  key={`${edge.origin}-${edge.destination}-${idx}`}
                  from={[origin.lng, origin.lat]}
                  to={[destination.lng, destination.lat]}
                  stroke={color}
                  strokeWidth={baseWidth + riskFactor * 1.2}
                  strokeLinecap="round"
                  strokeOpacity={mode ? 0.75 : 0.35}
                  strokeDasharray={mode === "air" ? "4,3" : mode === "sea" ? "6,4" : undefined}
                  style={{ filter: `drop-shadow(0 0 ${riskFactor * 8}px ${color})` }}
                />
              );
            })}

            {mappedCountries.map((country) => {
              const coord = countryCoordinates[country.name];
              if (!coord) return null;
              const showLabel = zoom > 1.5;
              return (
                <Marker key={country.name} coordinates={[coord.lng, coord.lat]}>
                  <g style={{ filter: "drop-shadow(0 0 4px rgba(99,102,241,0.8))" }}>
                    <circle r={4.5 / zoom} fill="url(#nodeGradient)" stroke="#6366f1" strokeWidth={1.5 / zoom} />
                    <circle r={2.5 / zoom} fill="#c7d2fe" opacity={0.8} />
                  </g>
                  {showLabel && (
                    <g>
                      <text
                        textAnchor="middle"
                        y={-14 / zoom}
                        style={{
                          fill: "#0f172a",
                          fontSize: `${11 / zoom}px`,
                          fontWeight: 800,
                          stroke: "#0f172a",
                          strokeWidth: 4 / zoom,
                          paintOrder: "stroke",
                          letterSpacing: "0.03em"
                        }}
                      >
                        {country.name}
                      </text>
                      <text
                        textAnchor="middle"
                        y={-14 / zoom}
                        style={{ 
                          fill: "#f1f5f9", 
                          fontSize: `${11 / zoom}px`, 
                          fontWeight: 700,
                          letterSpacing: "0.03em"
                        }}
                      >
                        {country.name}
                      </text>
                    </g>
                  )}
                </Marker>
              );
            })}            <defs>
              <radialGradient id="nodeGradient">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </radialGradient>
            </defs>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-teal-950/30 p-6 shadow-xl shadow-emerald-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🗺️</span> Country Network
          </h3>
          <p className="text-sm text-emerald-200/70 mt-1">Active trading nations with GPS coordinates</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm text-gray-200 md:grid-cols-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {mappedCountries.map((country) => (
              <span key={country.name} className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center font-semibold text-emerald-100 hover:border-emerald-400/40 hover:bg-emerald-500/20 transition">
                {country.name}
              </span>
            ))}
            {mappedCountries.length === 0 && <p className="text-sm text-gray-500">No mappable countries yet.</p>}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 p-6 shadow-xl shadow-indigo-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📊</span> Network Analytics
          </h3>
          {graph ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border-2 border-indigo-400/20 bg-black/30 p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-200">🔗 Total Nodes</span>
                <span className="text-2xl font-bold text-white">{graph.nodes.length}</span>
              </div>
              <div className="rounded-2xl border-2 border-purple-400/20 bg-black/30 p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-200">📡 Total Edges</span>
                <span className="text-2xl font-bold text-white">{graph.edges.length}</span>
              </div>
              <div className="rounded-2xl border-2 border-sky-400/20 bg-black/30 p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-sky-200">💰 Avg Cost</span>
                <span className="text-2xl font-bold text-sky-300">
                  $
                  {graph.edges.length
                    ? (graph.edges.reduce((sum, e) => sum + e.cost, 0) / graph.edges.length).toFixed(2)
                    : "0.00"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-amber-400/20 bg-black/30 p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-200">⚠️ Avg Risk</span>
                <span className="text-2xl font-bold text-amber-300">
                  {graph.edges.length
                    ? ((graph.edges.reduce((sum, e) => sum + e.risk, 0) / graph.edges.length) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Synchronizing graph data…</p>
          )}
        </div>
      </div>
    </div>
  );
}
