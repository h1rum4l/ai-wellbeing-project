import { CopingRecommendation, ExplanationPayload, InferenceResult, StressCategory } from '../types';

export function identifyStressDrivers(memberships: InferenceResult['memberships']): string[] {
  const drivers: string[] = [];

  const hrvLow = memberships.hrv.low;
  const screenProlonged = memberships.screen_time.prolonged;
  const sleepInadequate = memberships.sleep_duration.inadequate;
  const sleepMarginal = memberships.sleep_duration.marginal;

  if (hrvLow >= 0.3) {
    drivers.push(
      `Low Heart Rate Variability (degree: ${hrvLow.toFixed(2)}) indicating autonomic parasympathetic suppression`
    );
  }
  if (screenProlonged >= 0.3) {
    drivers.push(
      `Prolonged Screen Time (degree: ${screenProlonged.toFixed(2)}) indicating digital fatigue & sensory overload`
    );
  }
  if (sleepInadequate >= 0.3) {
    drivers.push(
      `Inadequate Sleep (degree: ${sleepInadequate.toFixed(2)}) indicating severe circadian & physical debt`
    );
  } else if (sleepMarginal >= 0.5) {
    drivers.push(
      `Marginal Sleep (degree: ${sleepMarginal.toFixed(2)}) reflecting borderline restorative rest`
    );
  }

  if (drivers.length === 0) {
    drivers.push('Balanced physiological markers with low acute stress indicators');
  }

  return drivers;
}

export function formatTextExplanation(
  crispIndex: number,
  category: StressCategory,
  inputs: InferenceResult['inputs'],
  memberships: InferenceResult['memberships'],
  activeRules: InferenceResult['active_rules'],
  recommendation: CopingRecommendation
): string {
  const lines: string[] = [
    `Stress Index: ${crispIndex.toFixed(0)} / 100  ->  ${category.toUpperCase()}`,
    '',
    'Membership Degrees:',
    `  HRV ${inputs.hrv.toFixed(0)} ms   ->  Low: ${memberships.hrv.low.toFixed(2)} | Normal: ${memberships.hrv.normal.toFixed(2)} | High: ${memberships.hrv.high.toFixed(2)}`,
    `  Screen ${inputs.screen_time.toFixed(1)}h ->  Short: ${memberships.screen_time.short.toFixed(2)} | Moderate: ${memberships.screen_time.moderate.toFixed(2)} | Prolonged: ${memberships.screen_time.prolonged.toFixed(2)}`,
    `  Sleep ${inputs.sleep_duration.toFixed(1)}h  ->  Inadequate: ${memberships.sleep_duration.inadequate.toFixed(2)} | Marginal: ${memberships.sleep_duration.marginal.toFixed(2)} | Optimal: ${memberships.sleep_duration.optimal.toFixed(2)}`,
    '',
    'Active Rules:',
  ];

  if (activeRules.length > 0) {
    for (const r of activeRules) {
      lines.push(
        `  ${r.rule_id.padEnd(4)} [${r.condition_text}]  ->  ${r.consequent}  (strength: ${r.firing_strength.toFixed(2)})`
      );
    }
  } else {
    lines.push('  No individual rule fired above activation threshold.');
  }

  lines.push(
    '',
    `Recommendation: ${recommendation.title}`,
    `Reason: ${recommendation.selection_rationale || recommendation.reason}`
  );

  return lines.join('\n');
}

export function generateExplanation(
  inferenceResult: InferenceResult,
  stressCategory: StressCategory,
  recommendation: CopingRecommendation
): ExplanationPayload {
  const { inputs, memberships, active_rules: activeRules, crisp_stress_index: crispIndex } = inferenceResult;

  const stressDrivers = identifyStressDrivers(memberships);
  const formattedText = formatTextExplanation(
    crispIndex,
    stressCategory,
    inputs,
    memberships,
    activeRules,
    recommendation
  );

  return {
    crisp_stress_index: crispIndex,
    stress_category: stressCategory,
    inputs,
    memberships,
    active_rules: activeRules.map((r) => ({
      rule_id: r.rule_id,
      doc_id: r.doc_id,
      rule_type: r.rule_type,
      condition: r.condition_text,
      consequent: r.consequent,
      firing_strength: r.firing_strength,
      rationale: r.rationale,
    })),
    stress_drivers: stressDrivers,
    recommendation,
    formatted_text: formattedText,
  };
}
