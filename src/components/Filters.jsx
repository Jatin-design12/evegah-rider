export default function Filters({ zone, setZone, date, setDate }) {
  return (
    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border shadow">
      <select
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        className="input"
      >
        <option value="">All Zones</option>
        <option>Zone 1</option>
        <option>Zone 2</option>
        <option>Zone 3</option>
        <option>Zone 4</option>
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="input"
      />
    </div>
  );
}
