import { CopingRecommendation, StressCategory } from '../types';
import { RECOMMENDATION_LIBRARY } from './recommendationLibrary';

export function selectCopingRecommendation(
  stressCategory: StressCategory,
  availableTime?: string,
  context?: string,
  stressorHint?: string
): CopingRecommendation {
  // 1. Strict primary filter by stress category
  const categoryCandidates = RECOMMENDATION_LIBRARY.filter((rec) =>
    rec.stress_category.includes(stressCategory)
  );

  if (categoryCandidates.length === 0) {
    return {
      id: 'REC_FALLBACK',
      title: 'Breathing & Posture Reset',
      description: 'Take 5 slow breaths and reset your seated posture.',
      stress_category: [stressCategory],
      duration: availableTime || '5 minutes',
      context: [context || 'Any'],
      reason: `General coping intervention adapted for ${stressCategory} stress level.`,
      selection_rationale: `General coping intervention adapted for ${stressCategory} stress level.`,
    };
  }

  // 2. Score candidates based on contextual flags and stressor hints
  const scoreCandidate = (candidate: CopingRecommendation): number => {
    let score = 0;

    // Duration match (+3 points)
    if (availableTime && candidate.duration === availableTime) {
      score += 3;
    }

    // Context match (+3 for exact, +2 for 'Any')
    if (context) {
      if (candidate.context.includes(context)) {
        score += 3;
      } else if (candidate.context.includes('Any')) {
        score += 2;
      }
    }

    // Stressor alignment (+2 points)
    if (stressorHint) {
      const hintLower = stressorHint.toLowerCase();
      const titleLower = candidate.title.toLowerCase();
      const reasonLower = candidate.reason.toLowerCase();
      if (titleLower.includes(hintLower) || reasonLower.includes(hintLower)) {
        score += 2;
      }
    }

    return score;
  };

  // Sort candidates by score descending
  const scoredCandidates = [...categoryCandidates].sort(
    (a, b) => scoreCandidate(b) - scoreCandidate(a)
  );

  const selected: CopingRecommendation = { ...scoredCandidates[0] };

  // Build personalized selection rationale
  const reasons: string[] = [selected.reason];
  if (availableTime && selected.duration === availableTime) {
    reasons.push(`Fits your selected ${availableTime} window.`);
  }
  if (context && (selected.context.includes(context) || selected.context.includes('Any'))) {
    reasons.push(`Appropriate for a ${context} setting.`);
  }

  selected.selection_rationale = reasons.join(' ');
  return selected;
}
