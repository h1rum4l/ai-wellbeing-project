// Panda Soundscapes: Web Audio Nature Synthesizer for Stressina.AI
// 100% client-side, offline-capable, high-fidelity generative soundscapes

export interface SoundscapeTrack {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  description: string;
  color: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    id: 'bamboo',
    name: 'Bamboo Forest Mist',
    subtitle: 'Mountain breeze & bamboo chimes',
    emoji: '🎋',
    description: 'Gentle mountain wind filtering through giant bamboo leaves with soft harmonic wind chimes.',
    color: '#538A78',
  },
  {
    id: 'stream',
    name: 'Zen River Stream',
    subtitle: 'Crystal alpine water flow',
    emoji: '🌊',
    description: 'Tranquil pebbles, ripples, and flowing water frequencies to calm mental chatter.',
    color: '#4B8896',
  },
  {
    id: 'rain',
    name: 'Rain on Lotus Leaves',
    subtitle: 'Gentle rhythmic summer drizzle',
    emoji: '🌧️',
    description: 'Soft rhythmic raindrops pattering on broad lotus pads with soothing pink noise.',
    color: '#658B93',
  },
  {
    id: 'bowls',
    name: '432Hz Tibetan Singing Bowls',
    subtitle: 'Deep meditative harmonic resonance',
    emoji: '🔔',
    description: 'Rich vibrational overtones tuned to 432Hz for deep parasympathetic relaxation.',
    color: '#7A6B8A',
  },
  {
    id: 'purr',
    name: 'Stressina Rest & Heartbeat',
    subtitle: '60 BPM resting cadence & warm purr',
    emoji: '🐾',
    description: 'A comforting low-frequency rhythm that naturally entrains your breathing to calm rest.',
    color: '#4A695E',
  },
];

type SoundscapeListener = () => void;

class PandaSoundscapesManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrackId = 'bamboo';
  private volume = 0.55;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private chimeTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<SoundscapeListener> = new Set();

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public subscribe(fn: SoundscapeListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      currentTrackId: this.currentTrackId,
      volume: this.volume,
      currentTrack: SOUNDSCAPE_TRACKS.find((t) => t.id === this.currentTrackId) || SOUNDSCAPE_TRACKS[0],
    };
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public selectTrack(trackId: string) {
    if (this.currentTrackId === trackId && this.isPlaying) return;
    this.currentTrackId = trackId;
    if (this.isPlaying) {
      this.stopCurrentNodes();
      this.startSynthesizer();
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play(trackId?: string) {
    if (trackId) {
      this.currentTrackId = trackId;
    }
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.startSynthesizer();
      });
    } else {
      this.startSynthesizer();
    }
    this.isPlaying = true;
    this.notify();
  }

  public pause() {
    this.stopCurrentNodes();
    this.isPlaying = false;
    this.notify();
  }

  private stopCurrentNodes() {
    if (this.chimeTimer) {
      clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Safe tear-down
      }
    });
    this.activeNodes = [];
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startSynthesizer() {
    this.stopCurrentNodes();
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const track = this.currentTrackId;

    if (track === 'bamboo') {
      // 1. Mountain breeze via modulated bandpass pink noise
      const noise = ctx.createBufferSource();
      noise.buffer = this.createPinkNoiseBuffer(ctx, 5);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      // Low frequency oscillator for wind gusts
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      lfo.start();
      this.activeNodes.push(noise, lfo, gain, filter);

      // Periodic gentle bamboo chime
      const playBambooChime = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        const notes = [587.33, 659.25, 880.0, 987.77, 1174.66]; // Pentatonic D, E, A, B, D
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const chimeGain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        chimeGain.gain.setValueAtTime(0.001, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(chimeGain);
        chimeGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 2.9);
      };

      this.chimeTimer = setInterval(() => {
        if (Math.random() > 0.3) playBambooChime();
      }, 3500);

    } else if (track === 'stream') {
      // 2. Continuous flowing mountain stream
      const noise = ctx.createBufferSource();
      noise.buffer = this.createPinkNoiseBuffer(ctx, 4);
      noise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(850, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(260, ctx.currentTime);

      // Multiple gentle modulation LFOs for natural water ripple
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, ctx.currentTime);

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      lfo.start();
      this.activeNodes.push(noise, lfo, gain, lowpass, highpass);

    } else if (track === 'rain') {
      // 3. Rain on Lotus Leaves
      const noise = ctx.createBufferSource();
      noise.buffer = this.createPinkNoiseBuffer(ctx, 4);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.65, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      this.activeNodes.push(noise, filter, gain);

      // Random gentle droplets
      this.chimeTimer = setInterval(() => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const drop = this.ctx.createOscillator();
        drop.type = 'sine';
        const startFreq = 1200 + Math.random() * 800;
        drop.frequency.setValueAtTime(startFreq, now);
        drop.frequency.exponentialRampToValueAtTime(startFreq * 0.45, now + 0.08);

        const dropGain = this.ctx.createGain();
        dropGain.gain.setValueAtTime(0.03, now);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        drop.connect(dropGain);
        dropGain.connect(this.masterGain);

        drop.start(now);
        drop.stop(now + 0.12);
      }, 400);

    } else if (track === 'bowls') {
      // 4. 432Hz Tibetan Singing Bowls
      const playSingingBowlPulse = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const baseFreq = 432;
        const partials = [
          { mult: 1, gain: 0.14, decay: 6.5 },
          { mult: 2.01, gain: 0.08, decay: 5.2 },
          { mult: 3.02, gain: 0.04, decay: 4.1 },
          { mult: 4.15, gain: 0.02, decay: 3.2 },
        ];

        partials.forEach(({ mult, gain: pGain, decay }) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * mult, now);

          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, now);
          g.gain.exponentialRampToValueAtTime(pGain, now + 0.15);
          g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

          osc.connect(g);
          g.connect(this.masterGain);

          osc.start(now);
          osc.stop(now + decay + 0.1);
        });
      };

      playSingingBowlPulse();
      this.chimeTimer = setInterval(playSingingBowlPulse, 7000);

    } else if (track === 'purr') {
      // 5. Stressina Rest & Heartbeat (60 BPM soothing heartbeat & purr)
      const playHeartbeat = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        // Lub
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(68, now);
        osc1.frequency.exponentialRampToValueAtTime(42, now + 0.12);
        const g1 = this.ctx.createGain();
        g1.gain.setValueAtTime(0.18, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc1.connect(g1);
        g1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.16);

        // Dub (0.24s later)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(60, now + 0.22);
        osc2.frequency.exponentialRampToValueAtTime(38, now + 0.34);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.12, now + 0.22);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(g2);
        g2.connect(this.masterGain);
        osc2.start(now + 0.22);
        osc2.stop(now + 0.38);
      };

      // Gentle continuous low purr tone
      const purrOsc = ctx.createOscillator();
      purrOsc.type = 'triangle';
      purrOsc.frequency.setValueAtTime(48, ctx.currentTime);

      const purrMod = ctx.createOscillator();
      purrMod.frequency.setValueAtTime(24, ctx.currentTime); // 24Hz purr rattle
      const purrModGain = ctx.createGain();
      purrModGain.gain.setValueAtTime(14, ctx.currentTime);
      purrMod.connect(purrModGain);
      purrModGain.connect(purrOsc.frequency);

      const purrFilter = ctx.createBiquadFilter();
      purrFilter.type = 'lowpass';
      purrFilter.frequency.setValueAtTime(180, ctx.currentTime);

      const purrGain = ctx.createGain();
      purrGain.gain.setValueAtTime(0.06, ctx.currentTime);

      purrOsc.connect(purrFilter);
      purrFilter.connect(purrGain);
      purrGain.connect(this.masterGain);

      purrOsc.start();
      purrMod.start();
      this.activeNodes.push(purrOsc, purrMod, purrFilter, purrGain);

      playHeartbeat();
      this.chimeTimer = setInterval(playHeartbeat, 1000); // 60 BPM
    }
  }
}

export const pandaSoundscapes = new PandaSoundscapesManager();
