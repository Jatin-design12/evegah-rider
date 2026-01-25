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
