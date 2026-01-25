export default function TopBar() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-3xl font-bold text-gray-800">
        Dashboard Overview
      </h1>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-gray-200 rounded-lg">Today</button>
        <button className="px-4 py-2 bg-gray-200 rounded-lg">This Week</button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          This Month
        </button>
      </div>
    </div>
  );
}
