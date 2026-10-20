import { HRV_MF, SCREEN_TIME_MF, SLEEP_MF } from './fuzzyConfig';

/**
 * Trapezoidal membership function.
 * [a, b, c, d] parameters
 */
export function trapmf(x: number, params: [number, number, number, number]): number {
  const [a, b, c, d] = params;
  if (x <= a || x >= d) {
    // Edge case: if a == b == x or c == d == x
    if (x === a && a === b) return 1.0;
    if (x === d && c === d) return 1.0;
    return 0.0;
  }
  if (x >= b && x <= c) {
    return 1.0;
  }
  if (x > a && x < b) {
    return b === a ? 1.0 : (x - a) / (b - a);
  }
  if (x > c && x < d) {
    return d === c ? 1.0 : (d - x) / (d - c);
  }
  return 0.0;
}

/**
 * Triangular membership function.
 * [a, b, c] parameters
 */
export function trimf(x: number, params: [number, number, number]): number {
  const [a, b, c] = params;
  if (x <= a || x >= c) {
    if (x === a && a === b) return 1.0;
    if (x === c && b === c) return 1.0;
    return 0.0;
  }
  if (x === b) {
    return 1.0;
  }
  if (x > a && x < b) {
    return b === a ? 1.0 : (x - a) / (b - a);
  }
  if (x > b && x < c) {
    return c === b ? 1.0 : (c - x) / (c - b);
  }
  return 0.0;
}

export function computeMemberships(
  hrvVal: number,
  screenTimeVal: number,
  sleepDurationVal: number
) {
  const clamp = (val: number, min: number, max: number, fallback: number) => {
    if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
    return Math.min(Math.max(val, min), max);
  };

  const hrv = clamp(hrvVal, 20.0, 120.0, 65.0);
  const screen = clamp(screenTimeVal, 0.0, 16.0, 6.0);
  const sleep = clamp(sleepDurationVal, 2.0, 10.0, 7.0);

  const round4 = (num: number) => {
    const clamped = Math.min(Math.max(num, 0.0), 1.0);
    return Math.round(clamped * 10000) / 10000;
  };

  return {
    hrv: {
      low: round4(trapmf(hrv, HRV_MF.low as [number, number, number, number])),
      normal: round4(trimf(hrv, HRV_MF.normal as [number, number, number])),
      high: round4(trapmf(hrv, HRV_MF.high as [number, number, number, number])),
    },
    screen_time: {
      short: round4(trapmf(screen, SCREEN_TIME_MF.short as [number, number, number, number])),
      moderate: round4(trimf(screen, SCREEN_TIME_MF.moderate as [number, number, number])),
      prolonged: round4(trapmf(screen, SCREEN_TIME_MF.prolonged as [number, number, number, number])),
    },
    sleep_duration: {
      inadequate: round4(trapmf(sleep, SLEEP_MF.inadequate as [number, number, number, number])),
      marginal: round4(trimf(sleep, SLEEP_MF.marginal as [number, number, number])),
      optimal: round4(trapmf(sleep, SLEEP_MF.optimal as [number, number, number, number])),
    },
  };
}
