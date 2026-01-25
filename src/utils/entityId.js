function sanitizeId(value) {
  const s = String(value || "").trim();
  const base = s.split("-")[0] || s;
  const clean = base.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return clean;
}

function formatEntityId(value, prefix) {
  const clean = sanitizeId(value);
  if (!clean) return "-";
  const segment = clean.slice(0, Math.min(clean.length, 8));
  return `${prefix}-${segment}`;
}

export function formatRentalId(value) {
  return formatEntityId(value, "RNTL");
}

export function formatReturnId(value) {
  return formatEntityId(value, "RETN");
}

export function formatDocumentId(value) {
  return formatEntityId(value, "EVEGAH");
}
