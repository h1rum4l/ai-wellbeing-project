import { InferenceResult, RuleFiring, StressCategory } from '../types';
import { UNIVERSE_CONFIG, STRESS_MF } from './fuzzyConfig';
import { computeMemberships, trimf } from './membership';
import { ALL_RULES_DATA } from './rules';

export function runFuzzyInference(
  hrvVal: number,
  screenTimeVal: number,
  sleepDurationVal: number
): InferenceResult {
  // 1. Clamp inputs to valid universe ranges with safe fallbacks
  const clamp = (val: number, min: number, max: number, fallback: number) => {
    if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
    return Math.min(Math.max(val, min), max);
  };
  const hrvClamped = clamp(hrvVal, UNIVERSE_CONFIG.hrv.min, UNIVERSE_CONFIG.hrv.max, UNIVERSE_CONFIG.hrv.default);
  const screenClamped = clamp(screenTimeVal, UNIVERSE_CONFIG.screen_time.min, UNIVERSE_CONFIG.screen_time.max, UNIVERSE_CONFIG.screen_time.default);
  const sleepClamped = clamp(sleepDurationVal, UNIVERSE_CONFIG.sleep_duration.min, UNIVERSE_CONFIG.sleep_duration.max, UNIVERSE_CONFIG.sleep_duration.default);

  // 2. Fuzzification
  const memberships = computeMemberships(hrvClamped, screenClamped, sleepClamped);

  // 3. Rule Evaluation (MIN operator)
  const ruleEvaluations: RuleFiring[] = [];

  for (const rMeta of ALL_RULES_DATA) {
    const antecedents = rMeta.antecedent;
    const degrees: number[] = [];
    const clauseStrs: string[] = [];

    if (antecedents.hrv) {
      degrees.push(memberships.hrv[antecedents.hrv]);
      clauseStrs.push(`HRV=${antecedents.hrv.charAt(0).toUpperCase() + antecedents.hrv.slice(1)}`);
    }
    if (antecedents.screen_time) {
      degrees.push(memberships.screen_time[antecedents.screen_time]);
      clauseStrs.push(`Screen=${antecedents.screen_time.charAt(0).toUpperCase() + antecedents.screen_time.slice(1)}`);
    }
    if (antecedents.sleep_duration) {
      degrees.push(memberships.sleep_duration[antecedents.sleep_duration]);
      clauseStrs.push(`Sleep=${antecedents.sleep_duration.charAt(0).toUpperCase() + antecedents.sleep_duration.slice(1)}`);
    }

    const alpha = degrees.length > 0 ? Math.min(...degrees) : 0.0;
    const roundedAlpha = Math.round(alpha * 10000) / 10000;
    const isActive = roundedAlpha > 0.0001;
    const conditionText = clauseStrs.join(' AND ');

    ruleEvaluations.push({
      rule_id: rMeta.id,
      doc_id: rMeta.report_id || rMeta.id,
      rule_type: rMeta.type,
      condition_text: conditionText,
      consequent: rMeta.consequent,
      firing_strength: roundedAlpha,
      recommendation_hint: rMeta.recommendation_hint,
      rationale: rMeta.rationale,
      is_active: isActive,
    });
  }

  const activeRules = ruleEvaluations
    .filter((r) => r.is_active)
    .sort((a, b) => b.firing_strength - a.firing_strength);

  // 4. Output Aggregation across stress universe [0, 100] with step 1 (101 points: 0, 1, ..., 100)
  const step = 1.0;
  const numPoints = Math.round((UNIVERSE_CONFIG.stress_index.max - UNIVERSE_CONFIG.stress_index.min) / step) + 1;
  const stressUniverse: number[] = new Array(numPoints);
  for (let i = 0; i < numPoints; i++) {
    stressUniverse[i] = UNIVERSE_CONFIG.stress_index.min + i * step;
  }

  const lowMf = stressUniverse.map((z) => trimf(z, STRESS_MF.low));
  const medMf = stressUniverse.map((z) => trimf(z, STRESS_MF.medium));
  const highMf = stressUniverse.map((z) => trimf(z, STRESS_MF.high));

  const mfLookup: Record<StressCategory, number[]> = {
    Low: lowMf,
    Medium: medMf,
    High: highMf,
  };

  const aggregatedFuzzySet: number[] = new Array(numPoints).fill(0.0);

  for (const firing of ruleEvaluations) {
    if (firing.firing_strength > 0.0001) {
      const targetMf = mfLookup[firing.consequent];
      for (let i = 0; i < numPoints; i++) {
        const clipped = Math.min(firing.firing_strength, targetMf[i]);
        if (clipped > aggregatedFuzzySet[i]) {
          aggregatedFuzzySet[i] = clipped;
        }
      }
    }
  }

  // 5. Centroid Defuzzification
  // Centroid = sum(z * mu(z)) / sum(mu(z))
  let numerator = 0.0;
  let denominator = 0.0;

  for (let i = 0; i < numPoints; i++) {
    const mu = aggregatedFuzzySet[i];
    const z = stressUniverse[i];
    numerator += z * mu;
    denominator += mu;
  }

  let crispStress = denominator > 1e-6 ? numerator / denominator : 50.0;
  crispStress = Math.min(Math.max(crispStress, 0.0), 100.0);
  const roundedStress = Math.round(crispStress * 100) / 100;

  return {
    inputs: {
      hrv: hrvVal,
      screen_time: screenTimeVal,
      sleep_duration: sleepDurationVal,
    },
    memberships,
    crisp_stress_index: roundedStress,
    rule_evaluations: ruleEvaluations,
    active_rules: activeRules,
    aggregated_fuzzy_set: aggregatedFuzzySet,
    stress_universe: stressUniverse,
  };
}
