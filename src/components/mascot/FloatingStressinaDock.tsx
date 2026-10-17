import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Wind,
  Home,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { StressinaPanda, StressinaExpression, StressinaPose } from './StressinaPanda';
import { companionVoice } from '../../utils/companionVoice';
import { triggerHaptic } from '../../utils/haptics';

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
  const [isMuted, setIsMuted] = useState(companionVoice.isVoiceMuted());
  const [pose, setPose] = useState<StressinaPose>('waving');
  const [expression, setExpression] = useState<StressinaExpression>('calm');
  const [bubbleText, setBubbleText] = useState("I'm here with you! Take your time.");

  // Sync mute
  useEffect(() => {
    const unsub = companionVoice.subscribe(() => {
      setIsMuted(companionVoice.isVoiceMuted());
    });
    return unsub;
  }, []);

  // Update contextual line based on current tab
  useEffect(() => {
    if (currentTab === 'checkin') {
      setBubbleText("Tune in to your body. There are no wrong answers here.");
      setExpression('calm');
      setPose('sitting');
    } else if (currentTab === 'analytics') {
      setBubbleText("Look at your trend lines without judgment. Every step matters.");
      setExpression('thinking');
      setPose('sitting');
    } else if (currentTab === 'quests') {
      setBubbleText("Celebrate small wins! Daily mindful habits build lasting calm.");
      setExpression('happy');
      setPose('jumping');
    } else if (currentTab === 'corner' || currentTab === 'breathing') {
      setBubbleText("Deep breaths expand your vagal tone and reset your nervous system.");
      setExpression('calm');
      setPose('relaxing');
    } else {
      setBubbleText("I'm right by your side. Tap me whenever you need calm.");
      setExpression('calm');
      setPose('waving');
    }
  }, [currentTab]);

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

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end select-none animate-fade-in">
      {/* Expanded Speech & Action Card */}
      {isOpen && (
        <div className="mb-3 w-72 liquid-glass-card rounded-3xl p-4 border border-white shadow-xl animate-fade-in text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Stressina</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Companion</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 rounded-full text-slate-500 hover:text-slate-800 cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mb-3">
            {bubbleText}
          </p>

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
                onNavigate('breathing');
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
                else onNavigate('chat');
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
        className="w-14 h-14 rounded-full liquid-glass-hero bg-white/95 border-2 border-white flex items-center justify-center cursor-pointer shadow-xl transition-transform hover:scale-110 active:scale-95 group relative"
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
