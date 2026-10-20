import { StressCategory } from '../types';
import { STRESS_THRESHOLDS, STRESS_RANGE } from './fuzzyConfig';

export function classifyStress(stressIndex: number): StressCategory {
  if (typeof stressIndex !== 'number' || Number.isNaN(stressIndex)) {
    return 'Medium';
  }

  // Gracefully clamp to valid range [0, 100]
  const clamped = Math.min(Math.max(stressIndex, STRESS_RANGE[0]), STRESS_RANGE[1]);

  const mediumMin = STRESS_THRESHOLDS.medium_min;
  const highMin = STRESS_THRESHOLDS.high_min;

  if (clamped < mediumMin) {
    return 'Low';
  } else if (clamped < highMin) {
    return 'Medium';
  } else {
    return 'High';
  }
}

export function getCategoryBadgeInfo(category: StressCategory) {
  const badgeInfo = {
    Low: {
      label: 'LOW STRESS',
      color: '#10B981', // emerald-500
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      description: 'Optimal physiological balance and restorative state. Autonomic tone is resilient.',
    },
    Medium: {
      label: 'MEDIUM STRESS',
      color: '#F59E0B', // amber-500
      badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      description: 'Moderate physiological load or digital fatigue. Proactive micro-breaks recommended.',
    },
    High: {
      label: 'HIGH STRESS',
      color: '#EF4444', // red-500
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
      description: 'Significant autonomic strain or cumulative exhaustion. Immediate coping action advised.',
    },
  };

  return badgeInfo[category] || {
    label: 'UNKNOWN',
    color: '#6B7280',
    badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    description: 'Unclassified state.',
  };
}
