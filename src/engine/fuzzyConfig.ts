import { UniverseConfig } from '../types';

export const HRV_RANGE: [number, number] = [20.0, 120.0];
export const SCREEN_TIME_RANGE: [number, number] = [0.0, 16.0];
export const SLEEP_RANGE: [number, number] = [2.0, 10.0];
export const STRESS_RANGE: [number, number] = [0.0, 100.0];

export const HRV_TERMS = ['low', 'normal', 'high'] as const;
export const SCREEN_TERMS = ['short', 'moderate', 'prolonged'] as const;
export const SLEEP_TERMS = ['inadequate', 'marginal', 'optimal'] as const;
export const STRESS_TERMS = ['low', 'medium', 'high'] as const;

export const UNIVERSE_CONFIG: Record<string, UniverseConfig> = {
  hrv: {
    min: 20.0,
    max: 120.0,
    step: 1.0,
    unit: 'ms',
    label: 'Heart Rate Variability (SDNN/RMSSD)',
    default: 65.0,
    range: HRV_RANGE,
  },
  screen_time: {
    min: 0.0,
    max: 16.0,
    step: 0.5,
    unit: 'hours',
    label: 'Daily Screen Time',
    default: 6.0,
    range: SCREEN_TIME_RANGE,
  },
  sleep_duration: {
    min: 2.0,
    max: 10.0,
    step: 0.5,
    unit: 'hours',
    label: 'Sleep Duration',
    default: 7.0,
    range: SLEEP_RANGE,
  },
  stress_index: {
    min: 0.0,
    max: 100.0,
    step: 1.0,
    unit: 'pts',
    label: 'Stress Index',
    default: 50.0,
    range: STRESS_RANGE,
  },
};

export const HRV_MF: Record<string, [number, number, number, number] | [number, number, number]> = {
  low: [20.0, 20.0, 35.0, 50.0],
  normal: [35.0, 55.0, 75.0],
  high: [60.0, 80.0, 120.0, 120.0],
};

export const SCREEN_TIME_MF: Record<string, [number, number, number, number] | [number, number, number]> = {
  short: [0.0, 0.0, 2.0, 5.0],
  moderate: [3.0, 6.0, 9.0],
  prolonged: [7.0, 11.0, 16.0, 16.0],
};

export const SLEEP_MF: Record<string, [number, number, number, number] | [number, number, number]> = {
  inadequate: [2.0, 2.0, 4.0, 5.5],
  marginal: [4.5, 6.0, 7.5],
  optimal: [6.5, 8.0, 10.0, 10.0],
};

export const STRESS_MF: Record<string, [number, number, number]> = {
  low: [0.0, 0.0, 40.0],
  medium: [25.0, 50.0, 75.0],
  high: [60.0, 100.0, 100.0],
};

export const STRESS_THRESHOLDS = {
  medium_min: 40.0,
  high_min: 70.0,
};

export const STRESS_CATEGORIES = ['Low', 'Medium', 'High'] as const;

export const AVAILABLE_TIME_OPTIONS = [
  '5 minutes',
  '10 minutes',
  '20+ minutes',
];

export const CONTEXT_OPTIONS = [
  'Home',
  'University',
  'Work',
  'Other',
];

export const APP_METADATA = {
  title: 'stressina.AI — Intelligent Healthcare & Well-being Solution',
  subtitle: 'Fuzzy Logic Stress Classification & Adaptive Coping Recommendation',
  course: 'Essentials of Artificial Intelligence – IT3182',
  group: 'Group 12 | General Sir John Kotelawala Defence University, Faculty of Computing',
  disclaimer:
    'This system provides an educational well-being estimate based on the information entered by the user. It is not a medical diagnosis or substitute for professional healthcare advice.',
};
