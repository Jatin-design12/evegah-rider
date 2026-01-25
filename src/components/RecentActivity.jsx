export default function RecentActivity() {
  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h3 className="font-semibold text-gray-700 mb-4">Recent Activity</h3>

      <ul className="space-y-3 text-sm text-gray-600">
        <li>🟢 New rider registered – Zone 2</li>
        <li>🔵 Bike returned – MP09AB1234</li>
        <li>🟣 Retained rider renewed plan</li>
      </ul>
    </div>
  );
}
