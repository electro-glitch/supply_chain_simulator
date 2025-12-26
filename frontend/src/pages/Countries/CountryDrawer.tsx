import { useEffect, useMemo, useState } from "react";
import { useCountriesStore } from "../../store/countriesStore";
import { useCommoditiesStore } from "../../store/commoditiesStore";
import { Country } from "../../types/Country";
import { getCommodityEmoji, formatCommodityName } from "../../lib/commodityEmojis";

interface Props {
  open: boolean;
  onClose: () => void;
  editTarget?: Country | null;
}

const defaultForm: Country = {
  name: "",
  flagUrl: "",
  demand: [],
  production: [],
  inflation: 0,
};

type CommodityType = "none" | "demand" | "production";

interface CommoditySelection {
  [key: string]: CommodityType;
}

export default function CountryDrawer({ open, onClose, editTarget }: Props) {
  const { addCountry, updateCountry } = useCountriesStore();
  const { commodities, fetchCommodities } = useCommoditiesStore();

  const [form, setForm] = useState<Country>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [commoditySearch, setCommoditySearch] = useState("");
  const [commoditySelections, setCommoditySelections] = useState<CommoditySelection>({});

  const modeLabel = editTarget ? "Edit Country" : "Add Country";

  useEffect(() => {
    fetchCommodities();
  }, [fetchCommodities]);

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setForm(editTarget);
      // Build commodity selections from demand/production arrays
      const selections: CommoditySelection = {};
      editTarget.demand.forEach(item => {
        const key = item.toLowerCase().replace(/\s+/g, "_");
        selections[key] = "demand";
      });
      editTarget.production.forEach(item => {
        const key = item.toLowerCase().replace(/\s+/g, "_");
        selections[key] = "production";
      });
      setCommoditySelections(selections);
    } else {
      setForm(defaultForm);
      setCommoditySelections({});
    }
    setCommoditySearch("");
  }, [open, editTarget]);

  const disableSubmit = useMemo(() => !form.name.trim(), [form.name]);

  // Get all available commodities
  const allCommodities = useMemo(() => {
    return Object.keys(commodities).sort((a, b) => 
      formatCommodityName(a).localeCompare(formatCommodityName(b))
    );
  }, [commodities]);

  // Filter commodities based on search
  const filteredCommodities = useMemo(() => {
    return allCommodities.filter(c => 
      formatCommodityName(c).toLowerCase().includes(commoditySearch.toLowerCase())
    );
  }, [allCommodities, commoditySearch]);

  // Count selections
  const demandCount = Object.values(commoditySelections).filter(v => v === "demand").length;
  const productionCount = Object.values(commoditySelections).filter(v => v === "production").length;

  const handleCommodityTypeChange = (commodity: string, type: CommodityType) => {
    setCommoditySelections(prev => {
      const newSelections = { ...prev };
      if (type === "none") {
        delete newSelections[commodity];
      } else {
        newSelections[commodity] = type;
      }
      return newSelections;
    });
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) {
      alert("Country must have a name");
      return;
    }

    // Build demand and production arrays from selections
    const demand: string[] = [];
    const production: string[] = [];
    
    Object.entries(commoditySelections).forEach(([commodity, type]) => {
      const formatted = formatCommodityName(commodity);
      if (type === "demand") {
        demand.push(formatted);
      } else if (type === "production") {
        production.push(formatted);
      }
    });

    setSaving(true);
    try {
      const payload = {
        ...form,
        name,
        demand,
        production,
        inflation: Number.isFinite(form.inflation) ? form.inflation : 0,
      };
      if (editTarget) {
        await updateCountry(editTarget.name, payload);
      } else {
        await addCountry(payload);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save country", err);
      alert("Unable to save country. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="w-[650px] h-full overflow-y-auto p-6 bg-gradient-to-br from-slate-950 to-indigo-950/30 border-l-2 border-indigo-500/20 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{modeLabel}</h2>
            <p className="mt-1 text-sm text-indigo-300">
              <span className="text-purple-400">{demandCount} Demand</span> • <span className="text-emerald-400">{productionCount} Production</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white transition"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Country Name */}
          <div>
            <label className="text-sm font-semibold text-indigo-300">Country Name</label>
            <input
              className="mt-2 w-full rounded-xl border border-indigo-500/20 bg-slate-900/80 p-3 text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none"
              placeholder="e.g. Brazil"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Inflation */}
          <div>
            <label className="text-sm font-semibold text-indigo-300">Inflation (%)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              className="mt-2 w-full rounded-xl border border-indigo-500/20 bg-slate-900/80 p-3 text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none"
              placeholder="e.g. 6.5"
              value={form.inflation}
              onChange={(e) =>
                setForm({ ...form, inflation: Number(e.target.value) || 0 })
              }
            />
          </div>

          {/* Commodities */}
          <div>
            <label className="text-sm font-semibold text-indigo-300">Commodities</label>
            <input
              type="text"
              placeholder="Search commodities..."
              value={commoditySearch}
              onChange={(e) => setCommoditySearch(e.target.value)}
              className="mt-2 w-full rounded-xl border border-indigo-500/20 bg-slate-900/80 p-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none"
            />
            <div className="mt-2 max-h-[500px] overflow-y-auto rounded-xl border border-indigo-500/20 bg-slate-900/60 p-2">
              <div className="space-y-1">
                {filteredCommodities.map(commodity => {
                  const formatted = formatCommodityName(commodity);
                  const selection = commoditySelections[commodity] || "none";
                  return (
                    <div
                      key={commodity}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition ${
                        selection === "demand" ? 'bg-purple-500/15 border border-purple-500/30' :
                        selection === "production" ? 'bg-emerald-500/15 border border-emerald-500/30' :
                        'border border-transparent hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-xl">{getCommodityEmoji(commodity)}</span>
                      <span className="flex-1 text-sm text-white font-medium">{formatted}</span>
                      <select
                        value={selection}
                        onChange={(e) => handleCommodityTypeChange(commodity, e.target.value as CommodityType)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 ${
                          selection === "demand" ? 'border-purple-500/40 bg-purple-500/20 text-purple-200 focus:ring-purple-500' :
                          selection === "production" ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200 focus:ring-emerald-500' :
                          'border-gray-600 bg-gray-800 text-gray-300 focus:ring-indigo-500'
                        }`}
                      >
                        <option value="none">None</option>
                        <option value="demand">Demand</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              onClick={submit}
              disabled={disableSubmit || saving}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Country"}
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3 font-semibold text-gray-200 hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
