import AdminSidebar from "../components/admin/AdminSidebar";
import useRiderAnalytics from "../hooks/useRiderAnalytics";
import useLiveAnalytics from "../hooks/useLiveAnalytics";

import DailyRiderChart from "../components/Charts/DailyRiderChart";
import EarningsChart from "../components/Charts/EarningsChart";
import ZonePieChart from "../components/Charts/ZonePieChart";
import RiderStatusPie from "../components/Charts/RiderStatusPie";
import ChartCard from "../components/ChartCard";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Analytics() {
  const {
    totalRiders,
    activeRiders,
    suspendedRiders,
    totalRides,
    zoneStats,
  } = useRiderAnalytics();

  const [days, setDays] = useState(14);
  const [zone, setZone] = useState("");
  const [date, setDate] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    ridersData,
    earningsData,
    zoneData,
    activeZoneCounts,
    loading,
    error,
    refresh,
  } = useLiveAnalytics({ zone, date, days, autoRefresh });

  const totalEarnings = useMemo(() => {
    if (!Array.isArray(earningsData)) return 0;
    return earningsData.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
  }, [earningsData]);

  const avgRidesPerDay = useMemo(() => {
    if (!Array.isArray(ridersData) || ridersData.length === 0) return 0;
    const total = ridersData.reduce((sum, row) => sum + Number(row?.total || 0), 0);
    return Math.round((total / ridersData.length) * 10) / 10;
  }, [ridersData]);

  const activeZoneBarData = useMemo(() => {
    const zones = Array.isArray(activeZoneCounts?.zones) ? activeZoneCounts.zones : [];
    const counts = activeZoneCounts?.counts && typeof activeZoneCounts.counts === "object" ? activeZoneCounts.counts : {};
    return zones.map((z) => ({ zone: z, value: Number(counts[z] || 0) }));
  }, [activeZoneCounts]);

  const zoneOptions = useMemo(() => {
    const fromLive = (Array.isArray(zoneData) ? zoneData : []).map((z) => String(z?.zone || "").trim()).filter(Boolean);
    const fromSummary = (Array.isArray(zoneStats) ? zoneStats : []).map((z) => String(z?.zone || "").trim()).filter(Boolean);
    return Array.from(new Set(["", ...fromLive, ...fromSummary]));
  }, [zoneData, zoneStats]);

  async function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("EVegah – Analytics Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Total Riders", totalRiders],
        ["Active Riders", activeRiders],
        ["Suspended Riders", suspendedRiders],
        ["Total Rides", totalRides],
      ],
    });

    const chartIds = [
      "ridesChart",
      "earningsChart",
      "zoneChart",
      "activeZoneChart",
      "statusChart",
    ];
    let y = doc.lastAutoTable.finalY + 10;

    for (const id of chartIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");
      doc.addImage(img, "PNG", 15, y, 180, 80);
      y += 90;
    }

    doc.save("analytics-report.pdf");
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="text-sm text-gray-500">Filter and explore rides, earnings, and zone performance.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value || 14))}
              className="px-3 py-2 border rounded-md text-sm bg-white"
              title="Period"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
              title="Zone"
            >
              {zoneOptions.map((z) => (
                <option key={z || "all"} value={z}>
                  {z ? z : "All zones"}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
              title="Specific date (optional)"
            />

            <button
              type="button"
              onClick={() => setDate("")}
              className="px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              Clear date
            </button>

            <label className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-white">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>

            <button
              type="button"
              onClick={refresh}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
            Failed to load analytics. Try Refresh.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Kpi title="Total Riders" value={totalRiders} />
          <Kpi title="Active Riders" value={activeRiders} green />
          <Kpi title="Suspended Riders" value={suspendedRiders} red />
          <Kpi title="Total Rides" value={totalRides} />
          <Kpi title={`Earnings (${days}d)`} value={`₹${Math.round(totalEarnings).toLocaleString()}`} />
          <Kpi title="Avg rides / day" value={avgRidesPerDay} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ChartCard
              id="ridesChart"
              title="Rides per day"
              subtitle={zone ? `Zone filter: ${zone}` : `All zones`}
              bodyClassName="pt-2"
            >
              <DailyRiderChart data={ridersData} />
            </ChartCard>
          </div>

          <div className="lg:col-span-4">
            <ChartCard id="zoneChart" title="Rides by zone" subtitle="All-time distribution" bodyClassName="pt-2">
              <ZonePieChart data={Array.isArray(zoneData) && zoneData.length ? zoneData : zoneStats} />
            </ChartCard>
          </div>

          <div className="lg:col-span-8">
            <ChartCard
              id="earningsChart"
              title="Earnings per day"
              subtitle={date ? `Date: ${date}` : `Last ${days} days`}
              bodyClassName="pt-2"
            >
              <EarningsChart data={earningsData} />
            </ChartCard>
          </div>

          <div className="lg:col-span-4">
            <ChartCard id="statusChart" title="Rider status" subtitle="Active vs Suspended" bodyClassName="pt-2">
              <RiderStatusPie
                data={[
                  { name: "Active", value: Number(activeRiders || 0) },
                  { name: "Suspended", value: Number(suspendedRiders || 0) },
                ]}
              />
            </ChartCard>
          </div>

          <div className="lg:col-span-12">
            <ChartCard id="activeZoneChart" title="Active rentals by zone" subtitle="Currently ongoing rentals" bodyClassName="pt-2">
              {activeZoneBarData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-gray-400">No active rentals data</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activeZoneBarData}>
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      </main>
    </div>
  );
}

/* KPI CARD */
function Kpi({ title, value, green, red }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <p className="text-gray-500 text-xs">{title}</p>
      <h2
        className={`mt-1 text-2xl font-bold ${
          green ? "text-green-600" : red ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}
