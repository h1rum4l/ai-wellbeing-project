import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  X,
  Heart,
  Wind,
  Camera,
} from 'lucide-react';
import {
  StressinaPanda,
  StressinaPose,
  StressinaExpression,
} from './StressinaPanda';
import { companionVoice, OFFICIAL_INTRO_GREETING } from '../../utils/companionVoice';
import { triggerHaptic } from '../../utils/haptics';
import { InferenceResult, StressCategory } from '../../types';
import { store } from '../../storage/store';

interface InteractiveStressinaCompanionProps {
  lastAssessment?: {
    inference: InferenceResult;
    category: StressCategory;
  } | null;
  onNavigateToTab?: (tab: string) => void;
  className?: string;
  compact?: boolean;
}

const TAP_REASSURANCES = [
  { text: "Hi there! I'm right here with you.", exp: 'happy' as StressinaExpression, pose: 'waving' as StressinaPose },
  { text: "Let's take a gentle breath together...", exp: 'calm' as StressinaExpression, pose: 'relaxing' as StressinaPose },
  { text: "Small steps make a big difference every day.", exp: 'excited' as StressinaExpression, pose: 'jumping' as StressinaPose },
  { text: "You're safe in this sanctuary. Rest your mind.", exp: 'blushing' as StressinaExpression, pose: 'sitting' as StressinaPose },
  { text: "Listening to your body is your greatest superpower.", exp: 'thinking' as StressinaExpression, pose: 'idle_float' as StressinaPose },
];

