/**
 * iOS 26 Next-Gen Taptic & Acoustic Feedback Engine
 * 
 * Provides:
 * 1. Physical hardware vibrations via navigator.vibrate with Apple LRA micro-timings
 * 2. High-fidelity synthesized tactile micro-acoustic impulses via Web Audio API
 *    (simulating Apple's Linear Resonant Actuator physical tap & recoil mechanics)
 * 3. Automatic Global Event Delegation: Automatically responds to every interactive
 *    element in the DOM (buttons, sliders, inputs, tabs, login fields, cards, toggles)
 *    ensuring iOS 26 haptics throughout the entire application seamlessly.
 */

export type HapticType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid'
  | 'soft'
  | 'success'
  | 'warning'
  | 'error'
  | 'levelUp'
  | 'breathSwell'
  | 'breathSettle';

class HapticEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastTriggerTime: number = 0;
  private isDelegationAttached: boolean = false;

  constructor() {
    this.setupGestureUnlock();
    this.setupGlobalDelegation();
  }

  /**
   * Proactively unlock Web Audio Context on ANY user interaction
   */
  private setupGestureUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.resumeAudioContext();
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    window.addEventListener('mousedown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, passive: true });
  }

  /**
   * Global iOS 26 Tactile Delegation:
   * Intercepts pointerdown on interactive elements across the entire document
   * (including modals, auth forms, sliders, tabs, buttons, etc.)
   */
  private setupGlobalDelegation(): void {
    if (typeof window === 'undefined' || this.isDelegationAttached) return;
    this.isDelegationAttached = true;

    const handleInteraction = (target: HTMLElement | null) => {
      if (!target) return;

      // Check if target is or is inside an interactive element
      const interactive = target.closest<HTMLElement>(
        'button, [role="button"], input, select, textarea, a, .cursor-pointer, .ios-tactile-button, [data-haptic], [tabindex]'
      );

      if (interactive) {
        // If explicit data-haptic is specified, use that; otherwise pick smart default
        const customType = interactive.getAttribute('data-haptic') as HapticType | null;
        if (customType) {
          this.trigger(customType);
          return;
        }

        // Smart classification based on element type
        const tagName = interactive.tagName.toLowerCase();
        const role = interactive.getAttribute('role');
        const typeAttr = interactive.getAttribute('type');

        if (tagName === 'input' && (typeAttr === 'range' || typeAttr === 'checkbox' || typeAttr === 'radio')) {
          this.trigger('selection');
        } else if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
          this.trigger('light');
        } else if (interactive.classList.contains('liquid-button-sage') || interactive.classList.contains('liquid-button-primary')) {
          this.trigger('medium');
        } else if (role === 'tab' || interactive.classList.contains('rounded-full')) {
          this.trigger('selection');
        } else {
          this.trigger('light');
        }
      }
    };

    window.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        handleInteraction(e.target as HTMLElement | null);
      },
      { capture: true, passive: true }
    );

    // Typing haptics for inputs and textareas (iOS 26 virtual keyboard tap)
    window.addEventListener(
      'input',
      (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          this.trigger('selection');
        }
      },
      { capture: true, passive: true }
    );
  }

  public resumeAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch {
          this.audioCtx = null;
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /**
   * Triggers physical vibration and tactile impulse acoustics
   */
  public trigger(type: HapticType = 'light'): void {
    const nowMs = Date.now();
    // Debounce rapid identical firings under 25ms to keep taps sharp and prevent muddy overlap
    if (nowMs - this.lastTriggerTime < 20 && type === 'selection') {
      return;
    }
    this.lastTriggerTime = nowMs;

    // 1. Hardware vibration on supported devices
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        switch (type) {
          case 'selection':
            navigator.vibrate(9);
            break;
          case 'light':
            navigator.vibrate(14);
            break;
          case 'medium':
            navigator.vibrate(26);
            break;
          case 'heavy':
            navigator.vibrate(48);
            break;
          case 'rigid':
            navigator.vibrate(10);
            break;
          case 'soft':
            navigator.vibrate(18);
            break;
          case 'success':
            navigator.vibrate([16, 32, 24]);
            break;
          case 'warning':
          case 'error':
            navigator.vibrate([28, 35, 28, 35, 38]);
            break;
          case 'levelUp':
            navigator.vibrate([20, 30, 20, 30, 45]);
            break;
          case 'breathSwell':
            navigator.vibrate([15, 40, 20]);
            break;
          case 'breathSettle':
            navigator.vibrate(12);
            break;
        }
      } catch {
        // Fallback silently if iframe prevents vibrate
      }
    }

    // 2. High-precision synthesized acoustic LRA impulses via Web Audio
    if (!this.soundEnabled) return;

    try {
      const ctx = this.resumeAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;

      if (type === 'selection') {
        // iOS 26 ultra-crisp selection tick: Dual-transient micro impulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(840, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.016);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
        osc.start(t);
        osc.stop(t + 0.018);
      } else if (type === 'light') {
        // iOS soft spring tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(460, t);
        osc.frequency.exponentialRampToValueAtTime(130, t + 0.028);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
        osc.start(t);
        osc.stop(t + 0.03);
      } else if (type === 'medium') {
        // iOS punchy button pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.045);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        osc.start(t);
        osc.stop(t + 0.048);
      } else if (type === 'heavy') {
        // iOS deep mechanical thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.07);
        gain.gain.setValueAtTime(0.42, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.075);
      } else if (type === 'rigid') {
        // iOS fast crisp rigid impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(260, t + 0.012);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
        osc.start(t);
        osc.stop(t + 0.014);
      } else if (type === 'soft') {
        // Gentle mellow haptic
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.035);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        osc.start(t);
        osc.stop(t + 0.038);
      } else if (type === 'success') {
        // iOS distinct double-tap chime with resonant confirmation
        const tap = (freq: number, startDelay: number, dur: number, vol: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, t + startDelay);
          g.gain.setValueAtTime(vol, t + startDelay);
          g.gain.exponentialRampToValueAtTime(0.001, t + startDelay + dur);
          o.start(t + startDelay);
          o.stop(t + startDelay + dur);
        };
        tap(587.33, 0, 0.12, 0.25); // D5
        tap(880.0, 0.07, 0.22, 0.28); // A5
      } else if (type === 'warning' || type === 'error') {
        // Dual tactile warning buzz
        const buzz = (startDelay: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(220, t + startDelay);
          o.frequency.exponentialRampToValueAtTime(110, t + startDelay + 0.04);
          g.gain.setValueAtTime(0.25, t + startDelay);
          g.gain.exponentialRampToValueAtTime(0.001, t + startDelay + 0.04);
          o.start(t + startDelay);
          o.stop(t + startDelay + 0.045);
        };
        buzz(0);
        buzz(0.08);
      } else if (type === 'levelUp') {
        // Ascending harmonic chime
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const delay = idx * 0.055;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, t + delay);
          g.gain.setValueAtTime(0.24, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);
          o.start(t + delay);
          o.stop(t + delay + 0.2);
        });
      } else if (type === 'breathSwell') {
        // Soothing gentle expansion swell
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(330, t + 0.25);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t);
        o.stop(t + 0.38);
      } else if (type === 'breathSettle') {
        // Soothing gentle relaxation settle
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(330, t);
        o.frequency.exponentialRampToValueAtTime(196, t + 0.25);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.14, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        o.start(t);
        o.stop(t + 0.35);
      }
    } catch {
      // Audio playback fails silently if browser policy blocks
    }
  }
}

export const haptics = new HapticEngine();
export const triggerHaptic = (type: HapticType = 'light') => haptics.trigger(type);
