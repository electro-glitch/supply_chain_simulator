import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Ban,
  CloudLightning,
  Coins,
  Cpu,
  Factory,
  Flag,
  Handshake,
  HeartPulse,
  Percent,
  ShieldCheck,
  Skull,
  Waves,
  Zap,
} from "lucide-react";
import { useCountriesStore } from "../../store/countriesStore";
import { useRoutesStore } from "../../store/routesStore";
import { api } from "../../lib/api";
import type { RouteMode } from "../../types/Route";
import { useGeopoliticsStore } from "../../store/geopoliticsStore";
import { useFactorsStore } from "../../store/factorsStore";

type ActionCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  button: string;
  requiresMode?: RouteMode;
  input?: {
    key: string;
    label: string;
    placeholder?: string;
    step?: number;
    min?: number;
    max?: number;
    suffix?: string;
    defaultValue?: number;
  };
  execute: (value?: number) => Promise<string>;
};

type ToastState = { text: string; tone: "success" | "error" } | null;

export default function GeopoliticsPage() {
  const { countries, fetchCountries } = useCountriesStore();
  const routes = useRoutesStore((state) => state.routes);
  const fetchRoutes = useRoutesStore((state) => state.fetchRoutes);
  const geopoliticsActions = useGeopoliticsStore((state) => state.actions);
  const recordGeoAction = useGeopoliticsStore((state) => state.recordAction);
  const clearGeoActions = useGeopoliticsStore((state) => state.clearActions);
  const { fetchFactors } = useFactorsStore();
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [controls, setControls] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries();
    fetchRoutes();
  }, [fetchCountries, fetchRoutes]);

  const currentRoute = selectedA && selectedB ? routes[selectedA]?.[selectedB] : undefined;
  const currentMode = (currentRoute?.mode ?? undefined) as RouteMode | undefined;

  const showMessage = (text: string, tone: "success" | "error" = "success") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const requireRoute = () => {
    if (!selectedA || !selectedB) {
      showMessage("Select both countries first", "error");
      return false;
    }
    return true;
  };

  const actions = useMemo<ActionCard[]>(() => {
    const makeExecution = (
      label: string,
      fn: (value?: number) => Promise<void>,
      success: (value?: number) => string,
      unit?: string,
    ) => {
      return async (value?: number) => {
        if (!selectedA || !selectedB) {
          throw new Error("countries missing");
        }
        await fn(value);
        // Refresh factors after geopolitical actions (they update global factors in backend)
        await fetchFactors();
        await fetchRoutes();
        const summary = success(value);
        recordGeoAction({
          action: label,
          summary,
          origin: selectedA,
          destination: selectedB,
          value,
          unit,
        });
        return summary;
      };
    };

    return [
      {
        id: "war",
        title: "Declare War",
        description: "Remove bilateral routes entirely. Nuclear option.",
        icon: AlertTriangle,
        gradient: "from-red-600/80 to-red-900/40",
        button: "bg-red-600 hover:bg-red-500",
        execute: makeExecution(
          "Declare War",
          async () => {
            await api.declareWar(selectedA, selectedB);
          },
          () => `War declared between ${selectedA} and ${selectedB}`
        ),
      },
      {
        id: "peace",
        title: "Broker Peace",
        description: "Restore lanes, slash costs, and calm tensions.",
        icon: Handshake,
        gradient: "from-emerald-400/70 to-slate-900/40",
        button: "bg-emerald-500 hover:bg-emerald-400 text-gray-900",
        input: {
          key: "peace",
          label: "Relief %",
          min: 5,
          max: 80,
          step: 1,
          defaultValue: 20,
        },
        execute: makeExecution(
          "Broker Peace",
          async (value = 0) => {
            await api.brokerPeace(selectedA, selectedB, value);
          },
          (value = 0) => `Peace terms eased tensions by ${value}%`
        ),
      },
      {
        id: "tariff",
        title: "Apply Tariff",
        description: "Increase cost on exports from A to B via tariff %.",
        icon: Percent,
        gradient: "from-orange-500/70 to-amber-600/30",
        button: "bg-orange-500 hover:bg-orange-400",
        input: {
          key: "tariff",
          label: "Tariff %",
          min: -50,
          max: 300,
          step: 1,
          suffix: "%",
          defaultValue: 25,
        },
        execute: makeExecution(
          "Apply Tariff",
          async (value = 0) => {
            await api.applyTariff(selectedA, selectedB, value);
          },
          (value = 0) => `${value}% tariff applied from ${selectedA} to ${selectedB}`
        ),
      },
      {
        id: "risk",
        title: "Adjust Risk",
        description: "Fine tune the risk score on a single lane.",
        icon: Activity,
        gradient: "from-yellow-500/70 to-lime-500/30",
        button: "bg-yellow-400 text-gray-900 hover:bg-yellow-300",
        input: {
          key: "risk",
          label: "Risk delta",
          step: 0.01,
          min: -0.5,
          max: 0.5,
          defaultValue: 0,
        },
        execute: makeExecution(
          "Adjust Risk",
          async (value = 0) => {
            await api.modifyRisk(selectedA, selectedB, value);
          },
          (value = 0) => `Risk adjusted by ${value} on ${selectedA} → ${selectedB}`
        ),
      },
      {
        id: "sanction",
        title: "Impose Sanctions",
        description: "Spike route costs and political risk.",
        icon: Ban,
        gradient: "from-fuchsia-600/60 to-purple-800/30",
        button: "bg-fuchsia-600 hover:bg-fuchsia-500",
        input: {
          key: "sanction",
          label: "Cost increase %",
          min: 0,
          max: 400,
          step: 5,
          defaultValue: 40,
        },
        execute: makeExecution(
          "Impose Sanction",
          async (value = 0) => {
            await api.imposeSanction(selectedA, selectedB, value);
          },
          (value = 0) => `Sanction lifted route cost by ${value}%`
        ),
      },
      {
        id: "subsidy",
        title: "Offer Subsidy",
        description: "Underwrite exporters to drop delivered cost.",
        icon: Coins,
        gradient: "from-emerald-500/70 to-teal-600/30",
        button: "bg-emerald-500 hover:bg-emerald-400",
        input: {
          key: "subsidy",
          label: "Cost relief %",
          min: 0,
          max: 90,
          step: 1,
          defaultValue: 15,
        },
        execute: makeExecution(
          "Offer Subsidy",
          async (value = 0) => {
            await api.grantSubsidy(selectedA, selectedB, value);
          },
          (value = 0) => `Subsidy lowered route cost by ${value}%`
        ),
      },
      {
        id: "customs",
        title: "Fast-Track Customs",
        description: "Trim clearance and paperwork lag in hours.",
        icon: Zap,
        gradient: "from-cyan-500/60 to-sky-500/30",
        button: "bg-cyan-500 hover:bg-cyan-400",
        input: {
          key: "customs",
          label: "Hours saved",
          min: 0,
          max: 72,
          step: 1,
          suffix: "h",
          defaultValue: 6,
        },
        execute: makeExecution(
          "Fast-Track Customs",
          async (value = 0) => {
            await api.fastTrackCustoms(selectedA, selectedB, value);
          },
          (value = 0) => `Time reduced by ${value}h on ${selectedA} → ${selectedB}`
        ),
      },
      {
        id: "disrupt",
        title: "Strike Infrastructure",
        description: "Sabotage adds hours and danger to a lane.",
        icon: Factory,
        gradient: "from-slate-600/80 to-slate-900/50",
        button: "bg-slate-600 hover:bg-slate-500",
        input: {
          key: "disrupt",
          label: "Hours added",
          min: 0,
          max: 96,
          step: 1,
          suffix: "h",
          defaultValue: 10,
        },
        execute: makeExecution(
          "Strike Infrastructure",
          async (value = 0) => {
            await api.disruptInfrastructure(selectedA, selectedB, value);
          },
          (value = 0) => `${value}h delay injected on ${selectedA} → ${selectedB}`
        ),
      },
      {
        id: "security",
        title: "Bolster Security",
        description: "Deploy escorts to suppress systemic risk.",
        icon: ShieldCheck,
        gradient: "from-lime-500/70 to-green-600/30",
        button: "bg-lime-500 text-gray-900 hover:bg-lime-400",
        input: {
          key: "security",
          label: "Risk delta",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.08,
        },
        execute: makeExecution(
          "Bolster Security",
          async (value = 0) => {
            await api.bolsterSecurity(selectedA, selectedB, value);
          },
          (value = 0) => `Risk lowered by ${value}`
        ),
      },
      {
        id: "cyber",
        title: "Launch Cyber Attack",
        description: "Destabilise digital logistics to raise risk.",
        icon: Cpu,
        gradient: "from-indigo-600/70 to-blue-900/40",
        button: "bg-indigo-600 hover:bg-indigo-500",
        input: {
          key: "cyber",
          label: "Risk delta",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.12,
        },
        execute: makeExecution(
          "Launch Cyber Attack",
          async (value = 0) => {
            await api.launchCyberAttack(selectedA, selectedB, value);
          },
          (value = 0) => `Cyber attack raised risk by ${value}`
        ),
      },
      {
        id: "corridor",
        title: "Humanitarian Corridor",
        description: "Temporarily lower cost, time, and risk.",
        icon: HeartPulse,
        gradient: "from-rose-500/60 to-pink-600/30",
        button: "bg-rose-500 hover:bg-rose-400",
        input: {
          key: "corridor",
          label: "Relief %",
          min: 0,
          max: 80,
          step: 1,
          defaultValue: 20,
        },
        execute: makeExecution(
          "Humanitarian Corridor",
          async (value = 0) => {
            await api.openHumanitarianCorridor(selectedA, selectedB, value);
          },
          (value = 0) => `Corridor eased metrics by ${value}%`
        ),
      },
      {
        id: "annex",
        title: "Annex Territory",
        description: "Expand borders to force land access while raising tensions.",
        icon: Flag,
        gradient: "from-amber-500/60 to-orange-900/40",
        button: "bg-amber-500 hover:bg-amber-400 text-gray-900",
        input: {
          key: "annex",
          label: "Annex reach %",
          min: 0,
          max: 60,
          step: 2,
          defaultValue: 12,
        },
        execute: makeExecution(
          "Annex Territory",
          async (value = 0) => {
            await api.annexTerritory(selectedA, selectedB, value);
          },
          (value = 0) => `Annexation shaved transit by ${value}%`
        ),
      },
      {
        id: "disaster",
        title: "Natural Disaster",
        description: "Strike the corridor with quakes, floods, or drought.",
        icon: CloudLightning,
        gradient: "from-blue-500/70 to-gray-900/50",
        button: "bg-blue-500 hover:bg-blue-400",
        input: {
          key: "disaster",
          label: "Severity index",
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 35,
        },
        execute: makeExecution(
          "Natural Disaster",
          async (value = 0) => {
            await api.triggerDisaster(selectedA, selectedB, value);
          },
          (value = 0) => `Disaster injected severity ${value}`
        ),
      },
    ];
  }, [selectedA, selectedB, fetchRoutes, recordGeoAction]);

  useEffect(() => {
    setControls((prev) => {
      let changed = false;
      const next = { ...prev };
      actions.forEach((action) => {
        if (!action.input) return;
        const key = action.input.key;
        if (next[key] === undefined) {
          const fallback = action.input.defaultValue ?? action.input.min ?? 0;
          next[key] = String(fallback);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [actions]);

  const handleInputChange = (key: string, value: string) => {
    setControls((prev) => ({ ...prev, [key]: value }));
    if (toast?.tone === "error") {
      setToast(null);
    }
  };

  const triggerAction = async (action: ActionCard) => {
    if (!requireRoute()) return;

    let numericValue: number | undefined;
    if (action.input) {
      const raw = controls[action.input.key];
      if (raw === undefined || raw === "") {
        showMessage(`${action.input.label} required`, "error");
        return;
      }
      numericValue = Number.parseFloat(raw);
      if (!Number.isFinite(numericValue)) {
        showMessage(`Enter a valid number for ${action.input.label}`, "error");
        return;
      }
    }

    setLoadingAction(action.id);
    try {
      const text = await action.execute(numericValue);
      showMessage(text, "success");
    } catch (err) {
      console.error(err);
      showMessage("Action failed. Check server logs.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 p-6 text-gray-100">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">policy</p>
        <h1 className="text-3xl font-semibold">Geopolitics</h1>
        <p className="mt-2 text-sm text-gray-400">
          Spin up escalatory or cooperative levers to stress-test supply lines across multiple policy tools.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.tone === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-600/10 text-rose-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: "Country A", value: selectedA, onChange: setSelectedA },
          { label: "Country B", value: selectedB, onChange: setSelectedB },
        ].map(({ label, value, onChange }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-gray-300">{label}</label>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-gray-100 transition focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const sliderConfig = action.input;
          const modeMismatch = action.requiresMode && action.requiresMode !== currentMode;

          let sliderBlock: ReactNode = null;
          if (sliderConfig) {
            const key = sliderConfig.key;
            const sliderRaw = controls[key] ?? String(sliderConfig.defaultValue ?? sliderConfig.min ?? 0);
            const sliderValue = Number.parseFloat(sliderRaw) || 0;
            const precision = (sliderConfig.step ?? 1) < 1 ? 2 : 0;
            sliderBlock = (
              <div className="mt-4">
                <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gray-200/80">
                  <span>{sliderConfig.label}</span>
                  <span className="text-sm font-mono tracking-tight text-white">
                    {sliderValue.toFixed(precision)}
                    {sliderConfig.suffix ? ` ${sliderConfig.suffix}` : ""}
                  </span>
                </label>
                <input
                  type="range"
                  value={sliderValue}
                  step={sliderConfig.step ?? 1}
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className={`geo-slider mt-3 ${modeMismatch ? "cursor-not-allowed opacity-40" : ""}`}
                  aria-label={sliderConfig.label}
                  disabled={modeMismatch}
                />
                {sliderConfig.placeholder && (
                  <p className="mt-1 text-xs text-gray-200/70">{sliderConfig.placeholder}</p>
                )}
                {modeMismatch && (
                  <p className="mt-1 text-xs text-rose-200/80">
                    Requires {action.requiresMode?.toUpperCase()} routing
                  </p>
                )}
              </div>
            );
          }

          return (
            <div
              key={action.id}
              className={`rounded-3xl border border-gray-800 bg-gradient-to-br ${action.gradient} p-5 shadow-2xl shadow-black/40 backdrop-blur`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-200/80">scenario</p>
                  <h2 className="text-xl font-semibold text-white">{action.title}</h2>
                </div>
                <span className="rounded-full bg-black/20 p-2 text-white">
                  <Icon size={20} />
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-100/80">{action.description}</p>

              {sliderBlock}

              <button
                onClick={() => triggerAction(action)}
                className={`mt-6 w-full rounded-2xl px-4 py-2 font-semibold text-white transition disabled:opacity-50 ${action.button}`}
                disabled={loadingAction === action.id || modeMismatch}
              >
                {modeMismatch
                  ? `Requires ${action.requiresMode?.toUpperCase()}`
                  : loadingAction === action.id
                  ? "Applying..."
                  : "Execute"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Session Actions</h3>
            <p className="text-sm text-gray-400">Stored locally so simulations can replay every lever you have pulled.</p>
          </div>
          {geopoliticsActions.length > 0 && (
            <button
              type="button"
              onClick={clearGeoActions}
              className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300 hover:border-gray-500"
            >
              Clear log
            </button>
          )}
        </div>
        {geopoliticsActions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No geopolitical moves yet in this session.</p>
        ) : (
          <ol className="mt-4 space-y-3 text-sm text-gray-200">
            {geopoliticsActions.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{entry.action}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-white">{entry.summary}</p>
                <p className="text-xs text-gray-500">
                  {entry.origin} → {entry.destination}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
