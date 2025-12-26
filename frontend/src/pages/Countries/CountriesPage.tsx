import { useEffect, useState } from "react";
import { useCountriesStore } from "../../store/countriesStore";
import { Country } from "../../types/Country";
import CountryCard from "./CountryCard";
import CountryDrawer from "./CountryDrawer";

export default function CountriesPage() {
  const { countries, fetchCountries, deleteCountry } = useCountriesStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Country | null>(null);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Countries</h1>
          <p className="mt-1 text-sm text-slate-300">
            Monitor demand, production, and inflation for every nation in your network.
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setDrawerOpen(true);
          }}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400"
        >
          + Add Country
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {countries.map((c) => (
            <CountryCard
              key={c.name}
              c={c}
              onEdit={(country: Country) => {
                setEditTarget(country);
                setDrawerOpen(true);
              }}
              onDelete={deleteCountry}
            />
          ))}
        </div>
      </div>

      <CountryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editTarget={editTarget}
      />
    </div>
  );
}
