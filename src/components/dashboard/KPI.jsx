export default function KPI({ title, value, highlight }) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm ${
      highlight ? "border-purple-500" : "border-gray-200"
    }`}>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </h3>
    </div>
  );
}
