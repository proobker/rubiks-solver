/** WCA-style average of the last `n` times: drop the best and worst, mean the rest. */
export function averageOf(timesMs: number[], n: number): number | null {
  if (n < 3 || timesMs.length < n) return null;
  const sorted = [...timesMs.slice(-n)].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
}

export function mean(timesMs: number[]): number | null {
  if (timesMs.length === 0) return null;
  return timesMs.reduce((sum, t) => sum + t, 0) / timesMs.length;
}

export function best(timesMs: number[]): number | null {
  return timesMs.length > 0 ? Math.min(...timesMs) : null;
}

export function formatTime(ms: number): string {
  const totalCentis = Math.floor(Math.round(ms) / 10);
  const minutes = Math.floor(totalCentis / 6000);
  const seconds = Math.floor(totalCentis / 100) % 60;
  const cc = (totalCentis % 100).toString().padStart(2, '0');
  if (minutes === 0) return `${seconds}.${cc}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${cc}`;
}

export function relativeTime(ts: number, now: number): string {
  const s = Math.round((now - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
