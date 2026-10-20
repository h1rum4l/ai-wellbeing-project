import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Trash2,
  Bookmark,
  Calendar,
  MessageSquare,
  Activity,
  AlertCircle,
  Eye,
  CheckCircle,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { StressinaPanda } from '../mascot/StressinaPanda';
import {
  CopingRecommendation,
  InferenceResult,
  SavedAssessment,
  SavedConversation,
  SavedGameSession,
  StressCategory,
  UserAccount,
} from '../../types';
import { store } from '../../storage/store';
import { triggerHaptic } from '../../utils/haptics';

interface HistoryTabProps {
  currentUser: UserAccount | null;
  lastAssessment?: {
    inference: InferenceResult;
    category: StressCategory;
    recommendation: CopingRecommendation;
  } | null;
  onOpenAuthModal?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  currentUser,
  lastAssessment,
  onOpenAuthModal,
}) => {
  const [assessments, setAssessments] = useState<SavedAssessment[]>([]);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [games, setGames] = useState<SavedGameSession[]>([]);
  const [selectedConv, setSelectedConv] = useState<SavedConversation | null>(null);
  const [notification, setNotification] = useState<string>('');

  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = () => {
    if (!currentUser) return;
    const aList = store.listAssessments(currentUser.id);
    const cList = store.listConversations(currentUser.id);
    const gList = store.listGameSessions(currentUser.id);

    setAssessments(aList);
    setConversations(cList);
    setGames(gList);

    if (aList.length > 0 && !startDate) {
      const dates = aList.map((a) => a.created_at.slice(0, 10));
      dates.sort();
      setStartDate(dates[0]);
      setEndDate(new Date().toISOString().slice(0, 10));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Login Protection Guard
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="liquid-glass-card rounded-3xl p-8 sm:p-10 text-center space-y-5 border border-white/95 shadow-md">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/90 border border-emerald-100 flex items-center justify-center shadow-xs">
            <StressinaPanda
              pose="safe_space"
              expression="empathetic"
              size="sm"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Protected Wellness Vault
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign In to Access Private Stress Analytics
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              To protect your personal physiological records, longitudinal stress trend trajectories, and relaxation logs, your timeline is securely encrypted in client-side storage.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto liquid-button-primary px-7 py-3 rounded-xl text-xs font-bold tracking-wide uppercase cursor-pointer shadow-sm"
              >
                Sign In or Register
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero cloud analytics · 100% Private Client-Side Storage</span>
          </div>
        </div>
      </div>
    );
  }

  const prefs = store.getPreferences(currentUser.id);

  // Filter assessments by date
  const filteredAssessments = assessments.filter((a) => {
    const aDate = a.created_at.slice(0, 10);
    if (startDate && aDate < startDate) return false;
    if (endDate && aDate > endDate) return false;
    return true;
  });

  const handleSaveLatest = () => {
    if (!lastAssessment) return;
    if (!prefs.save_assessments) {
      setNotification('Turn on "Save my stress assessments" in Account & Settings first.');
      setTimeout(() => setNotification(''), 4000);
      return;
    }

    const { inference, category, recommendation } = lastAssessment;
    triggerHaptic('success');
    store.saveAssessment(
      currentUser.id,
      inference.inputs.hrv,
      inference.inputs.screen_time,
      inference.inputs.sleep_duration,
      inference.crisp_stress_index,
      category,
      recommendation.title
    );
    loadData();
    setNotification('Latest assessment saved to your private history.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDeleteAssessment = (id: string) => {
    triggerHaptic('light');
    store.deleteAssessment(currentUser.id, id);
    loadData();
    setNotification('Assessment deleted.');
    setTimeout(() => setNotification(''), 3000);
  };

  const exportCSV = () => {
    if (filteredAssessments.length === 0) return;
    triggerHaptic('light');
    const headers = ['created_at', 'stress_index', 'category', 'hrv', 'screen_time', 'sleep', 'recommendation'];
    const rows = filteredAssessments.map((a) => [
      `"${a.created_at}"`,
      a.stress_index.toFixed(1),
      `"${a.category}"`,
      a.hrv.toFixed(0),
      a.screen_time.toFixed(1),
      a.sleep.toFixed(1),
      `"${a.recommendation.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_wellbeing_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Header Banner */}
      <div className="liquid-glass-card p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/90">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/90 border border-emerald-100 flex items-center justify-center shadow-xs">
            <StressinaPanda
              pose="analyzing"
              expression="listening"
              size="sm"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Longitudinal Metrics
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Stress Analytics & Timeline
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Track stress index trajectories, compare biometric inputs over time, and export clinical evaluation logs for <strong className="text-slate-800">{currentUser.display_name}</strong>.
            </p>
          </div>
        </div>

        {filteredAssessments.length > 0 && (
          <button
            type="button"
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold liquid-button-glass flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV Dataset</span>
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Save Latest Banner if available */}
      {lastAssessment && (
        <div className="liquid-glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-bold">Unsaved Assessment Ready:</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold">
                {lastAssessment.category} Stress ({lastAssessment.inference.crisp_stress_index.toFixed(1)}/100)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Prescribed Plan: <strong className="text-slate-900">{lastAssessment.recommendation.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveLatest}
            className="liquid-button-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save to History</span>
          </button>
        </div>
      )}

      {/* Stress Assessments List & Trend */}
      <div className="liquid-glass-card p-6 sm:p-7 space-y-6 border border-white/90">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Biometric Defuzzification Records</h4>
            <p className="text-xs text-slate-500">
              Session evaluations computed with Mamdani centroid defuzzification.
            </p>
          </div>
        </div>

        {/* Date Filters */}
        {assessments.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-xs bg-white/60 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="liquid-input rounded-lg px-2.5 py-1 text-slate-800 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="liquid-input rounded-lg px-2.5 py-1 text-slate-800 text-xs"
              />
            </div>
            <span className="text-slate-500 text-[11px] ml-auto font-mono">
              Showing {filteredAssessments.length} of {assessments.length} records
            </span>
          </div>
        )}

        {/* Trend Chart (SVG Sparkline / Trend line) */}
        {filteredAssessments.length > 1 && (
          <div className="p-5 rounded-2xl bg-white/70 border border-emerald-100 space-y-2">
            <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
              Autonomic Stress Index Trajectory
            </span>
            <div className="h-32 w-full flex items-end pt-4">
              <svg viewBox="0 0 500 85" className="w-full h-full overflow-visible">
                {/* Reference lines */}
                <line x1="0" y1="52" x2="500" y2="52" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="0" y1="26" x2="500" y2="26" stroke="#E2E8F0" strokeDasharray="3 3" />

                {/* Draw points & line */}
                {(() => {
                  const sorted = [...filteredAssessments].reverse();
                  const points = sorted.map((item, idx) => {
                    const x = (idx / Math.max(sorted.length - 1, 1)) * 480 + 10;
                    const y = 80 - (item.stress_index / 100) * 70 - 5;
                    return { x, y, val: item.stress_index, cat: item.category };
                  });

                  const pathD = points.reduce(
                    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                    ''
                  );

                  return (
                    <>
                      <path d={pathD} fill="none" stroke="#52BE80" strokeWidth="2.5" />
                      {points.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#FFFFFF"
                          stroke="#52BE80"
                          strokeWidth="2.5"
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
              <span>Low Tension (&lt; 40)</span>
              <span>Moderate Load (40 - 70)</span>
              <span>High Alert (&gt; 70)</span>
            </div>
          </div>
        )}

        {/* Assessment Entries List */}
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
              <StressinaPanda
                pose="hero_zen"
                expression="calm"
                size="xs"
                showLotusPlatform={false}
                showAura={false}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              No assessments recorded yet. Run a scan in the Daily Check-in tab and click &quot;Save to Timeline&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAssessments.map((a) => {
              const categoryColor =
                a.category === 'High'
                  ? 'text-rose-700 border-rose-200 bg-rose-50'
                  : a.category === 'Medium'
                  ? 'text-amber-700 border-amber-200 bg-amber-50'
                  : 'text-emerald-700 border-emerald-200 bg-emerald-50';

              return (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl liquid-glass-interactive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-white/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${categoryColor}`}>
                        {a.category} Stress
                      </span>
                      <span className="text-slate-900 font-mono font-bold">
                        {a.stress_index.toFixed(1)} / 100
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      Recommendation: <strong className="text-slate-900">{a.recommendation}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Inputs: HRV {a.hrv.toFixed(0)} ms · Screen {a.screen_time.toFixed(1)}h · Sleep {a.sleep.toFixed(1)}h
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAssessment(a.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer self-end sm:self-auto"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Activities (Breathing & Grounding) */}
      <div className="liquid-glass-card p-6 sm:p-7 space-y-4 border border-white/90">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-700" />
          <span>Relaxation Sessions Log</span>
        </h4>
        <p className="text-xs text-slate-500">
          Completed guided breathing, 5-4-3-2-1 grounding, and mindful check-ins.
        </p>

        {games.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No relaxation sessions completed yet. Try a guided breathing exercise in Stressina’s Corner.
          </p>
        ) : (
          <div className="space-y-2">
            {games.map((g) => (
              <div
                key={g.id}
                className="p-3.5 rounded-xl bg-white/70 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{g.game_name}</div>
                  <div className="text-[11px] text-slate-500">{g.reflection || 'Session completed'}</div>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>{Math.round(g.duration_seconds / 60)} min</div>
                  <div>{new Date(g.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
