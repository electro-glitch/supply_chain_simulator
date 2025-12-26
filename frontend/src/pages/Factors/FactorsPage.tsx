import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Anchor, Flame, Leaf, Radio, Shield, Sun, Thermometer, Waves, Wind, Zap } from "lucide-react";
import { useFactorsStore } from "../../store/factorsStore";
import { useMemoryStore } from "../../store/memoryStore";
import { api } from "../../lib/api";

type DraftMap = Record<string, { effect: number; strength: number }>;
type DraftField = "effect" | "strength";

export default function FactorsPage() {
  const { factors, loading, error, fetchFactors, updateFactor } = useFactorsStore();
  const { factorDrafts, rememberFactorDraft, markFactorUpdate } = useMemoryStore();
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  useEffect(() => {
    const mapped: DraftMap = Object.fromEntries(
      Object.entries(factors).map(([name, payload]) => {
        const memory = factorDrafts[name];
        const source = memory ?? payload;
        return [
          name,
          {
            effect: Number(source.effect.toFixed(2)),
            strength: Number(source.strength.toFixed(2)),
          },
        ];
      })
    );
    setDrafts(mapped);
  }, [factors, factorDrafts]);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const feedback = useMemo(() => localError || error || status, [localError, error, status]);

  const handleChange = (name: string, field: DraftField, value: string) => {
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const clamped = field === "effect" ? clamp(numeric, -1, 1) : clamp(numeric, 0, 1);
    setDrafts((prev) => {
      const current = prev[name] ?? { effect: 0, strength: 0 };
      const next = {
        effect: field === "effect" ? Number(clamped.toFixed(2)) : current.effect,
        strength: field === "strength" ? Number(clamped.toFixed(2)) : current.strength,
      };
      rememberFactorDraft(name, next);
      return {
        ...prev,
        [name]: next,
      };
    });
    setStatus(null);
    setLocalError(null);
  };

  const handleSave = async (name: string) => {
    const draft = drafts[name];
    if (!draft) return;

    const normalizedEffect = clamp(draft.effect, -1, 1);
    const normalizedStrength = clamp(draft.strength, 0, 1);

    setSaving(name);
    setLocalError(null);
    setStatus(null);
    try {
      await updateFactor(name, {
        effect: Number.parseFloat(normalizedEffect.toFixed(2)),
        strength: Number.parseFloat(normalizedStrength.toFixed(2)),
      });
      rememberFactorDraft(name, {
        effect: Number.parseFloat(normalizedEffect.toFixed(2)),
        strength: Number.parseFloat(normalizedStrength.toFixed(2)),
      });
      markFactorUpdate();
      setStatus(`${name} updated`);
    } catch (err) {
      setLocalError("Unable to update factor. Try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleSetExtremeScenario = async (scenario: "crisis" | "optimal" | "neutral") => {
    setSaving("all");
    setLocalError(null);
    setStatus(null);

    try {
      const response = await api.resetFactors(scenario);
      await fetchFactors();

      const mapped: DraftMap = Object.fromEntries(
        Object.entries(response.factors).map(([name, payload]) => {
          const normalized = {
            effect: Number(payload.effect.toFixed(2)),
            strength: Number(payload.strength.toFixed(2)),
          };
          rememberFactorDraft(name, normalized);
          return [name, normalized];
        })
      );

      setDrafts(mapped);
      markFactorUpdate();

      setStatus(
        scenario === "crisis"
          ? "All factors set to CRISIS mode (max negative impact)"
          : scenario === "optimal"
          ? "All factors set to OPTIMAL mode (max positive impact)"
          : "All factors reset to NEUTRAL"
      );
    } catch (err) {
      console.error(err);
      setLocalError("Unable to apply scenario. Try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6 p-6 text-gray-100">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">modifiers</p>
        <h1 className="text-3xl font-semibold">Factors</h1>
        <p className="mt-2 text-sm text-gray-400">
          Adjust the impact of each curated macro indicator. The list stays fixed; only the effect sliders move.
        </p>
      </div>

      {/* Quick Scenario Buttons */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 shadow-xl shadow-amber-500/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-200">
          Quick Scenario Tests
        </h3>
        <p className="mt-1 text-xs text-amber-300/70">
          Apply extreme values to ALL factors to see dramatic simulation changes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => handleSetExtremeScenario("crisis")}
            disabled={saving === "all"}
            className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-50"
          >
            Crisis Mode (High Costs)
          </button>
          <button
            onClick={() => handleSetExtremeScenario("optimal")}
            disabled={saving === "all"}
            className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
          >
            Optimal Mode (Low Costs)
          </button>
          <button
            onClick={() => handleSetExtremeScenario("neutral")}
            disabled={saving === "all"}
            className="rounded-xl bg-gray-500/20 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-500/30 disabled:opacity-50"
          >
            Reset to Neutral
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Active Factors</h2>
            <p className="text-sm text-gray-500">
              Effect skews direction (-1 → +1). Strength scales impact (0 → 1). Slide, preview, then persist.
            </p>
          </div>
          {feedback && (
            <span
              className={`rounded-full px-4 py-1 text-sm ${
                localError ? "bg-rose-500/20 text-rose-200" : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              {feedback}
            </span>
          )}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : Object.keys(factors).length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No factors defined yet</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Object.entries(factors).map(([factorName], index) => {
              const draft = drafts[factorName] ?? { effect: 0, strength: 0 };
              const palette = gradients[index % gradients.length];
              const Icon = resolveIcon(factorName, index);
              return (
                <div
                  key={factorName}
                  className={`rounded-3xl border border-white/5 bg-gradient-to-br ${palette} p-5 shadow-xl shadow-black/40 backdrop-blur`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/70">factor</p>
                      <h3 className="text-lg font-semibold text-white">{factorName}</h3>
                    </div>
                    <span className="rounded-full bg-black/30 p-2 text-white">
                      <Icon size={20} />
                    </span>
                  </div>

                  <div className="mt-5 space-y-5">
                    <SliderRow
                      label="Effect"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={draft.effect}
                      onChange={(value) => handleChange(factorName, "effect", value)}
                      gradient="from-rose-400 via-amber-400 to-sky-400"
                      helper="-1 = drag on payoff • +1 = tailwind"
                    />

                    <SliderRow
                      label="Strength"
                      min={0}
                      max={1}
                      step={0.01}
                      value={draft.strength}
                      onChange={(value) => handleChange(factorName, "strength", value)}
                      gradient="from-slate-400 via-emerald-400 to-teal-300"
                      helper="Dial how loudly this factor speaks in the engine"
                    />

                    <button
                      onClick={() => handleSave(factorName)}
                      className="w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                      disabled={saving === factorName}
                    >
                      {saving === factorName ? "Saving..." : "Save calibration"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const gradients = [
  "from-orange-500/25 via-rose-500/10 to-purple-600/10",
  "from-sky-500/25 via-cyan-500/10 to-indigo-600/10",
  "from-emerald-500/25 via-lime-500/10 to-teal-600/10",
  "from-amber-500/25 via-yellow-400/10 to-pink-500/10",
  "from-blue-500/25 via-indigo-500/10 to-purple-700/10",
];

const iconOverrides: Record<string, LucideIcon> = {
  "Energy Shock Index": Flame,
  "Rare Earth Embargo": Anchor,
  "Currency Instability": Activity,
  "Supply Chain Capacity": Waves,
  "Cyber Threat Level": Radio,
  "Climate Shock Exposure": Wind,
  "Diplomatic Alignment": Shield,
  "Maritime Security Index": Anchor,
  "Border Tension Pressure": Activity,
  "Innovation Subsidy": Zap,
  "Debt Distress Signal": Thermometer,
  "Food Security Buffer": Leaf,
};

const iconFallbacks: LucideIcon[] = [Flame, Activity, Shield, Thermometer, Sun, Leaf, Wind, Waves, Radio, Zap, Anchor];

function resolveIcon(name: string, index: number): LucideIcon {
  return iconOverrides[name] ?? iconFallbacks[index % iconFallbacks.length];
}

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  gradient: string;
  helper: string;
  onChange: (value: string) => void;
};

function SliderRow({ label, value, min, max, step, gradient, helper, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
        <span>{label}</span>
        <span className="text-sm font-mono tracking-tight text-white">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-2 w-full appearance-none rounded-full bg-gradient-to-r ${gradient}`}
        style={{ accentColor: "white" }}
      />
      <p className="mt-1 text-xs text-white/70">{helper}</p>
    </div>
  );
}
