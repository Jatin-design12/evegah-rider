const ISO_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (n) => String(n).padStart(2, "0");

export function formatDateDDMMYYYY(value, fallback = "-") {
  if (!value) return fallback;

  // Avoid timezone shifts for ISO date-only strings.
  if (typeof value === "string" && ISO_DATE_ONLY_RE.test(value)) {
    const [yyyy, mm, dd] = value.split("-");
    if (yyyy && mm && dd) return `${dd}/${mm}/${yyyy}`;
    return fallback;
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;

  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTimeDDMMYYYY(value, fallback = "-") {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;

  const datePart = formatDateDDMMYYYY(d, fallback);
  if (datePart === fallback) return fallback;

  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${datePart} ${hh}:${mi}`;
}
