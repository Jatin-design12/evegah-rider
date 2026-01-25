import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../config/api";

export function useLiveStats() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    retained: 0,
    returned: 0,
    earnings: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const [summary, returnsRows] = await Promise.all([
        apiFetch("/api/dashboard/summary"),
        apiFetch("/api/returns"),
      ]);

      const total = Number(summary?.totalRiders || 0);
      const returned = Array.isArray(returnsRows) ? returnsRows.length : 0;

      // Legacy fields: the local schema does not track retain-vs-new rider_type.
      const retained = 0;

      setStats({
        total,
        new: total,
        retained,
        returned,
        earnings: Number(summary?.revenue || 0),
      });
    } catch {
      setStats({ total: 0, new: 0, retained: 0, returned: 0, earnings: 0 });
    }
  }, []);

  useEffect(() => {
    const t0 = setTimeout(fetchStats, 0);
    const timer = setInterval(fetchStats, 15000);
    return () => {
      clearTimeout(t0);
      clearInterval(timer);
    };
  }, [fetchStats]);

  return stats;
}
  