export interface HelplineInfo {
  number: string;
  name: string;
  note: string;
}

export const HELPLINES: HelplineInfo[] = [
  { number: '1926', name: 'National Mental Health Helpline', note: 'free, 24/7, English / Sinhala / Tamil' },
  { number: '1333', name: 'CCC Line (Community Crisis Response)', note: 'emotional support' },
  { number: '011 269 2909', name: 'Sri Lanka Sumithrayo', note: 'emotional support, Colombo' },
  { number: '119', name: 'Police emergency', note: 'if you or someone else is in immediate danger' },
];

export const SHORT_HELP_LINE = 'In crisis? Call 1926 (free, 24/7).';

const CRISIS_PATTERNS = [
  /\bsuicid/i,
  /\bkill (myself|me)\b/i,
  /\bend (my|your|this) life\b/i,
  /\bend my own life\b/i,
  /\bend it all\b/i,
  /\btake my (own )?life\b/i,
  /\bwant(ed)? to die\b/i,
  /\bwish (i|that i) (was|were) dead\b/i,
  /\bbetter off dead\b/i,
  /\bnot worth living\b/i,
  /\bdo(n't| not) want to (live|be alive|exist|be here)\b/i,
  /\bno (reason|point) (in |to )?(living|live|going on|go on)\b/i,
  /\bself[- ]?harm/i,
  /\b(hurt|harm|cut|injure|hurting|harming|cutting) (myself|my self)\b/i,
  /\bcan'?t go on\b/i,
];

export function detectCrisis(text: string): boolean {
  if (!text) return false;
  const normalized = text.replace(/[\u2018\u2019]/g, "'");
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function crisisMessage(): string {
  const lines = HELPLINES.map((h) => `- **${h.number}** — ${h.name} (${h.note})`).join('\n');
  return (
    "I'm really glad you told me, and I'm concerned about how much pain you're in. " +
    "You don't have to carry this alone, and talking to a real person right now can help.\n\n" +
    `${lines}\n\n` +
    "If you are in immediate danger, call **119** or go to the nearest hospital emergency department. " +
    "If someone you trust is nearby, such as a friend, family member or lecturer, please tell them how you're feeling.\n\n" +
    "I'm still here to talk, but I'm an AI companion and cannot replace the support those professionals can give. " +
    "(If you're outside Sri Lanka, please call your local emergency helpline.)"
  );
}
