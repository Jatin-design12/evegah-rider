const MINUTE_MS = 60 * 1000;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;
const MONTH_MINUTES = 30 * DAY_MINUTES;

export function formatElapsedMDHM(startTime, fallback = "-") {
  if (!startTime) return fallback;

  const startMs = new Date(startTime).getTime();
  if (!startMs || Number.isNaN(startMs)) return fallback;

  const totalMinutes = Math.max(0, Math.floor((Date.now() - startMs) / MINUTE_MS));

  const months = Math.floor(totalMinutes / MONTH_MINUTES);
  const afterMonths = totalMinutes % MONTH_MINUTES;

  const days = Math.floor(afterMonths / DAY_MINUTES);
  const afterDays = afterMonths % DAY_MINUTES;

  const hours = Math.floor(afterDays / HOUR_MINUTES);
  const minutes = afterDays % HOUR_MINUTES;

  if (months > 0) {
    return `${months}M ${days}D ${hours}H ${minutes}M`;
  }

  if (days > 0) {
    return `${days}D ${hours}H ${minutes}M`;
  }

  if (hours > 0) {
    return `${hours}H ${minutes}M`;
  }

  return `${minutes}M`;
}
