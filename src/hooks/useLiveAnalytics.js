import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../config/api";

export default function useLiveAnalytics({ zone, date, days = 14, autoRefresh = true } = {}) {
  const [ridersData, setRidersData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [zoneData, setZoneData] = useState([]);
  const [activeZoneCounts, setActiveZoneCounts] = useState({ zones: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (import.meta.env.VITE_MODE === 'dev') {
      setRidersData([
        { date: "2026-03-22", day: "Sun", total: 45 },
        { date: "2026-03-23", day: "Mon", total: 52 },
        { date: "2026-03-24", day: "Tue", total: 38 },
        { date: "2026-03-25", day: "Wed", total: 61 },
        { date: "2026-03-26", day: "Thu", total: 59 },
        { date: "2026-03-27", day: "Fri", total: 72 },
        { date: "2026-03-28", day: "Sat", total: 85 }
      ]);
      setEarningsData([
        { date: "2026-03-22", amount: 15400 },
        { date: "2026-03-23", amount: 18200 },
        { date: "2026-03-24", amount: 12500 },
        { date: "2026-03-25", amount: 21000 },
        { date: "2026-03-26", amount: 19800 },
        { date: "2026-03-27", amount: 25600 },
        { date: "2026-03-28", amount: 31000 }
      ]);
      setZoneData([
        { zone: "Gotri", value: 120 },
        { zone: "Manjalpur", value: 85 },
        { zone: "Karelibaug", value: 65 },
        { zone: "Akota", value: 40 }
      ]);
      setActiveZoneCounts({
        zones: ["Gotri", "Manjalpur", "Karelibaug", "Akota"],
        counts: { Gotri: 25, Manjalpur: 18, Karelibaug: 12, Akota: 8 }
      });
      setLoading(false);
      return;
    }

    try {
      const qsRiders = new URLSearchParams();
      qsRiders.set("days", String(days));
      if (zone) qsRiders.set("zone", zone);
      if (date) qsRiders.set("date", date);

      const qsEarnings = new URLSearchParams();
      qsEarnings.set("days", String(days));
      if (date) qsEarnings.set("date", date);

      const [riders, earnings, zones, activeZones] = await Promise.all([
        apiFetch(`/api/analytics/daily-riders?${qsRiders.toString()}`),
        apiFetch(`/api/analytics/daily-earnings?${qsEarnings.toString()}`),
        apiFetch("/api/analytics/zone-distribution"),
        apiFetch("/api/analytics/active-zone-counts"),
      ]);

      setRidersData(Array.isArray(riders) ? riders : []);
      setEarningsData(Array.isArray(earnings) ? earnings : []);
      setZoneData(Array.isArray(zones) ? zones : []);
      setActiveZoneCounts(
        activeZones && typeof activeZones === "object"
          ? {
              zones: Array.isArray(activeZones.zones) ? activeZones.zones : [],
              counts: activeZones.counts && typeof activeZones.counts === "object" ? activeZones.counts : {},
            }
          : { zones: [], counts: {} }
      );
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [zone, date, days]);

  useEffect(() => {
    fetchAnalytics();
    if (!autoRefresh) return;
    const timer = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(timer);
  }, [fetchAnalytics]);

  return { ridersData, earningsData, zoneData, activeZoneCounts, loading, error, refresh: fetchAnalytics };
}
