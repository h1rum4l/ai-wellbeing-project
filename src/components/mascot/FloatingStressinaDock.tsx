import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Wind,
  Home,
  MessageSquare,
  Sparkles,
  Music,
  ChevronDown,
  Minimize2,
} from 'lucide-react';
import { StressinaPanda, StressinaExpression, StressinaPose } from './StressinaPanda';
import { companionVoice } from '../../utils/companionVoice';
import { triggerHaptic } from '../../utils/haptics';
import { pandaSoundscapes } from '../../utils/pandaSoundscapes';

interface FloatingStressinaDockProps {
  currentTab: string;
  onNavigate: (tabId: string) => void;
  onOpenChat?: () => void;
}

export const FloatingStressinaDock: React.FC<FloatingStressinaDockProps> = ({
  currentTab,
  onNavigate,
  onOpenChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMuted, setIsMuted] = useState(companionVoice.isVoiceMuted());
  const [soundscapeState, setSoundscapeState] = useState(pandaSoundscapes.getState());
  const [pose, setPose] = useState<StressinaPose>('waving');
  const [expression, setExpression] = useState<StressinaExpression>('calm');
  const [bubbleText, setBubbleText] = useState("I'm here with you! Take your time.");

  // When inside Stressina's Corner, Guided Breathing, or Games,
  // the page already features Stressina directly. Do not render floating dock.
  const isCornerOrBreathing = ['corner', 'breathing', 'candy_crush', 'chat'].includes(currentTab);

  // Sync mute state
  useEffect(() => {
    const unsub = companionVoice.subscribe(() => {
      setIsMuted(companionVoice.isVoiceMuted());
    });
    return unsub;
  }, []);

  // Sync soundscape state
  useEffect(() => {
    const unsub = pandaSoundscapes.subscribe(() => {
      setSoundscapeState(pandaSoundscapes.getState());
    });
    return unsub;
  }, []);

  // Update contextual guidance based on current tab
  useEffect(() => {
    setIsDismissed(false); // Reset dismissal on tab change if user wants guidance
    if (currentTab === 'checkin' || currentTab === 'assessment') {
      setBubbleText("Tune in to your body. There are no wrong answers here.");
      setExpression('calm');
      setPose('sitting');
    } else if (currentTab === 'analytics' || currentTab === 'history') {
      setBubbleText("Look at your trend lines without judgment. Every step matters.");
      setExpression('thinking');
      setPose('sitting');
    } else if (currentTab === 'help' || currentTab === 'quests') {
      setBubbleText("Celebrate small wins! Daily mindful habits build lasting calm.");
      setExpression('happy');
      setPose('jumping');
    } else {
      setBubbleText("I'm right by your side. Tap me whenever you need calm.");
      setExpression('calm');
      setPose('waving');
    }
  }, [currentTab]);

  if (isCornerOrBreathing || isDismissed) {
    return null;
  }

  const handleToggleOpen = () => {
    triggerHaptic('medium');
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setPose('waving');
      setExpression('happy');
      companionVoice.speak(bubbleText);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const next = companionVoice.toggleMute();
    setIsMuted(next);
  };

  const handleToggleSoundscape = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    pandaSoundscapes.togglePlay();
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end select-none animate-fade-in pointer-events-none">
      {/* Expanded Speech & Action Card */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-76 sm:w-80 liquid-glass-card rounded-3xl p-4 border border-white shadow-2xl animate-fade-in text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Stressina</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Companion
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Soundscape quick toggle */}
              <button
                type="button"
                onClick={handleToggleSoundscape}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  soundscapeState.isPlaying
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={soundscapeState.isPlaying ? 'Pause Nature Soundscapes' : 'Play Nature Soundscapes'}
              >
                <Music className="w-3.5 h-3.5" />
              </button>
              {/* Voice mute toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 cursor-pointer"
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
              </button>
              {/* Dismiss / Minimize button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Collapse"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mb-3">
            {bubbleText}
          </p>

          {/* Quick Soundscape Status Bar if playing */}
          {soundscapeState.isPlaying && (
            <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-emerald-900 truncate">
                <span>{soundscapeState.currentTrack.emoji}</span>
                <span className="truncate">{soundscapeState.currentTrack.name}</span>
              </span>
              <button
                type="button"
                onClick={() => pandaSoundscapes.pause()}
                className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0 ml-1"
              >
                Pause
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('home');
                setIsOpen(false);
              }}
              className="py-1.5 px-1.5 rounded-xl text-[10px] font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Home className="w-3 h-3 text-emerald-700" />
              <span>Sanctuary</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('corner');
                setIsOpen(false);
              }}
              className="py-1.5 px-1.5 rounded-xl text-[10px] font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Wind className="w-3 h-3 text-emerald-700" />
              <span>Breathe</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                if (onOpenChat) onOpenChat();
                setIsOpen(false);
              }}
              className="py-1.5 px-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3 h-3 text-white" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Avatar Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className="pointer-events-auto w-13 h-13 sm:w-14 sm:h-14 rounded-full liquid-glass-hero bg-white/95 border-2 border-white flex items-center justify-center cursor-pointer shadow-xl transition-transform hover:scale-110 active:scale-95 group relative"
        title="Tap Stressina"
      >
        <StressinaPanda
          pose={pose}
          expression={expression}
          size="sm"
          showLotusPlatform={false}
          showAura={false}
          interactive={false}
        />
        {/* Breathing aura pulse dot */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
      </button>
    </div>
  );
};
