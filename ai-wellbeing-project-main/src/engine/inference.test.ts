
import { describe, it, expect } from 'vitest';
import { runFuzzyInference } from './inference';

describe('Stress Assessment Testing', () => {
  it('should calculate a valid stress score', () => {
    const result = runFuzzyInference(65, 6, 7);

    expect(Number.isFinite(result.crisp_stress_index)).toBe(true);
    expect(result.crisp_stress_index).toBeGreaterThanOrEqual(0);
    expect(result.crisp_stress_index).toBeLessThanOrEqual(100);
  });

  it('should accept minimum boundary values', () => {
    const result = runFuzzyInference(20, 0, 2);

    expect(Number.isFinite(result.crisp_stress_index)).toBe(true);
  });

  it('should accept maximum boundary values', () => {
    const result = runFuzzyInference(120, 16, 10);

    expect(Number.isFinite(result.crisp_stress_index)).toBe(true);
  });

  it('should clamp HRV below the minimum', () => {
    const invalid = runFuzzyInference(10, 6, 7);
    const minimum = runFuzzyInference(20, 6, 7);

    expect(invalid.crisp_stress_index).toBe(
      minimum.crisp_stress_index
    );
  });

  it('should handle NaN without producing an invalid score', () => {
    const result = runFuzzyInference(NaN, 6, 7);

    expect(Number.isFinite(result.crisp_stress_index)).toBe(true);
  });
});
