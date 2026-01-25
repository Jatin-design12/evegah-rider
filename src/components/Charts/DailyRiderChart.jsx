import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DailyRidesChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-gray-400">
        No rides data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
