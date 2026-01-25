import { auth } from "../config/firebase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

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

export async function listAuthUsers({ pageToken = null } = {}) {
  const query = new URLSearchParams();
  if (pageToken) query.set("pageToken", String(pageToken));
  const qs = query.toString();
  return apiFetch(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

export async function createAuthUser({ email, password, displayName, role }) {
  return apiFetch(`/api/admin/users`, {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, role }),
  });
}

export async function updateAuthUser(uid, { email, password, displayName, disabled, role }) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify({ email, password, displayName, disabled, role }),
  });
}

export async function deleteAuthUser(uid) {
  if (!uid) throw new Error("uid required");
  return apiFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
}
