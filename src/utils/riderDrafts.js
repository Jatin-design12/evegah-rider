const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

async function apiFetch(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

function buildQuery(filters) {
  const query = new URLSearchParams(filters || {}).toString();
  return query ? `?${query}` : "";
}

export async function listRiderDrafts(employeeUid) {
  const suffix = buildQuery(employeeUid ? { employeeUid } : {});
  return apiFetch(`/api/drafts${suffix}`);
}

export async function getRiderDraft(draftId) {
  return apiFetch(`/api/drafts/${draftId}`);
}

export async function createRiderDraft(payload) {
  return apiFetch(`/api/drafts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRiderDraft(draftId, patch) {
  return apiFetch(`/api/drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteRiderDraft(draftId) {
  await apiFetch(`/api/drafts/${draftId}`, {
    method: "DELETE",
  });
}
