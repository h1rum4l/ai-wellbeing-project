import { ChatMessage, StressCategory } from '../types';

export const GREETING =
  "Hi, I'm your wellbeing companion. I can guide you through a short breathing exercise, help you " +
  "untangle a stressful day, or just listen. What's on your mind?";

export const QUICK_PROMPTS = [
  'I feel overwhelmed by my workload',
  'Guide me through a breathing exercise',
  'Help me wind down for sleep',
  "I can't stop scrolling on my phone",
];

const DEMO_RULES: Array<{ pattern: RegExp; reply: string }> = [
  {
    pattern: /breath|panic|anxi|nervous|racing|heart|shak|tense|calm/i,
    reply:
      "That sounds really tense, and your body is probably on high alert. Let's slow it down together with " +
      "box breathing:\n\n1. Breathe in through your nose for 4 seconds\n2. Hold gently for 4\n3. Breathe out slowly " +
      "for 4\n4. Hold for 4\n\nRepeat 4 rounds. How do you feel afterwards?",
  },
  {
    pattern: /sleep|insomnia|tired|exhaust|can'?t sleep|awake|night/i,
    reply:
      "Poor sleep makes everything feel heavier. Tonight, try a simple wind-down: put your phone away 30-60 " +
      "minutes before bed, dim the lights, and do a slow body scan from your toes up to your head, relaxing each part. " +
      "Would a short script for that help?",
  },
  {
    pattern: /phone|screen|scroll|social media|instagram|tiktok|youtube|laptop|online/i,
    reply:
      "Long screen stretches can quietly drain you. Try the 20-20-20 reset: every 20 minutes, look at something " +
      "20 feet away for 20 seconds, then stand up and stretch for a minute. Want help planning screen breaks " +
      "for today?",
  },
  {
    pattern: /exam|deadline|assignment|study|test|overwhelm|too much|behind|workload|project|submit/i,
    reply:
      "That's a lot to hold at once. Let's shrink it: write down everything on your plate, pick just ONE " +
      "thing, and commit to 10 focused minutes on its first small step. Then take a 2-minute break. What's the one " +
      "thing that feels most urgent?",
  },
  {
    pattern: /lonely|alone|sad|down|cry|hopeless|empty|homesick|miss/i,
    reply:
      "I'm sorry you're feeling this way. Those feelings are heavy, and it's okay to not be okay. Is there " +
      "one person you could message today, even just to say hi? In the meantime, would you like to tell me more " +
      "about what's been going on?",
  },
  {
    pattern: /angry|frustrat|annoy|irritat|furious|mad\b/i,
    reply:
      "Frustration is a sign something matters to you. Before reacting, try this: breathe out slowly for 6 " +
      "seconds, unclench your jaw and shoulders, and name what you're feeling in one word. What set it off?",
  },
  {
    pattern: /thank|thanks|better|helped|feel good/i,
    reply:
      "I'm really glad that helped. Notice what shifted for you; you can come back to it any time. Is there " +
      "anything else on your mind today?",
  },
  {
    pattern: /ground|5-4-3-2-1|present|focus|distract/i,
    reply:
      "Try 5-4-3-2-1 grounding: name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell and 1 " +
      "you can taste. It pulls your attention back to the present. Tell me how it goes.",
  },
];

export interface ChatAssessmentContext {
  index: number;
  category: StressCategory;
  hrv: number;
  screen: number;
  sleep: number;
  action?: string;
}

export function getDemoReply(
  history: ChatMessage[],
  context?: ChatAssessmentContext | null
): string {
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
  const text = lastUserMsg?.content || '';

  for (const rule of DEMO_RULES) {
    if (rule.pattern.test(text)) {
      return rule.reply;
    }
  }

  let tailored = '';
  if (context && context.category === 'High') {
    tailored = "Your latest assessment suggests your stress is running high, so let's keep this gentle. ";
  } else if (context && context.category === 'Low') {
    tailored = 'Your latest assessment looks fairly balanced, which is good to hear. ';
  }

  return (
    tailored +
    "Thanks for sharing that with me. I'm here to listen. If it helps, I can guide you through a short " +
    'breathing exercise, help you break down what is weighing on you, or suggest a quick reset. ' +
    'What would feel most useful right now?'
  );
}
