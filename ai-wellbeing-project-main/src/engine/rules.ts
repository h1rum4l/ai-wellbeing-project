import { StressCategory } from '../types';
import { HRV_TERMS, SCREEN_TERMS, SLEEP_TERMS } from './fuzzyConfig';

export interface RuleDefinition {
  id: string;
  report_id: string | null;
  type: 'core' | 'supplementary';
  antecedent: {
    hrv?: 'low' | 'normal' | 'high';
    screen_time?: 'short' | 'moderate' | 'prolonged';
    sleep_duration?: 'inadequate' | 'marginal' | 'optimal';
  };
  consequent: StressCategory;
  recommendation_hint: string;
  rationale: string;
  is_documented: boolean;
}

export const CORE_RULES_DATA: RuleDefinition[] = [
  // HRV = LOW
  {
    id: 'C01',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'short', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'Two stress-associated conditions present (Low HRV, Inadequate Sleep); single positive factor (Short Screen) does not override them.',
    is_documented: false,
  },
  {
    id: 'C02',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'short', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Breathing Exercise',
    rationale: 'Mixed profile: one stress-associated factor (Low HRV), one neutral (Marginal Sleep), and one positive (Short Screen).',
    is_documented: false,
  },
  {
    id: 'C03',
    report_id: 'R8',
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'short', sleep_duration: 'optimal' },
    consequent: 'Medium',
    recommendation_hint: 'Monitor / Breathing Exercise',
    rationale: 'Preserved verbatim from Stage 2 report (R8): Low HRV warrants calming and monitoring despite short screen and optimal sleep.',
    is_documented: true,
  },
  {
    id: 'C04',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'moderate', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'Two stress-associated conditions present (Low HRV, Inadequate Sleep); moderate screen time provides no protective offset.',
    is_documented: false,
  },
  {
    id: 'C05',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'moderate', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Breathing Exercise',
    rationale: 'One stress-associated factor (Low HRV) accompanied by neutral screen and sleep demands.',
    is_documented: false,
  },
  {
    id: 'C06',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'moderate', sleep_duration: 'optimal' },
    consequent: 'Medium',
    recommendation_hint: 'Monitor / Breathing Exercise',
    rationale: 'One stress-associated factor (Low HRV) buffered by optimal sleep and moderate screen engagement.',
    is_documented: false,
  },
  {
    id: 'C07',
    report_id: 'R1',
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'prolonged', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Active Cardio Break',
    rationale: 'Preserved verbatim from Stage 2 report (R1): All three stress-associated conditions present simultaneously.',
    is_documented: true,
  },
  {
    id: 'C08',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'prolonged', sleep_duration: 'marginal' },
    consequent: 'High',
    recommendation_hint: 'Digital Detox Reminder',
    rationale: 'Two stress-associated conditions present (Low HRV, Prolonged Screen); drives high cumulative strain.',
    is_documented: false,
  },
  {
    id: 'C09',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'low', screen_time: 'prolonged', sleep_duration: 'optimal' },
    consequent: 'High',
    recommendation_hint: 'Short Walk Break',
    rationale: 'Two stress-associated conditions present (Low HRV, Prolonged Screen); single positive factor (Optimal Sleep) does not override them.',
    is_documented: false,
  },

  // HRV = NORMAL
  {
    id: 'C10',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'short', sleep_duration: 'inadequate' },
    consequent: 'Medium',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'Single stress-associated factor (Inadequate Sleep) balanced by normal autonomic baseline and short screen use.',
    is_documented: false,
  },
  {
    id: 'C11',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'short', sleep_duration: 'marginal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions; favorable short screen time and normal HRV sustain a low-stress state.',
    is_documented: false,
  },
  {
    id: 'C12',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'short', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions and two positive terms (Short Screen, Optimal Sleep) produce a low-stress state.',
    is_documented: false,
  },
  {
    id: 'C13',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'moderate', sleep_duration: 'inadequate' },
    consequent: 'Medium',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'Single stress-associated factor (Inadequate Sleep) with neutral HRV and screen habits.',
    is_documented: false,
  },
  {
    id: 'C14',
    report_id: 'R3',
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'moderate', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Breathing Exercise',
    rationale: 'Preserved verbatim from Stage 2 report (R3): All three parameters at neutral/intermediate baseline.',
    is_documented: true,
  },
  {
    id: 'C15',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'moderate', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions; optimal sleep easily accommodates moderate study screen time.',
    is_documented: false,
  },
  {
    id: 'C16',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'prolonged', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Digital Detox Reminder',
    rationale: 'Two stress-associated conditions present (Prolonged Screen, Inadequate Sleep) overwhelm normal baseline HRV.',
    is_documented: false,
  },
  {
    id: 'C17',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'prolonged', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Short Walk Break',
    rationale: 'One stress-associated factor (Prolonged Screen) on a neutral autonomic and sleep baseline.',
    is_documented: false,
  },
  {
    id: 'C18',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'normal', screen_time: 'prolonged', sleep_duration: 'optimal' },
    consequent: 'Medium',
    recommendation_hint: 'Short Walk Break',
    rationale: 'One stress-associated factor (Prolonged Screen) balanced by optimal restorative sleep.',
    is_documented: false,
  },

  // HRV = HIGH
  {
    id: 'C19',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'short', sleep_duration: 'inadequate' },
    consequent: 'Medium',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'One stress-associated factor (Inadequate Sleep) offset by two positive factors (High HRV, Short Screen).',
    is_documented: false,
  },
  {
    id: 'C20',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'short', sleep_duration: 'marginal' },
    consequent: 'Low',
    recommendation_hint: 'No Action Needed',
    rationale: 'Zero stress-associated conditions and two positive terms (High HRV, Short Screen) ensure a low-stress state.',
    is_documented: false,
  },
  {
    id: 'C21',
    report_id: 'R2',
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'short', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'No Action Needed',
    rationale: 'Preserved verbatim from Stage 2 report (R2): All three terms positive (High HRV, Short Screen, Optimal Sleep).',
    is_documented: true,
  },
  {
    id: 'C22',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'moderate', sleep_duration: 'inadequate' },
    consequent: 'Medium',
    recommendation_hint: 'Breathing Exercise',
    rationale: 'One stress-associated factor (Inadequate Sleep) moderated by high parasympathetic resilience.',
    is_documented: false,
  },
  {
    id: 'C23',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'moderate', sleep_duration: 'marginal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions; robust autonomic flexibility absorbs moderate work and slight sleep deficit.',
    is_documented: false,
  },
  {
    id: 'C24',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'moderate', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions and two positive terms (High HRV, Optimal Sleep) yield a low-stress state.',
    is_documented: false,
  },
  {
    id: 'C25',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'prolonged', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Active Cardio Break',
    rationale: 'Two stress-associated conditions present (Prolonged Screen, Inadequate Sleep); single positive factor (High HRV) does not override them.',
    is_documented: false,
  },
  {
    id: 'C26',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'prolonged', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Short Walk Break',
    rationale: 'One stress-associated factor (Prolonged Screen) moderated by high parasympathetic tone.',
    is_documented: false,
  },
  {
    id: 'C27',
    report_id: null,
    type: 'core',
    antecedent: { hrv: 'high', screen_time: 'prolonged', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Zero stress-associated conditions; two positive terms (High HRV, Optimal Sleep) effectively neutralize prolonged screen time.',
    is_documented: false,
  },
];

