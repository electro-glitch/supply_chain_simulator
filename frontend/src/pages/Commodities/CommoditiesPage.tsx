import { useEffect, useState } from "react";
import { useCommoditiesStore } from "../../store/commoditiesStore";
import { getCommodityEmoji, formatCommodityName } from "../../lib/commodityEmojis";

export default function CommoditiesPage() {
  const { commodities, loading, fetchCommodities, addCommodity } = useCommoditiesStore();
  const [name, setName] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCommodities();
  }, [fetchCommodities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && unitCost) {
      await addCommodity(name, parseFloat(unitCost));
      setName("");
      setUnitCost("");
    }
  };

  const filteredCommodities = Object.entries(commodities).filter(([commodityName]) => {
    const formattedName = formatCommodityName(commodityName);
    return formattedName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 p-6 text-gray-100">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">supply</p>
        <h1 className="text-3xl font-semibold">Commodities</h1>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
        <h2 className="text-xl font-semibold text-white">Add Commodity</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Commodity name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-indigo-400 focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Unit cost"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-indigo-400 focus:outline-none md:w-40"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-6 py-2 font-semibold text-white transition hover:bg-indigo-400"
          >
            Add
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Commodities List ({filteredCommodities.length})</h2>
          <input
            type="text"
            placeholder="Search commodities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/80 text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Commodity</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950/40 text-gray-100">
                {filteredCommodities.map(([commodityName, data]) => (
                  <tr
                    key={commodityName}
                    className="transition hover:bg-gray-900/60"
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="text-xl mr-2">{getCommodityEmoji(commodityName)}</span>
                      {formatCommodityName(commodityName)}
                    </td>
                    <td className="px-4 py-3">${data.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