export const InteractiveStressinaCompanion: React.FC<InteractiveStressinaCompanionProps> = ({
  lastAssessment,
  onNavigateToTab,
  className = '',
  compact = false,
}) => {
  // Companion emotional & movement state
  const [pose, setPose] = useState<StressinaPose>('idle_float');
  const [expression, setExpression] = useState<StressinaExpression>('calm');
  const [speechText, setSpeechText] = useState<string>(OFFICIAL_INTRO_GREETING);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(companionVoice.isVoiceMuted());
  const [speechBubbleDismissed, setSpeechBubbleDismissed] = useState<boolean>(false);
  const [hasCustomPanda, setHasCustomPanda] = useState<boolean>(() => !!store.getCustomPandaImage());

  useEffect(() => {
    const handleUpdate = () => {
      setHasCustomPanda(!!store.getCustomPandaImage());
    };
    window.addEventListener('stressina_panda_image_updated', handleUpdate);
    return () => window.removeEventListener('stressina_panda_image_updated', handleUpdate);
  }, []);

  const handleUploadPanda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        store.setCustomPandaImage(dataUrl);
        setHasCustomPanda(true);
        triggerHaptic('medium');
        window.dispatchEvent(new Event('stressina_panda_image_updated'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPanda = () => {
    store.setCustomPandaImage(null);
    setHasCustomPanda(false);
    triggerHaptic('light');
    window.dispatchEvent(new Event('stressina_panda_image_updated'));
  };

  // Playful Anti-Gravity Movement Mode
  const [isPlayfulMode, setIsPlayfulMode] = useState<boolean>(false);
  const [mascotPos, setMascotPos] = useState({ x: 0, y: 0 });
  const arenaRef = useRef<HTMLDivElement>(null);
  const tapIndexRef = useRef<number>(0);

  // Check user's prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Subscribe to companion voice engine changes
  useEffect(() => {
    const unsub = companionVoice.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Sync contextual reaction to assessment score
  useEffect(() => {
    if (lastAssessment) {
      const score = Math.round(lastAssessment.inference.crisp_stress_index);
      if (score >= 65) {
        setExpression('calm');
        setPose('relaxing');
        setSpeechText("I notice your stress load is elevated right now. Let's take a 3-minute gentle breathing reset together.");
        setSpeechBubbleDismissed(false);
      } else if (score < 35) {
        setExpression('happy');
        setPose('waving');
        setSpeechText("Your biometrics look beautifully balanced! Keep up the mindful pacing today.");
        setSpeechBubbleDismissed(false);
      } else {
        setExpression('calm');
        setPose('idle_float');
      }
    }
  }, [lastAssessment]);

  // Handle Mascot Tap / Click Interaction
  const handlePandaClick = () => {
    triggerHaptic('medium');

    const nextReassurance = TAP_REASSURANCES[tapIndexRef.current % TAP_REASSURANCES.length];
    tapIndexRef.current++;

    setPose(nextReassurance.pose);
    setExpression(nextReassurance.exp);
    setSpeechText(nextReassurance.text);
    setSpeechBubbleDismissed(false);

    // Speak line through speech synthesis
    companionVoice.speak(nextReassurance.text);

    // Return to resting idle pose after 3.2 seconds
    setTimeout(() => {
      setPose('idle_float');
      setExpression('calm');
    }, 3200);
  };

  // Replay Introductory Voice Greeting
  const handlePlayGreeting = () => {
    triggerHaptic('selection');
    setSpeechText(OFFICIAL_INTRO_GREETING);
    setSpeechBubbleDismissed(false);
    setPose('waving');
    setExpression('happy');
    companionVoice.speak(OFFICIAL_INTRO_GREETING, {
      forceEvenIfMuted: true,
      onEnd: () => {
        setPose('idle_float');
        setExpression('calm');
      },
    });
  };

  const handleToggleMute = () => {
    triggerHaptic('light');
    const nextMute = companionVoice.toggleMute();
    setIsMuted(nextMute);
  };

  // Playful Anti-Gravity movement pointer tracker within arena
  const handleArenaPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPlayfulMode || prefersReducedMotion || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);

    // Strict boundary limits to prevent occluding surrounding UI
    const clampX = Math.max(-95, Math.min(95, relX * 0.45));
    const clampY = Math.max(-40, Math.min(40, relY * 0.35));

    setMascotPos({ x: clampX, y: clampY });
  };

  const handleTogglePlayfulMode = () => {
    triggerHaptic('medium');
    const next = !isPlayfulMode;
    setIsPlayfulMode(next);
    if (next) {
      setPose('running');
      setExpression('excited');
      setSpeechText("Anti-gravity floating active! Move your cursor or finger to glide with me.");
      setSpeechBubbleDismissed(false);
      companionVoice.speak("Anti-gravity floating active! Glide with me.");
    } else {
      setMascotPos({ x: 0, y: 0 });
      setPose('idle_float');
      setExpression('calm');
    }
  };

  return (
    <div
      ref={arenaRef}
      onPointerMove={handleArenaPointerMove}
      className={`relative flex flex-col items-center justify-between ${className}`}
    >
      {/* Top Controls Bar: Voice, Replay, Playful Mode & Speech Bubble */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 px-1 sm:px-2 mb-2 z-20 flex-wrap sm:flex-nowrap">
        
        {/* Left: Playful Floating Mode Toggle */}
        <button
          type="button"
          onClick={handleTogglePlayfulMode}
          className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 border shrink-0 ${
            isPlayfulMode
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm animate-pulse'
              : 'bg-white/80 text-slate-700 border-white/90 hover:bg-white shadow-2xs'
          }`}
          title="Toggle Anti-Gravity Floating Arena"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isPlayfulMode ? 'Anti-Gravity Active' : 'Playful Float'}</span>
        </button>

        {/* Right: Audio Speaker Replay & Mute Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Replay Voice Greeting */}
          <button
            type="button"
            onClick={handlePlayGreeting}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-white/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5"
            title="Replay Voice Greeting"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Hear Stressina</span>
          </button>

          {/* Custom Panda Mascot Artwork Uploader */}
          <label
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-white/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5"
            title="Upload / Change Panda Mascot Artwork"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">{hasCustomPanda ? 'Change Panda' : 'My Panda'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPanda}
            />
          </label>

          {hasCustomPanda && (
            <button
              type="button"
              onClick={handleResetPanda}
              className="p-1.5 rounded-full bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-white/90 shadow-2xs transition-colors cursor-pointer"
              title="Reset to Default Mascot"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
              isMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white/85 hover:bg-white text-emerald-800 border-white/90'
            }`}
            title={isMuted ? 'Unmute voice companion' : 'Mute voice companion'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Floating Reassuring Speech Bubble Beside Stressina */}
      {!speechBubbleDismissed && speechText && (
        <div className="relative z-20 max-w-[94vw] sm:max-w-sm mx-auto mb-2 sm:mb-3 animate-fade-in">
          <div className="relative p-2.5 sm:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-md text-slate-800 text-xs sm:text-[13px] leading-relaxed">
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSpeechBubbleDismissed(true);
              }}
              className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-2 sm:gap-2.5 pr-4">
              <span className="text-base select-none shrink-0 mt-0.5">🐼</span>
              <p className="font-normal text-slate-700 text-left">
                {speechText}
              </p>
            </div>

            {/* Speech Bubble Arrow pointing to panda below */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-b border-r border-white transform rotate-45" />
          </div>
        </div>
      )}

      {/* Anti-Gravity Mascot Arena */}
      <div
        className="relative my-1 sm:my-2 flex items-center justify-center transition-transform duration-300 ease-out max-w-full"
        style={{
          transform: `translate3d(${mascotPos.x}px, ${mascotPos.y}px, 0)`,
        }}
      >
        <div className={`max-w-full ${prefersReducedMotion ? '' : 'animate-gentle-float'}`}>
          <StressinaPanda
            pose={pose}
            expression={expression}
            size={compact ? 'md' : 'hero'}
            showLotusPlatform={!isPlayfulMode}
            showAura={true}
            interactive={true}
            isSpeaking={isSpeaking}
            onClick={handlePandaClick}
            lookAtPointer={true}
            caption={isPlayfulMode ? 'Tap me to jump!' : 'Tap Stressina'}
          />
        </div>
      </div>

      {/* Companion Quick Action Pills Below Mascot */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1.5 sm:pt-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setPose('relaxing');
            setExpression('calm');
            setSpeechText("Let's breathe deeply. Inhale peace, exhale tension.");
            setSpeechBubbleDismissed(false);
            companionVoice.speak("Let's breathe deeply. Inhale peace, exhale tension.");
            if (onNavigateToTab) onNavigateToTab('breathing');
          }}
          className="px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/85 hover:bg-white text-slate-700 border border-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Wind className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Breathe with Stressina</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setPose('waving');
            setExpression('happy');
            setSpeechText("I'm always here to listen. Share whatever is on your mind.");
            setSpeechBubbleDismissed(false);
            companionVoice.speak("I'm always here to listen. Share whatever is on your mind.");
            if (onNavigateToTab) onNavigateToTab('chat');
          }}
          className="px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/85 hover:bg-white text-slate-700 border border-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Comfort Chat</span>
        </button>
      </div>
    </div>
  );
};
