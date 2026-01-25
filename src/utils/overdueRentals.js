import { apiFetch } from "../config/api";

export async function listOverdueRentals(employeeUid) {
  const query = employeeUid
    ? new URLSearchParams({ employeeUid }).toString()
    : "";
  const suffix = query ? `?${query}` : "";
  return apiFetch(`/api/rentals/overdue${suffix}`);
}
