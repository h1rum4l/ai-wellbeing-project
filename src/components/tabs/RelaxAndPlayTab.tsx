import React, { useState, useEffect } from 'react';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
  Smile,
  Eye,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { store } from '../../storage/store';
import { habitsStore } from '../../storage/habitsStore';
import { triggerHaptic } from '../../utils/haptics';
import { StressCrushGame } from '../games/StressCrushGame';

interface RelaxAndPlayTabProps {
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  initialActivity?: ActivityType;
  onNavigateToGames?: () => void;
}

export type ActivityType = 'breathing' | 'candy_crush' | 'grounding' | 'matching' | 'checkin';
export type BreathingTechnique = 'gentle' | 'box' | 'deep';

interface BreathPhaseConfig {
  name: string;
  duration: number; // seconds
  prompt: string;
  orbScale: number;
  glowIntensity: string;
}

export const RelaxAndPlayTab: React.FC<RelaxAndPlayTabProps> = ({
  currentUser,
  onOpenAuthModal,
  initialActivity = 'breathing',
  onNavigateToGames,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(initialActivity);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (initialActivity) {
      setSelectedActivity(initialActivity);
    }
  }, [initialActivity]);

  // ==========================================
  // 1. GUIDED BREATHING SANCTUARY
  // ==========================================
  const [technique, setTechnique] = useState<BreathingTechnique>('gentle');
  const [durationMinutes, setDurationMinutes] = useState<number>(2);
  const [breathState, setBreathState] = useState<'stopped' | 'running' | 'paused' | 'completed'>('stopped');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Runtime timing state
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(120);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [reflectionSaved, setReflectionSaved] = useState<boolean>(false);

  // Define techniques and multi-phase rhythms (Serene Eucalyptus & Bamboo palette)
  const techniqueConfigs: Record<BreathingTechnique, { title: string; subtitle: string; phases: BreathPhaseConfig[] }> = {
    gentle: {
      title: 'Gentle Wave (4-4)',
      subtitle: 'Smooth, continuous rhythmic breathing to stabilize heart rate variability.',
      phases: [
        { name: 'Inhale', duration: 4, prompt: 'Breathe in slowly through your nose...', orbScale: 1.15, glowIntensity: 'rgba(16, 185, 129, 0.45)' },
        { name: 'Exhale', duration: 4, prompt: 'Gently release breath through your mouth...', orbScale: 0.88, glowIntensity: 'rgba(5, 150, 105, 0.25)' },
      ],
    },
    box: {
      title: 'Box Breathing (4-4-4-4)',
      subtitle: 'Navy SEAL grounding technique to calm an overstimulated nervous system.',
      phases: [
        { name: 'Inhale', duration: 4, prompt: 'Inhale deeply and expand your ribs...', orbScale: 1.2, glowIntensity: 'rgba(16, 185, 129, 0.5)' },
        { name: 'Hold', duration: 4, prompt: 'Hold your breath gently. Stay relaxed...', orbScale: 1.2, glowIntensity: 'rgba(20, 184, 166, 0.4)' },
        { name: 'Exhale', duration: 4, prompt: 'Exhale completely and let shoulders drop...', orbScale: 0.82, glowIntensity: 'rgba(5, 150, 105, 0.3)' },
        { name: 'Rest', duration: 4, prompt: 'Rest empty before the next breath begins...', orbScale: 0.82, glowIntensity: 'rgba(13, 148, 136, 0.25)' },
      ],
    },
    deep: {
      title: '4-7-8 Deep Relaxation',
      subtitle: 'Parasympathetic nerve activator formulated for severe anxiety and sleep preparation.',
      phases: [
        { name: 'Inhale', duration: 4, prompt: 'Quiet inhalation through the nose (4s)...', orbScale: 1.25, glowIntensity: 'rgba(16, 185, 129, 0.55)' },
        { name: 'Hold', duration: 7, prompt: 'Hold breath serenely (7s)...', orbScale: 1.25, glowIntensity: 'rgba(20, 184, 166, 0.45)' },
        { name: 'Exhale', duration: 8, prompt: 'Whoosh breath out through parted lips (8s)...', orbScale: 0.8, glowIntensity: 'rgba(5, 150, 105, 0.3)' },
      ],
    },
  };

  const activePhases = techniqueConfigs[technique].phases;
  const currentPhase = activePhases[currentPhaseIndex] || activePhases[0];

  // Soft synthetic chime via native Web Audio API
  const playCalmTone = (freq = 528) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Main timer loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (breathState === 'running') {
      timer = setInterval(() => {
        setTotalSecondsLeft((prevTotal) => {
          if (prevTotal <= 1) {
            setBreathState('completed');
            triggerHaptic('success');
            playCalmTone(639);
            return 0;
          }
          return prevTotal - 1;
        });

        setPhaseSecondsLeft((prevPhase) => {
          if (prevPhase <= 1) {
            // Move to next phase
            const nextIndex = (currentPhaseIndex + 1) % activePhases.length;
            setCurrentPhaseIndex(nextIndex);
            const nextPhase = activePhases[nextIndex];

            // iOS 26 tactile breathing feedback on phase transitions
            if (nextPhase.name === 'Inhale') {
              triggerHaptic('breathSwell');
            } else if (nextPhase.name === 'Exhale') {
              triggerHaptic('breathSettle');
            } else {
              triggerHaptic('light');
            }

            // Audio chime on phase transition
            if (nextIndex === 0) playCalmTone(528); // Inhale root
            else if (nextPhase.name === 'Hold') playCalmTone(594); // Hold
            else playCalmTone(396); // Exhale grounding

            return nextPhase.duration;
          }
          return prevPhase - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [breathState, currentPhaseIndex, activePhases, soundEnabled]);

  const startBreathing = () => {
    triggerHaptic('medium');
    setBreathState('running');
    setTotalSecondsLeft(durationMinutes * 60);
    setCurrentPhaseIndex(0);
    setPhaseSecondsLeft(activePhases[0].duration);
    setReflectionSaved(false);
    triggerHaptic('breathSwell');
    playCalmTone(528);
  };

  const pauseBreathing = () => {
    triggerHaptic('selection');
    setBreathState('paused');
  };

  const resetBreathing = () => {
    triggerHaptic('selection');
    setBreathState('stopped');
    setTotalSecondsLeft(durationMinutes * 60);
    setCurrentPhaseIndex(0);
    setPhaseSecondsLeft(activePhases[0].duration);
  };

  const handleFinishAndSave = () => {
    triggerHaptic('success');
    const elapsedSeconds = durationMinutes * 60 - totalSecondsLeft;
    store.addGameSession({
      game_type: 'breathing',
      duration_seconds: elapsedSeconds > 0 ? elapsedSeconds : durationMinutes * 60,
      score: 100,
      notes: `${techniqueConfigs[technique].title}. ${reflectionText || 'Mindful breath sanctuary.'}`,
    });

    if (currentUser?.id) {
      const todayLog = habitsStore.getTodayLog(currentUser.id);
      if (!todayLog.completedHabitIds.includes('habit_breathing')) {
        habitsStore.toggleHabit('habit_breathing', currentUser.id);
      }
    }

    setReflectionSaved(true);
    setStatusMessage('Breathing session registered to your wellness timeline!');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const formatMinutesSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ==========================================
  // 2. 5-4-3-2-1 GROUNDING TECHNIQUE
  // ==========================================
  const [groundingStep, setGroundingStep] = useState<number>(0);
  const [groundingReflections, setGroundingReflections] = useState<string[]>(['', '', '', '', '']);

  const groundingSteps = [
    { title: '5 Things You Can See', prompt: 'Look around. Notice 5 distinct objects, patterns, or colors in your immediate space.' },
    { title: '4 Things You Can Physically Feel', prompt: 'Notice 4 physical textures: your feet on the floor, clothing against your skin, a desk surface, or cool air.' },
    { title: '3 Things You Can Hear', prompt: 'Close your eyes. Identify 3 separate auditory inputs: distant traffic, computer fan hum, or your own breath.' },
    { title: '2 Things You Can Smell', prompt: 'Breathe in gently. Notice 2 scents, whether coffee, fresh room air, or clothing.' },
    { title: '1 Thing You Can Taste', prompt: 'Notice the lingering taste of mint, tea, or swallow to sense the physical state of your mouth.' },
  ];

  const handleGroundingNext = () => {
    triggerHaptic('selection');
    if (groundingStep < 4) {
      setGroundingStep(groundingStep + 1);
    } else {
      triggerHaptic('success');
      store.addGameSession({
        game_type: 'grounding',
        duration_seconds: 180,
        score: 100,
        notes: `5-4-3-2-1 Grounding completed. ${groundingReflections.filter(Boolean).join(' | ')}`,
      });
      setGroundingStep(5);
    }
  };

  // ==========================================
  // 3. CALM MATCHING PAIRS GAME
  // ==========================================
  const [matchingCards, setMatchingCards] = useState<string[]>([]);
  const [openCards, setOpenCards] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);

  const cardSymbols = ['🌿', '🪷', '🌊', '🎋'];

  const initMatchingGame = () => {
    triggerHaptic('selection');
    const shuffled = [...cardSymbols, ...cardSymbols].sort(() => Math.random() - 0.5);
    setMatchingCards(shuffled);
    setOpenCards([]);
    setMatchedIndices([]);
  };

  useEffect(() => {
    initMatchingGame();
  }, []);

  const handleCardClick = (idx: number) => {
    if (openCards.length === 2 || openCards.includes(idx) || matchedIndices.includes(idx)) return;
    triggerHaptic('light');

    const nextOpen = [...openCards, idx];
    setOpenCards(nextOpen);

    if (nextOpen.length === 2) {
      const [first, second] = nextOpen;
      if (matchingCards[first] === matchingCards[second]) {
        triggerHaptic('medium');
        setMatchedIndices((prev) => [...prev, first, second]);
        setOpenCards([]);
        if (matchedIndices.length + 2 === matchingCards.length) {
          triggerHaptic('levelUp');
          store.addGameSession({
            game_type: 'matching',
            duration_seconds: 60,
            score: 100,
            notes: 'Completed Calm Memory Pairs.',
          });
        }
      } else {
        setTimeout(() => setOpenCards([]), 900);
      }
    }
  };

  // ==========================================
  // 4. MINDFUL CHECK-IN STATE
  // ==========================================
  const [mood, setMood] = useState<string>('Steady');
  const [supportActivity, setSupportActivity] = useState<string>('Deep breathing');
  const [checkinComplete, setCheckinComplete] = useState<boolean>(false);

  const handleCheckinSubmit = () => {
    triggerHaptic('success');
    store.addGameSession({
      game_type: 'checkin',
      duration_seconds: 30,
      score: 100,
      notes: `Mood check-in: ${mood}. Intended practice: ${supportActivity}`,
    });
    setCheckinComplete(true);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Activity Switcher */}
      <div className="liquid-glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden border border-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                Interactive Sanctuary
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Relax & Restore
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed mt-0.5">
              Sensory-calming, paced exercises engineered to stimulate parasympathetic vagal response and restore biological equilibrium.
            </p>
          </div>

          {!currentUser && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shrink-0 shadow-xs">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Login to save breathing sessions to your timeline.</span>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onOpenAuthModal();
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Segmented Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'breathing', label: 'Guided Breathing', icon: Wind },
            { id: 'candy_crush', label: 'Stress Crush 🍬', icon: Sparkles },
            { id: 'grounding', label: '5-4-3-2-1 Grounding', icon: Eye },
            { id: 'matching', label: 'Calm Pairs', icon: Trophy },
            { id: 'checkin', label: 'Mindful Check-in', icon: Smile },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = selectedActivity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedActivity(item.id as ActivityType);
                }}
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:text-emerald-800 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 0. STRESS CRUSH MATCH-3 MINI-GAME                             */}
      {/* ============================================================== */}
      {selectedActivity === 'candy_crush' && (
        <StressCrushGame
          currentUser={currentUser}
          onOpenAuthModal={onOpenAuthModal}
          onNavigateToBreathing={() => {
            triggerHaptic('selection');
            setSelectedActivity('breathing');
          }}
        />
      )}

      {/* ============================================================== */}
      {/* 1. GUIDED BREATHING SANCTUARY                                  */}
      {/* ============================================================== */}
      {selectedActivity === 'breathing' && (
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-white shadow-md text-slate-800">
          {/* Ambient radial blur backlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Controls: Technique, Duration, Sound */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600 font-bold">Technique:</span>
              {(['gentle', 'box', 'deep'] as BreathingTechnique[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={breathState === 'running'}
                  onClick={() => {
                    triggerHaptic('selection');
                    setTechnique(t);
                    setBreathState('stopped');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 border ${
                    technique === t
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white hover:text-emerald-700'
                  }`}
                >
                  {techniqueConfigs[t].title.split(' (')[0]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600 font-bold">Session:</span>
                {[1, 2, 3, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={breathState === 'running'}
                    onClick={() => {
                      triggerHaptic('selection');
                      setDurationMinutes(m);
                      setTotalSecondsLeft(m * 60);
                      setBreathState('stopped');
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border ${
                      durationMinutes === m
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSoundEnabled(!soundEnabled);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                    : 'bg-white/80 border-slate-200 text-slate-400'
                }`}
                title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Subtitle / Technique Explainer */}
          <div className="text-center my-6 relative z-10">
            <h3 className="text-base font-extrabold text-slate-900 tracking-wide">
              {techniqueConfigs[technique].title}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
              {techniqueConfigs[technique].subtitle}
            </p>
          </div>

          {/* Mindful Breathing Orb */}
          <div className="relative py-12 sm:py-16 flex flex-col items-center justify-center">
            {/* Outer halo waves */}
            <div
              className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full transition-all duration-1000 ease-in-out pointer-events-none"
              style={{
                transform: `scale(${breathState === 'running' ? currentPhase.orbScale * 1.15 : 1})`,
                background: `radial-gradient(circle, ${currentPhase.glowIntensity} 0%, rgba(16, 185, 129, 0.04) 70%, transparent 100%)`,
                filter: 'blur(25px)',
              }}
            />

            {/* Middle glass ripple ring */}
            <div
              className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-emerald-400/30 transition-all duration-1000 ease-out pointer-events-none"
              style={{
                transform: `scale(${breathState === 'running' ? currentPhase.orbScale * 1.06 : 1})`,
                boxShadow: `0 0 30px ${currentPhase.glowIntensity}`,
              }}
            />

            {/* Main Interactive Translucent Eucalyptus / Emerald Glass Orb */}
            <div
              className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center text-center p-6 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer select-none"
              style={{
                transform: `scale(${breathState === 'running' ? currentPhase.orbScale : 1})`,
                background: 'radial-gradient(circle at 35% 30%, rgba(209, 250, 229, 0.95) 0%, rgba(167, 243, 208, 0.75) 45%, rgba(240, 253, 244, 0.95) 90%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '2px solid rgba(52, 211, 153, 0.6)',
                boxShadow: `0 12px 40px rgba(16, 185, 129, 0.25), inset 0 2px 4px 0 rgba(255, 255, 255, 0.9), inset 0 -4px 12px 0 rgba(5, 150, 105, 0.15)`,
              }}
              onClick={() => {
                triggerHaptic('light');
                if (breathState === 'running') pauseBreathing();
                else startBreathing();
              }}
            >
              {/* Internal Refraction Highlight */}
              <div className="absolute top-3 left-6 w-20 h-10 rounded-full bg-gradient-to-b from-white/70 to-transparent transform -rotate-12 blur-[1px] pointer-events-none" />

              {breathState === 'stopped' && (
                <div className="space-y-2">
                  <Play className="w-10 h-10 text-emerald-700 mx-auto fill-emerald-500/20" />
                  <div className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
                    Begin Sanctuary
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono font-bold">
                    {formatMinutesSeconds(durationMinutes * 60)}
                  </div>
                </div>
              )}

              {breathState === 'paused' && (
                <div className="space-y-1.5 z-10 flex flex-col items-center">
                  <Pause className="w-9 h-9 text-amber-600 mx-auto fill-amber-500/20" />
                  <div className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
                    Session Paused
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-amber-300 text-[11px] font-mono font-bold text-amber-900 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{formatMinutesSeconds(totalSecondsLeft)} remaining</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 font-medium">Tap orb to resume</div>
                </div>
              )}

              {breathState === 'running' && (
                <div className="space-y-1 z-10 animate-fade-in flex flex-col items-center">
                  <div className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-800">
                    {currentPhase.name}
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-xs">
                    {phaseSecondsLeft}
                  </div>
                  <div className="text-[10px] text-slate-700 font-semibold max-w-[150px] leading-tight">
                    {currentPhase.prompt}
                  </div>
                  {/* Real-time Session Countdown Timer Inside Focal Orb */}
                  <div className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-emerald-300 text-[11px] font-mono font-bold text-emerald-900 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>{formatMinutesSeconds(totalSecondsLeft)} left</span>
                  </div>
                </div>
              )}

              {breathState === 'completed' && (
                <div className="space-y-2">
                  <Check className="w-10 h-10 text-emerald-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-900">Complete</div>
                  <div className="text-[11px] text-emerald-800 font-semibold">Peaceful Mind</div>
                </div>
              )}
            </div>
          </div>

          {/* Visual Countdown Timer HUD & Session Controls */}
          <div className="relative z-10 max-w-lg mx-auto space-y-4">
            {/* Dedicated Visual Countdown Timer Card */}
            <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white bg-white/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Radial SVG Circular Countdown Gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(16, 185, 129, 0.15)"
                    strokeWidth="6"
                    className="fill-transparent"
                  />
                  {/* Animated Active Countdown Progress Arc */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="url(#sessionCountdownGradient)"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) * (totalSecondsLeft / (durationMinutes * 60))}
                    strokeLinecap="round"
                    className="fill-transparent transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="sessionCountdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center of Gauge: Mini Clock & Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <Clock
                    className={`w-4 h-4 ${
                      breathState === 'running'
                        ? 'text-emerald-600 animate-pulse'
                        : breathState === 'paused'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-800 mt-0.5">
                    {Math.round(((durationMinutes * 60 - totalSecondsLeft) / (durationMinutes * 60)) * 100)}%
                  </span>
                </div>
              </div>

              {/* Digital Countdown Timer Readout & Status */}
              <div className="flex-1 text-center sm:text-left space-y-1 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                    Session Countdown
                  </span>
                  {breathState === 'running' && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Active
                    </span>
                  )}
                  {breathState === 'paused' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                      Paused
                    </span>
                  )}
                  {breathState === 'stopped' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-medium">
                      Ready
                    </span>
                  )}
                  {breathState === 'completed' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      Complete
                    </span>
                  )}
                </div>

                {/* Giant Digital Remaining Time Display */}
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 drop-shadow-xs">
                    {formatMinutesSeconds(totalSecondsLeft)}
                  </div>
                  <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                    Remaining
                  </span>
                </div>

                {/* Progress Details Bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full h-2 rounded-full bg-slate-200/90 border border-slate-300/50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-1000 rounded-full"
                      style={{
                        width: `${Math.max(0, 100 - (totalSecondsLeft / (durationMinutes * 60)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Elapsed: {formatMinutesSeconds(durationMinutes * 60 - totalSecondsLeft)}</span>
                    <span>Target: {durationMinutes}m 00s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {breathState === 'running' ? (
                <>
                  <button
                    type="button"
                    onClick={pauseBreathing}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white/90 hover:bg-white border border-slate-300 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Pause className="w-4 h-4 text-amber-600" />
                    <span>Pause</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetBreathing}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishAndSave}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Complete Early & Save</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startBreathing}
                    className="liquid-button-sage px-7 py-3 rounded-full text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all text-white"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{breathState === 'paused' ? 'Resume Session' : 'Start Breathing Session'}</span>
                  </button>
                  {breathState === 'paused' && (
                    <>
                      <button
                        type="button"
                        onClick={resetBreathing}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-300 cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleFinishAndSave}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-600 cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Finish & Save</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Completion & Reflection Dialog */}
          {breathState === 'completed' && (
            <div className="mt-8 pt-6 border-t border-slate-200/80 max-w-lg mx-auto text-center space-y-4 animate-fade-in">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>How do you feel after this session?</span>
              </h4>
              <p className="text-xs text-slate-600">
                Take a moment to register your physiological state.
              </p>

              <input
                type="text"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="e.g., Shoulders feel lighter, breathing feels deeper..."
                className="w-full liquid-input px-4 py-2.5 rounded-xl text-xs font-medium"
              />

              <div className="flex items-center justify-center gap-3">
                {currentUser ? (
                  <button
                    type="button"
                    disabled={reflectionSaved}
                    onClick={handleFinishAndSave}
                    className="liquid-button-sage px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{reflectionSaved ? 'Saved to Timeline!' : 'Save Reflection'}</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      Sign in to store this breathing milestone to your wellness profile.
                    </p>
                    {onOpenAuthModal && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onOpenAuthModal();
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                      >
                        Sign In Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. 5-4-3-2-1 GROUNDING TECHNIQUE                               */}
      {/* ============================================================== */}
      {selectedActivity === 'grounding' && (
        <div className="liquid-glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-white shadow-sm">
          <div className="border-b border-slate-200/80 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Sensory Stabilization
            </span>
            <h3 className="text-base font-bold text-slate-900">5-4-3-2-1 Sensory Grounding</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Anchor your awareness in the physical environment to disrupt panic and racing thoughts.
            </p>
          </div>

          {groundingStep < 5 ? (
            <div className="space-y-5 max-w-xl mx-auto py-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-emerald-800">
                  Step {groundingStep + 1} of 5
                </span>
                <span className="font-mono">{5 - groundingStep} sensory anchor</span>
              </div>

              <div className="liquid-glass p-5 rounded-2xl space-y-3 border border-white shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center text-xs font-mono font-bold">
                    {5 - groundingStep}
                  </span>
                  <span>{groundingSteps[groundingStep].title}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {groundingSteps[groundingStep].prompt}
                </p>

                <textarea
                  rows={2}
                  value={groundingReflections[groundingStep]}
                  onChange={(e) => {
                    const next = [...groundingReflections];
                    next[groundingStep] = e.target.value;
                    setGroundingReflections(next);
                  }}
                  placeholder="Type what you notice here (optional)..."
                  className="w-full liquid-input p-3 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={groundingStep === 0}
                  onClick={() => {
                    triggerHaptic('selection');
                    setGroundingStep((p) => p - 1);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleGroundingNext}
                  className="liquid-button-sage px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white"
                >
                  <span>{groundingStep === 4 ? 'Complete Grounding' : 'Next Sense'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Grounding Completed</h4>
              <p className="text-xs text-slate-600">
                You took mindful control of your attention. Notice how your body feels right now compared to when you started.
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setGroundingStep(0);
                  setGroundingReflections(['', '', '', '', '']);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 cursor-pointer shadow-xs"
              >
                Restart Grounding
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CALM MATCHING PAIRS                                         */}
      {/* ============================================================== */}
      {selectedActivity === 'matching' && (
        <div className="liquid-glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                Gentle Cognitive Focus
              </span>
              <h3 className="text-base font-bold text-slate-900">Calm Memory Pairs</h3>
            </div>
            <button
              type="button"
              onClick={initMatchingGame}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 cursor-pointer shadow-xs"
            >
              Shuffle
            </button>
          </div>

          <p className="text-xs text-slate-600">
            A quiet 8-card matching exercise to ease cognitive clutter and softly engage working memory.
          </p>

          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto py-4">
            {matchingCards.map((symbol, idx) => {
              const isMatched = matchedIndices.includes(idx);
              const isOpen = openCards.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCardClick(idx)}
                  className={`h-24 rounded-2xl border flex items-center justify-center text-2xl transition-all cursor-pointer ${
                    isOpen || isMatched
                      ? 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-xs'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 text-transparent'
                  }`}
                >
                  {isOpen || isMatched ? symbol : '•'}
                </button>
              );
            })}
          </div>

          {matchedIndices.length === 8 && (
            <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold animate-fade-in shadow-xs">
              ✨ All peaceful pairs matched! Your mind has settled.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MINDFUL CHECK-IN                                            */}
      {/* ============================================================== */}
      {selectedActivity === 'checkin' && (
        <div className="liquid-glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-white shadow-sm">
          <div className="border-b border-slate-200/80 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Personal Tracking
            </span>
            <h3 className="text-base font-bold text-slate-900">Daily Wellbeing Check-in</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              A private note on how you are experiencing this moment.
            </p>
          </div>

          {!checkinComplete ? (
            <div className="max-w-md mx-auto space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Feeling</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Calm', 'Tense', 'Fatigued', 'Steady', 'Overwhelmed', 'Restless'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setMood(m);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        mood === m
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                          : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Helpful Focus Today</label>
                <select
                  value={supportActivity}
                  onChange={(e) => setSupportActivity(e.target.value)}
                  className="w-full liquid-input px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  <option value="Deep breathing">Deep breathing break</option>
                  <option value="Step away from screen">Short screen hiatus</option>
                  <option value="Hydration & posture">Hydration and physical stretch</option>
                  <option value="Listening to companion">Talking things through in chat</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCheckinSubmit}
                className="w-full liquid-button-sage py-3 rounded-full text-xs font-extrabold uppercase tracking-wider mt-2 cursor-pointer text-white shadow-sm"
              >
                Log Check-in
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-extrabold text-slate-900">Check-in Recorded</h4>
              <p className="text-xs text-slate-600">
                Self-awareness is the first step toward autonomic nervous regulation.
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setCheckinComplete(false);
                }}
                className="text-xs text-emerald-700 hover:underline font-bold pt-2 cursor-pointer"
              >
                Log another check-in
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
