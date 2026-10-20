import { CopingRecommendation } from '../types';

export const RECOMMENDATION_LIBRARY: CopingRecommendation[] = [
  // LOW STRESS
  {
    id: 'REC_LOW_01',
    title: 'No Action Needed',
    description:
      'Your physiological indicators and lifestyle parameters are currently in an optimal restorative range. Continue your normal balanced activities.',
    stress_category: ['Low'],
    duration: '5 minutes',
    context: ['Any', 'Home', 'University', 'Work', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: High autonomic resilience and minimal strain indicate a healthy baseline with no immediate intervention required.',
  },
  {
    id: 'REC_LOW_02',
    title: 'Maintain Routine',
    description:
      'Keep up your current balance of regular sleep schedule, balanced screen breaks, and physical hydration.',
    stress_category: ['Low'],
    duration: '10 minutes',
    context: ['Any', 'Home', 'University', 'Work', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Sustained healthy habits reinforce neurobehavioral resilience and prevent stress accumulation.',
  },
  {
    id: 'REC_LOW_03',
    title: 'Mindful Gratitude & Reflection',
    description:
      'Take a moment to note three productive accomplishments or positive events from your day to reinforce positive mental well-being.',
    stress_category: ['Low'],
    duration: '20+ minutes',
    context: ['Home', 'University', 'Other'],
    reason:
      'Consolidates positive psychological states during low-stress recovery periods.',
  },

  // MEDIUM STRESS
  {
    id: 'REC_MED_01',
    title: 'Breathing Exercise',
    description:
      'Perform 4-7-8 diaphragmatic breathing or box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) for 5 minutes.',
    stress_category: ['Medium', 'High'],
    duration: '5 minutes',
    context: ['Any', 'Home', 'University', 'Work', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Activates the parasympathetic vagal brake, reducing heart rate and autonomic arousal in constrained settings.',
  },
  {
    id: 'REC_MED_02',
    title: 'Monitor / Breathing Exercise',
    description:
      'Perform a short calming breathing session, then monitor your physical posture and hydration levels over the next hour.',
    stress_category: ['Medium'],
    duration: '5 minutes',
    context: ['Work', 'University', 'Home', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Addresses borderline or mixed indicators by combining immediate calming breathwork with mindful self-monitoring.',
  },
  {
    id: 'REC_MED_03',
    title: 'Short Walk Break',
    description:
      'Step away from screens and desks for a brisk, low-intensity walk outdoors or down the hall to stimulate peripheral circulation.',
    stress_category: ['Medium'],
    duration: '10 minutes',
    context: ['Work', 'University', 'Home', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Interrupts sedentary posture, reduces musculoskeletal stiffness, and alleviates digital eye strain.',
  },
  {
    id: 'REC_MED_04',
    title: 'Digital Detox Reminder',
    description:
      "Put phones on 'Do Not Disturb', close non-essential browser tabs, and apply the 20-20-20 visual rule (every 20 mins, look at an object 20 feet away for 20 seconds).",
    stress_category: ['Medium', 'High'],
    duration: '10 minutes',
    context: ['Work', 'University', 'Home', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Reduces retinal fatigue and neuro-sensory overload caused by prolonged screen exposure.',
  },
  {
    id: 'REC_MED_05',
    title: 'Progressive Muscle Relaxation (PMR)',
    description:
      'Sequentially tense and slowly release muscle groups from your toes to your forehead, paying attention to sensations of relaxation.',
    stress_category: ['Medium'],
    duration: '20+ minutes',
    context: ['Home', 'Other'],
    reason:
      'Relieves somatic muscular tension accumulated throughout sustained work or study periods.',
  },
  {
    id: 'REC_MED_06',
    title: 'Desk Ergonomics & Hydration Reset',
    description:
      'Drink a full glass of cold water, adjust your chair height, roll your shoulders back, and perform gentle neck stretches.',
    stress_category: ['Medium'],
    duration: '5 minutes',
    context: ['Work', 'University'],
    reason:
      'Immediate physical reset for seated office or study environments to counter moderate postural fatigue.',
  },

  // HIGH STRESS
  {
    id: 'REC_HIGH_01',
    title: 'Active Cardio Break',
    description:
      'Engage in moderate-intensity physical movement such as brisk walking, stair climbing, jumping jacks, or light cycling to metabolize stress hormones.',
    stress_category: ['High'],
    duration: '10 minutes',
    context: ['Home', 'University', 'Work', 'Other'],
    reason:
      'Documented Stage 2 Recommendation: Rapidly dissipates circulating cortisol and adrenaline while stimulating endorphin release and autonomic recovery.',
  },
  {
    id: 'REC_HIGH_02',
    title: 'Sleep Hygiene Tip',
    description:
      'Set a firm sleep boundary tonight: avoid screens 60 minutes prior to bed, lower bedroom temperature, dim lights, and avoid caffeine past 2 PM.',
    stress_category: ['High', 'Medium'],
    duration: '5 minutes',
    context: ['Home', 'Other', 'University', 'Work'],
    reason:
      'Documented Stage 2 Recommendation: Restores circadian entrainment and autonomic tone when chronic sleep deficiency is a primary stress driver.',
  },
  {
    id: 'REC_HIGH_03',
    title: 'Extended Physical Reset & Decompression Walk',
    description:
      'Take a 20-30 minute continuous outdoor walk in nature or green space without headphones, allowing cognitive decompression.',
    stress_category: ['High'],
    duration: '20+ minutes',
    context: ['Home', 'University', 'Other'],
    reason:
      'Extensive research demonstrates nature exposure and continuous aerobic walking significantly down-regulate sympathetic overdrive.',
  },
  {
    id: 'REC_HIGH_04',
    title: 'Guided Physiological Sigh & Cold Water Splash',
    description:
      'Perform 5 repetitions of the physiological sigh (two quick inhales through the nose followed by a long, slow exhale through the mouth) and splash cool water on your face.',
    stress_category: ['High'],
    duration: '5 minutes',
    context: ['Work', 'University', 'Home', 'Other'],
    reason:
      'Triggers the mammalian dive reflex and rapidly slows heart rate when acute stress peaks in high-pressure work/exam environments.',
  },
];
