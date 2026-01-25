import { apiFetch } from "../config/api";

export async function lookupRider({ phone, aadhaar }) {
  const phoneDigits = String(phone || "").replace(/\D/g, "").slice(0, 10);
  const aadhaarDigits = String(aadhaar || "").replace(/\D/g, "").slice(0, 12);

  if (!phoneDigits && !aadhaarDigits) return null;

  const data = await apiFetch(
    `/api/riders/lookup?phone=${encodeURIComponent(phoneDigits)}&aadhaar=${encodeURIComponent(aadhaarDigits)}`
  );
  if (!data) return null;

  // Keep the old shape that Step 1 expects.
  return {
    id: data.id,
    name: data.full_name || "",
    phone: data.mobile || "",
    aadhaar: data.aadhaar || "",
    gender: data.gender || "",
    bikeModel: "",
  };
}
