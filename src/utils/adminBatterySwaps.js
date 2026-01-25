import { auth } from "../config/firebase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").replace(
  /\/+$/g,
  ""
);

async function apiFetch(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;

  const token = await auth.currentUser?.getIdToken?.();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function adminListBatterySwaps({ search = "", start = "", end = "" } = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", String(search));
  if (start) qs.set("start", String(start));
  if (end) qs.set("end", String(end));
  const query = qs.toString();
  return apiFetch(`/api/admin/battery-swaps${query ? `?${query}` : ""}`);
}

export async function adminUpdateBatterySwap(id, patch) {
  return apiFetch(`/api/admin/battery-swaps/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch || {}),
  });
}

export async function adminDeleteBatterySwap(id) {
  return apiFetch(`/api/admin/battery-swaps/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function adminDeleteBatterySwaps(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return apiFetch(`/api/admin/battery-swaps/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function adminBatterySwapsDaily({ days = 14 } = {}) {
  const qs = new URLSearchParams({ days: String(days) }).toString();
  return apiFetch(`/api/admin/battery-swaps/daily?${qs}`);
}

export async function adminBatterySwapsTopBatteries({ days = 30 } = {}) {
  const qs = new URLSearchParams({ days: String(days) }).toString();
  return apiFetch(`/api/admin/battery-swaps/top-batteries?${qs}`);
}

export async function adminBatterySwapsTopVehicles({ days = 30 } = {}) {
  const qs = new URLSearchParams({ days: String(days) }).toString();
  return apiFetch(`/api/admin/battery-swaps/top-vehicles?${qs}`);
}

export async function adminBatterySwapsTopRiders({ days = 30 } = {}) {
  const qs = new URLSearchParams({ days: String(days) }).toString();
  return apiFetch(`/api/admin/battery-swaps/top-riders?${qs}`);
}

export async function adminBatterySwapsLatestByVehicle({ search = "" } = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", String(search));
  const query = qs.toString();
  return apiFetch(`/api/admin/battery-swaps/latest-by-vehicle${query ? `?${query}` : ""}`);
}
