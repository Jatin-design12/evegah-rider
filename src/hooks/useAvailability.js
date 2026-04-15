import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../config/api";

export default function useAvailability({ enabled = true, pollMs = 15000 } = {}) {
  const [unavailableVehicleIds, setUnavailableVehicleIds] = useState([]);
  const [unavailableBatteryIds, setUnavailableBatteryIds] = useState([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const mountedRef = useRef(true);

  const applyData = useCallback((data) => {
    if (!mountedRef.current) return;
    setUnavailableVehicleIds(Array.isArray(data?.unavailableVehicleIds) ? data.unavailableVehicleIds : []);
    setUnavailableBatteryIds(Array.isArray(data?.unavailableBatteryIds) ? data.unavailableBatteryIds : []);
    setAvailabilityError("");
  }, []);

  const clearData = useCallback((errorMessage = "") => {
    if (!mountedRef.current) return;
    setUnavailableVehicleIds([]);
    setUnavailableBatteryIds([]);
    setAvailabilityError(String(errorMessage || ""));
  }, []);

  const refreshAvailability = useCallback(async () => {
    if (!enabled) {
      clearData("");
      return null;
    }

    try {
      const data = await apiFetch("/api/availability");
      applyData(data);
      return data;
    } catch (error) {
      clearData(String(error?.message || error || "Unable to load availability"));
      return null;
    }
  }, [enabled, applyData, clearData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearData("");
      return undefined;
    }

    refreshAvailability();
    if (!pollMs || pollMs <= 0) return undefined;

    const timer = setInterval(() => {
      refreshAvailability();
    }, pollMs);

    return () => clearInterval(timer);
  }, [enabled, pollMs, refreshAvailability, clearData]);

  return useMemo(
    () => ({
      unavailableVehicleIds,
      unavailableBatteryIds,
      availabilityError,
      refreshAvailability,
    }),
    [unavailableVehicleIds, unavailableBatteryIds, availabilityError, refreshAvailability]
  );
}
