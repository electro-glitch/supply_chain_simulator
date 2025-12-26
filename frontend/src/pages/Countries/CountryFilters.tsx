export default function CountryFilters() {
  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4">
      <input
        placeholder="Search countries..."
        className="bg-gray-700 px-4 py-2 rounded w-64 outline-none"
      />

      <select className="bg-gray-700 px-4 py-2 rounded">
        <option>All Regions</option>
        <option>Asia</option>
        <option>Europe</option>
        <option>Africa</option>
        <option>Americas</option>
      </select>

      <select className="bg-gray-700 px-4 py-2 rounded">
        <option>All Income Groups</option>
        <option>High</option>
        <option>Middle</option>
        <option>Low</option>
      </select>
    </div>
  );
}
