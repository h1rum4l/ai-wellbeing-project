import React, { useState } from 'react';
import {
  Wind,
  Sparkles,
  MessageSquare,
  Play,
  RotateCcw,
  Heart,
  Volume2,
  VolumeX,
  Smile,
  Shield,
  Zap,
} from 'lucide-react';
import { StressinaPanda } from '../mascot/StressinaPanda';
import { RelaxAndPlayTab } from '../tabs/RelaxAndPlayTab';
import { StressCrushGame } from '../games/StressCrushGame';
import { ChatTab } from '../tabs/ChatTab';
import { triggerHaptic } from '../../utils/haptics';

interface StressinaCornerViewProps {
  initialSubTab?: 'breathing' | 'game' | 'chat';
  onNavigateToTab?: (tab: string) => void;
  chatTopic?: string;
}

export const StressinaCornerView: React.FC<StressinaCornerViewProps> = ({
  initialSubTab = 'breathing',
  onNavigateToTab,
  chatTopic,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'breathing' | 'game' | 'chat'>(initialSubTab);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Header Banner with Mascot Safe Space & Hugs Pose */}
      <div className="liquid-glass-card p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/90">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/90 border border-emerald-100 flex items-center justify-center shadow-xs">
            <StressinaPanda
              pose="safe_space"
              expression="empathetic"
              size="sm"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Sanctuary & Mindful Practices
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Stressina’s Corner
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Your safe space to unwind with guided parasympathetic breathing, stress-crush cognitive deflection, and empathetic conversation.
            </p>
          </div>
        </div>

        {/* Clean Segmented Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-2xl border border-slate-200 shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('breathing');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'breathing'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Breathing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('game');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'game'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stress Crush</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('chat');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'chat'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Companion Chat</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'breathing' && (
        <div className="space-y-6">
          <RelaxAndPlayTab onNavigateToGames={() => setActiveSubTab('game')} />
        </div>
      )}

      {activeSubTab === 'game' && (
        <div className="space-y-6">
          {/* Stress Crush with Mascot Sweeping Pose banner */}
          <div className="liquid-glass-card p-5 border border-pink-100 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0">
                <StressinaPanda
                  pose="sweeping"
                  expression="celebration"
                  size="xs"
                  showLotusPlatform={false}
                  showAura={false}
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Stress Crush Candy Puzzle
                </h4>
                <p className="text-xs text-slate-600">
                  Swap and match candies to clear your mental bandwidth. Stressina sweeps away tension with every cascade!
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              Cognitive Deflection
            </span>
          </div>

          <StressCrushGame />
        </div>
      )}

      {activeSubTab === 'chat' && (
        <div className="space-y-6">
          <ChatTab initialTopic={chatTopic} />
        </div>
      )}
    </div>
  );
};
