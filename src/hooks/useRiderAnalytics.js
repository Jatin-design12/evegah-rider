import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../config/api";

export default function useRiderAnalytics() {
  const [totalRiders, setTotalRiders] = useState(0);
  const [activeRiders, setActiveRiders] = useState(0);
  const [suspendedRiders, setSuspendedRiders] = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [zoneStats, setZoneStats] = useState([]);

  const loadAll = useCallback(async () => {
    try {
      const payload = await apiFetch("/api/analytics/summary");
      setTotalRiders(payload?.totalRiders || 0);
      setActiveRiders(payload?.activeRiders || 0);
      setSuspendedRiders(payload?.suspendedRiders || 0);
      setTotalRides(payload?.totalRides || 0);
      setZoneStats(Array.isArray(payload?.zoneStats) ? payload.zoneStats : []);
    } catch (e) {
      setTotalRiders(0);
      setActiveRiders(0);
      setSuspendedRiders(0);
      setTotalRides(0);
      setZoneStats([]);
      // keep console noise minimal; Analytics page can show zeros
      console.error("Analytics summary error", e);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    totalRiders,
    activeRiders,
    suspendedRiders,
    totalRides,
    zoneStats,
  };
}
