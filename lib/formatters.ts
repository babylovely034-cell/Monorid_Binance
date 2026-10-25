/**
 * Deterministic date and time formatters that output the exact same string
 * on both Server Side Rendering (SSR) and Client Browsers to eliminate
 * React hydration mismatch errors.
 */

export function formatUtcTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} UTC`;
}

export function formatUtcDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}
