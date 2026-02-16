import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../config/api";

const ZONES = [
  "Gotri",
  "Manjalpur",
  "Karelibaug",
  "Daman",
  "Aatapi",
  "Waghodiya",
  "Ajwa Road",
  "Chhani",
  "Anand",
];

export default function useVehicleZoneCounts() {
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(ZONES.map((z) => [z, 0]))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const payload = await apiFetch("/api/analytics/active-zone-counts");
        const next = payload?.counts || Object.fromEntries(ZONES.map((z) => [z, 0]));
        if (mounted) setCounts(next);
      } catch (e) {
        if (!mounted) return;
        setCounts(Object.fromEntries(ZONES.map((z) => [z, 0])));
        setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCounts();

    const timer = setInterval(fetchCounts, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return useMemo(
    () => ({ counts, loading, error, zones: ZONES }),
    [counts, loading, error]
  );
}
