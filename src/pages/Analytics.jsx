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
import { downloadCsv } from "../utils/downloadCsv";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";

export default function Analytics() {
  const {
    totalRiders,
    activeRiders,
    suspendedRiders,
    totalRides,
    zoneStats,
  } = useRiderAnalytics();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [csvDataset, setCsvDataset] = useState("rides");
  const [days, setDays] = useState(14);
  const [date, setDate] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const {
    ridersData,
    earningsData,
    zoneData,
    activeZoneCounts,
    loading,
    error,
    refresh,
  } = useLiveAnalytics({ autoRefresh, days, date: date || undefined });

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

  async function exportPDF() {
    if (exportingPdf) return;
    setExportingPdf(true);

    const sleepForRender = () => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const addCanvasAcrossPages = ({ doc, canvas, marginMm = 14 }) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidthMm = pageWidth - marginMm * 2;
      const contentHeightMm = pageHeight - marginMm * 2;
      if (contentWidthMm <= 0 || contentHeightMm <= 0 || canvas.width <= 0 || canvas.height <= 0) return;

      const pxPerMm = canvas.width / contentWidthMm;
      const pageSliceHeightPx = Math.max(1, Math.floor(contentHeightMm * pxPerMm));

      let offsetY = 0;
      let firstSlice = true;

      while (offsetY < canvas.height) {
        const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - offsetY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;

        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;

        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        if (!firstSlice) doc.addPage();
        firstSlice = false;

        const sliceHeightMm = sliceHeightPx / pxPerMm;
        doc.addImage(sliceCanvas.toDataURL("image/png"), "PNG", marginMm, marginMm, contentWidthMm, sliceHeightMm);

        offsetY += sliceHeightPx;
      }
    };

    try {
      await sleepForRender();

      const doc = new jsPDF("p", "mm", "a4");
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
          ["Earnings", `₹${Math.round(totalEarnings).toLocaleString()}`],
          ["Avg rides / day", avgRidesPerDay],
        ],
      });

      const sectionIds = [
        "analyticsHeaderSection",
        "analyticsKpiSection",
        "ridesChart",
        "zoneChart",
        "earningsChart",
        "statusChart",
        "activeZoneChart",
      ];

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginMm = 14;
      const contentWidthMm = pageWidth - marginMm * 2;
      const maxSectionHeightMm = pageHeight - marginMm * 2;

      let currentY = (doc.lastAutoTable?.finalY || 34) + 8;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;

        const canvas = await html2canvas(el, {
          backgroundColor: "#ffffff",
          useCORS: true,
          scale: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
          logging: false,
        });

        const sectionHeightMm = (canvas.height * contentWidthMm) / canvas.width;

        if (sectionHeightMm <= maxSectionHeightMm) {
          if (currentY + sectionHeightMm > pageHeight - marginMm) {
            doc.addPage();
            currentY = marginMm;
          }
          doc.addImage(canvas.toDataURL("image/png"), "PNG", marginMm, currentY, contentWidthMm, sectionHeightMm);
          currentY += sectionHeightMm + 6;
        } else {
          doc.addPage();
          addCanvasAcrossPages({ doc, canvas, marginMm });
          currentY = pageHeight;
        }
      }

      doc.save("analytics-report.pdf");
    } finally {
      setExportingPdf(false);
    }
  }

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);

    if (csvDataset === "rides") {
      return downloadCsv({
        filename: `analytics_rides_${today}.csv`,
        columns: [
          { key: "date", header: "Date" },
          { key: "day", header: "Day" },
          { key: "total", header: "Rides" },
        ],
        rows: Array.isArray(ridersData) ? ridersData : [],
      });
    }

    if (csvDataset === "earnings") {
      return downloadCsv({
        filename: `analytics_earnings_${today}.csv`,
        columns: [
          { key: "date", header: "Date" },
          { key: "amount", header: "Amount" },
        ],
        rows: Array.isArray(earningsData) ? earningsData : [],
      });
    }

    if (csvDataset === "zones") {
      const rows = Array.isArray(zoneData) && zoneData.length ? zoneData : zoneStats;
      return downloadCsv({
        filename: `analytics_zone_distribution_${today}.csv`,
        columns: [
          { key: "zone", header: "Zone" },
          { key: "value", header: "Rides" },
        ],
        rows: Array.isArray(rows) ? rows : [],
      });
    }

    if (csvDataset === "active_zones") {
      return downloadCsv({
        filename: `analytics_active_rentals_by_zone_${today}.csv`,
        columns: [
          { key: "zone", header: "Zone" },
          { key: "value", header: "Active Rentals" },
        ],
        rows: activeZoneBarData,
      });
    }
  };

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto relative z-10 p-8 pb-0 overflow-x-hidden sm:ml-[var(--admin-sidebar-width,16rem)]">
          <div className="space-y-6">
            <div id="analyticsHeaderSection" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Analytics Dashboard
                </h1>
                <p className="text-md text-slate-600 mt-2">Filter and explore rides, earnings, and zone performance.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm">
                  <span className="text-slate-600">From date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />

                  <span className="text-slate-600">Days</span>
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value || 14))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {[7, 14, 30, 60, 90].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium shadow-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded-lg accent-evegah-primary"
                  />
                  Auto-refresh
                </label>

                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-evegah-primary to-brand-medium text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  onClick={exportPDF}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                >
                  {exportingPdf ? "Exporting…" : "Export PDF"}
                </button>

                <select
                  value={csvDataset}
                  onChange={(e) => setCsvDataset(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-sm font-medium shadow-sm"
                  title="CSV dataset"
                >
                  <option value="rides">CSV: Rides</option>
                  <option value="earnings">CSV: Earnings</option>
                  <option value="zones">CSV: Zones</option>
                  <option value="active_zones">CSV: Active zones</option>
                </select>


                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  disabled={loading}
                >
                  <span className="inline-flex items-center gap-2">
                    <Download size={16} />
                    Export CSV
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-lg border border-red-200/50 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Failed to load analytics</h3>
                    <p className="text-red-600 text-lg">Try refreshing the page.</p>
                  </div>
                </div>
              </div>
            )}

            <div id="analyticsKpiSection" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <Kpi title="Total Riders" value={totalRiders} />
              <Kpi title="Active Riders" value={activeRiders} green />
              <Kpi title="Suspended Riders" value={suspendedRiders} red />
              <Kpi title="Total Rides" value={totalRides} />
              <Kpi title="Earnings" value={`₹${Math.round(totalEarnings).toLocaleString()}`} />
              <Kpi title="Avg rides / day" value={avgRidesPerDay} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <ChartCard id="ridesChart" title="Rides per day" subtitle="All zones" bodyClassName="min-h-[320px]">
                  <DailyRiderChart data={ridersData} />
                </ChartCard>
              </div>

              <div className="lg:col-span-4">
                <ChartCard id="zoneChart" title="Rides by zone" subtitle="All-time distribution" bodyClassName="min-h-[320px]">
                  <ZonePieChart data={Array.isArray(zoneData) && zoneData.length ? zoneData : zoneStats} />
                </ChartCard>
              </div>

              <div className="lg:col-span-8">
                <ChartCard id="earningsChart" title="Earnings per day" subtitle="Real-time data" bodyClassName="min-h-[320px]">
                  <EarningsChart data={earningsData} />
                </ChartCard>
              </div>

              <div className="lg:col-span-4">
                <ChartCard id="statusChart" title="Rider status" subtitle="Active vs Suspended" bodyClassName="min-h-[320px]">
                  <RiderStatusPie
                    data={[
                      { name: "Active", value: Number(activeRiders || 0) },
                      { name: "Suspended", value: Number(suspendedRiders || 0) },
                    ]}
                  />
                </ChartCard>
              </div>

              <div className="lg:col-span-12">
                <ChartCard id="activeZoneChart" title="Active rentals by zone" subtitle="Currently ongoing rentals" bodyClassName="min-h-[360px]">
                  {activeZoneBarData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-slate-400 text-lg">No active rentals data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={activeZoneBarData}>
                        <XAxis dataKey="zone" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="value" fill="url(#activeZoneGradient)" radius={[12, 12, 0, 0]} />
                        <defs>
                          <linearGradient id="activeZoneGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

/* KPI CARD */
function Kpi({ title, value, green, red }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <h2
        className={`text-3xl font-black ${green ? "text-green-600" : red ? "text-red-600" : "text-slate-800"
          }`}
      >
        {value}
      </h2>
    </div>
  );
}
