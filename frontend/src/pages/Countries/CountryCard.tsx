import { Country } from "../../types/Country";
import { getCommodityEmoji } from "../../lib/commodityEmojis";

interface Props {
  c: Country;
  onEdit: (country: Country) => void;
  onDelete: (name: string) => void;
}

const InfoRow = ({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: string;
}) => (
  <div className="mt-3">
    <p className={`text-xs font-semibold ${accent}`}>{label}</p>
    {items.length ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${label}-${item}`}
            className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-100"
          >
            <span className="mr-1">{getCommodityEmoji(item)}</span>
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-xs text-gray-500">No data</p>
    )}
  </div>
);

export default function CountryCard({ c, onEdit, onDelete }: Props) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border-2 border-white/10 bg-gradient-to-br from-slate-950/90 to-indigo-950/30 p-6 shadow-xl shadow-black/40 hover:border-indigo-500/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        {c.flagUrl ? (
          <img src={c.flagUrl} alt={`${c.name} flag`} className="h-12 w-16 rounded-lg object-cover shadow-lg" />
        ) : (
          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-sm font-bold text-white shadow-lg">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white tracking-tight">{c.name}</h3>
          {c.currency && (
            <p className="text-xs font-semibold text-indigo-300">{c.currency}</p>
          )}
        </div>
      </div>

      {/* Economic Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {c.gdp_billions !== undefined && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-xs font-semibold text-emerald-300">💰 GDP</p>
            <p className="text-lg font-bold text-white">${c.gdp_billions.toLocaleString()}B</p>
          </div>
        )}
        {c.population_millions !== undefined && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
            <p className="text-xs font-semibold text-sky-300">👥 Population</p>
            <p className="text-lg font-bold text-white">{c.population_millions.toLocaleString()}M</p>
          </div>
        )}
        {c.hdi !== undefined && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
            <p className="text-xs font-semibold text-purple-300">📈 HDI</p>
            <p className="text-lg font-bold text-white">{c.hdi.toFixed(3)}</p>
          </div>
        )}
        {c.infrastructure_score !== undefined && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold text-amber-300">🏗️ Infrastructure</p>
            <p className="text-lg font-bold text-white">{c.infrastructure_score}/100</p>
          </div>
        )}
        {c.trade_balance_billions !== undefined && (
          <div className={`rounded-xl border p-3 ${c.trade_balance_billions >= 0 ? 'border-teal-500/20 bg-teal-500/10' : 'border-rose-500/20 bg-rose-500/10'}`}>
            <p className={`text-xs font-semibold ${c.trade_balance_billions >= 0 ? 'text-teal-300' : 'text-rose-300'}`}>💱 Trade Balance</p>
            <p className="text-lg font-bold text-white">
              {c.trade_balance_billions >= 0 ? '+' : ''}{c.trade_balance_billions.toLocaleString()}B
            </p>
          </div>
        )}
        {c.logistics_index !== undefined && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
            <p className="text-xs font-semibold text-indigo-300">🚛 Logistics</p>
            <p className="text-lg font-bold text-white">{c.logistics_index.toFixed(1)}/5.0</p>
          </div>
        )}
      </div>

      {/* Inflation */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-3 mb-4">
        <p className="text-xs font-semibold text-amber-300">🔥 Inflation Pass-Through</p>
        <p className="text-2xl font-bold text-white">
          {typeof c.inflation === "number" ? `${c.inflation.toFixed(1)}%` : "—"}
        </p>
      </div>

      <InfoRow label="Demand" items={c.demand} accent="text-purple-300" />
      <InfoRow label="Production" items={c.production} accent="text-emerald-300" />

      <div className="mt-auto flex gap-3 pt-4 text-sm font-semibold">
        <button
          onClick={() => onEdit(c)}
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2.5 text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-purple-400"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(c.name)}
          className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 py-2.5 text-white shadow-lg shadow-rose-500/30 transition hover:from-rose-400 hover:to-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
