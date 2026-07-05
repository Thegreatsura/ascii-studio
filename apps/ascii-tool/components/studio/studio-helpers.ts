/* ── Format Bytes ─────────────────────────────────────────────────── */

export function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  const units = ["KB", "MB", "GB"];
  let normalized = value / 1024;
  let unitIndex = 0;
  while (normalized >= 1024 && unitIndex < units.length - 1) {
    normalized /= 1024;
    unitIndex += 1;
  }
  return `${normalized.toFixed(normalized >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}
