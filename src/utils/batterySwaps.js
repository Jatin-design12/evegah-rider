import { apiFetch } from "../config/api";

function buildQuery(filters) {
  const query = new URLSearchParams(filters || {}).toString();
  return query ? `?${query}` : "";
}

export async function listBatterySwaps(employeeUid) {
  const suffix = buildQuery(employeeUid ? { employeeUid } : {});
  return apiFetch(`/api/battery-swaps${suffix}`);
}

export async function createBatterySwap(payload) {
  return apiFetch(`/api/battery-swaps`, {
    method: "POST",
    body: payload,
  });
}

export async function getBatteryUsage(employeeUid) {
  const suffix = buildQuery(employeeUid ? { employeeUid } : {});
  return apiFetch(`/api/battery-swaps/usage${suffix}`);
}
