/**
 * Stressina Companion Voice & Speech Synthesis Engine
 * 
 * Provides:
 * - Native Web Speech Synthesis with natural cadence (pitch 1.12, rate 0.94)
 * - Voice selection prioritizing soothing, warm voices
 * - Mute/unmute state persistence
 * - Speech start/end listener callbacks for mascot lip-sync
 * - Safe silent fallback for environments without SpeechSynthesis
 */

export const OFFICIAL_INTRO_GREETING =
  "Hi, I'm Stressina! I'm your AI wellbeing companion. I'm here to help you feel calmer, understand your stress, and take small steps toward feeling better. Shall we get started?";

export interface VoiceStateListener {
  (isSpeaking: boolean, currentText: string): void;
}

class CompanionVoiceEngine {
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;
  private currentText: string = '';
  private listeners: Set<VoiceStateListener> = new Set();
  private hasGreetedThisSession: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('stressina_voice_muted');
        this.isMuted = savedMute === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isSpeaking, this.currentText);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.isSpeaking, this.currentText));
  }

  public isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('stressina_voice_muted', muted ? 'true' : 'false');
      } catch {}
    }
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentText = '';
      this.notify();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public hasGreeted(): boolean {
    return this.hasGreetedThisSession;
  }

  public markGreeted(): void {
    this.hasGreetedThisSession = true;
  }

  /**
   * Speak a line through browser speech synthesis
   */
  public speak(
    text: string,
    options?: { onEnd?: () => void; forceEvenIfMuted?: boolean }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (this.isMuted && !options?.forceEvenIfMuted) {
      this.currentText = text;
      this.isSpeaking = false;
      this.notify();
      if (options?.onEnd) options.onEnd();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.12;
      utterance.rate = 0.94;
      utterance.volume = 0.9;

      // Select warm, friendly voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Female') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Natural'))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      this.isSpeaking = true;
      this.currentText = text;
      this.notify();

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentText = '';
        this.notify();
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.currentText = '';
        this.notify();
        if (options?.onEnd) options.onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      this.notify();
      if (options?.onEnd) options.onEnd();
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentText = '';
    this.notify();
  }
}

export const companionVoice = new CompanionVoiceEngine();