export const SUPPLEMENTARY_RULES_DATA: RuleDefinition[] = [
  {
    id: 'R4',
    report_id: 'R4',
    type: 'supplementary',
    antecedent: { hrv: 'low', sleep_duration: 'inadequate' },
    consequent: 'High',
    recommendation_hint: 'Sleep Hygiene Tip',
    rationale: 'Preserved verbatim from Stage 2 report (R4): Severe autonomic depression combined with acute sleep deprivation directly triggers high stress.',
    is_documented: true,
  },
  {
    id: 'R5',
    report_id: 'R5',
    type: 'supplementary',
    antecedent: { screen_time: 'prolonged', sleep_duration: 'marginal' },
    consequent: 'Medium',
    recommendation_hint: 'Digital Detox Reminder',
    rationale: 'Preserved verbatim from Stage 2 report (R5): Digital screen overload paired with marginal sleep creates moderate cognitive strain.',
    is_documented: true,
  },
  {
    id: 'R6',
    report_id: 'R6',
    type: 'supplementary',
    antecedent: { hrv: 'high', sleep_duration: 'optimal' },
    consequent: 'Low',
    recommendation_hint: 'Maintain Routine',
    rationale: 'Preserved verbatim from Stage 2 report (R6): Synergistic high parasympathetic tone and optimal sleep support a low-stress state.',
    is_documented: true,
  },
  {
    id: 'R7',
    report_id: 'R7',
    type: 'supplementary',
    antecedent: { hrv: 'normal', screen_time: 'prolonged' },
    consequent: 'Medium',
    recommendation_hint: 'Short Walk Break',
    rationale: 'Preserved verbatim from Stage 2 report (R7): Prolonged screen engagement on a normal baseline induces moderate physical fatigue.',
    is_documented: true,
  },
];

export const ALL_RULES_DATA: RuleDefinition[] = [
  ...CORE_RULES_DATA,
  ...SUPPLEMENTARY_RULES_DATA,
];

export function validateCoreRuleCoverage() {
  const expectedCombos: string[] = [];
  for (const h of HRV_TERMS) {
    for (const sc of SCREEN_TERMS) {
      for (const sl of SLEEP_TERMS) {
        expectedCombos.push(`${h}|${sc}|${sl}`);
      }
    }
  }

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const coreCombos: string[] = [];

  for (const rule of CORE_RULES_DATA) {
    const key = `${rule.antecedent.hrv}|${rule.antecedent.screen_time}|${rule.antecedent.sleep_duration}`;
    coreCombos.push(key);
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  }

  const missing = expectedCombos.filter((c) => !seen.has(c));

  return {
    isValid: expectedCombos.length === 27 && coreCombos.length === 27 && missing.length === 0 && duplicates.length === 0,
    expectedCount: expectedCombos.length,
    coreCount: coreCombos.length,
    uniqueCount: seen.size,
    missingCombinations: missing,
    duplicateCombinations: duplicates,
  };
}
