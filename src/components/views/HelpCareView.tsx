import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  PhoneCall,
  HeartHandshake,
  HelpCircle,
  FileQuestion,
  CheckCircle,
} from 'lucide-react';
import { StressinaPanda } from '../mascot/StressinaPanda';
import { CounsellorTab } from '../tabs/CounsellorTab';
import { QuestsTab } from '../tabs/QuestsTab';
import { triggerHaptic } from '../../utils/haptics';

import { UserAccount } from '../../types';

interface HelpCareViewProps {
  currentUser?: UserAccount | null;
  onNavigateToTab?: (tab: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const HelpCareView: React.FC<HelpCareViewProps> = ({
  currentUser,
  onNavigateToTab,
  onOpenAuthModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'support' | 'quests'>('support');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Header Banner */}
      <div className="liquid-glass-card p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/90">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/90 border border-emerald-100 flex items-center justify-center shadow-xs">
            <StressinaPanda
              pose="celebration"
              expression="celebration"
              size="sm"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Guidance & Personal Growth
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Help, Quests & Care
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Connect with certified support resources, review crisis hotlines, or build resilient daily well-being habits with mark rewards.
            </p>
          </div>
        </div>

        {/* Sub-tab segmented buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-2xl border border-slate-200 shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('support');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'support'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Support & Hotlines</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('quests');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'quests'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Daily Quests & Marks</span>
          </button>
        </div>
      </div>

      {/* Subtab Contents */}
      {activeSubTab === 'support' && (
        <CounsellorTab
          currentUser={currentUser || null}
          onOpenAuthModal={() => onOpenAuthModal?.('login')}
        />
      )}

      {activeSubTab === 'quests' && (
        <QuestsTab
          currentUser={currentUser || null}
          onOpenAuthModal={(m) => onOpenAuthModal?.(m || 'register')}
          onNavigateToTab={onNavigateToTab}
        />
      )}
    </div>
  );
};
