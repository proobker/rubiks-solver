import { describe, expect, it } from 'vitest';
import { averageOf, best, formatTime, mean, relativeTime } from './stats';

describe('timer stats', () => {
  it('computes a WCA average by dropping the best and worst', () => {
    expect(averageOf([10_000, 12_000, 11_000, 30_000, 9_000], 5)).toBe(11_000);
  });

  it('uses only the last n times', () => {
    expect(averageOf([1, 10_000, 12_000, 11_000, 30_000, 9_000], 5)).toBe(11_000);
  });

  it('returns null when there are not enough times', () => {
    expect(averageOf([1, 2, 3, 4], 5)).toBeNull();
    expect(mean([])).toBeNull();
    expect(best([])).toBeNull();
  });

  it('formats times', () => {
    expect(formatTime(9_876)).toBe('9.87');
    expect(formatTime(65_432)).toBe('1:05.43');
    expect(formatTime(0)).toBe('0.00');
  });

  it('formats relative times', () => {
    const now = 1_000_000_000;
    expect(relativeTime(now - 10_000, now)).toBe('just now');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago');
  });
});
