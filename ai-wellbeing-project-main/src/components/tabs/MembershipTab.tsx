import React, { useState } from 'react';
import {
  HRVChart,
  ScreenTimeChart,
  SleepChart,
  StressOutputChart,
} from '../visualizations/MembershipCharts';
import { InferenceResult } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface MembershipTabProps {
  hrv: number;
  screenTime: number;
  sleep: number;
  inferenceResult?: InferenceResult | null;
}

export const MembershipTab: React.FC<MembershipTabProps> = ({
  hrv,
  screenTime,
  sleep,
  inferenceResult,
}) => {
  const [activeView, setActiveView] = useState<'All' | 'HRV' | 'Screen' | 'Sleep' | 'Stress'>('All');

  const crispStress = inferenceResult?.crisp_stress_index;
  const aggSet = inferenceResult?.aggregated_fuzzy_set;
  const stressUniverse = inferenceResult?.stress_universe;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white shadow-sm">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
          Membership Functions
        </span>
        <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
          Fuzzy Set Visualizations & Dynamic Membership Markers
        </h3>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          Inspect the mathematical shape of each linguistic term across the universe of discourse. Markers indicate your current active physiological values.
        </p>

        {/* View Switcher */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/80">
          {(['All', 'HRV', 'Screen', 'Sleep', 'Stress'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveView(view);
              }}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                activeView === view
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900'
              }`}
            >
              {view === 'All' ? 'All Functions' : view === 'Screen' ? 'Screen Time' : view === 'Stress' ? 'Stress Output' : view}
            </button>
          ))}
        </div>
      </div>

      {/* Visualizations Grid */}
      {activeView === 'All' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HRVChart currentVal={hrv} />
          <ScreenTimeChart currentVal={screenTime} />
          <SleepChart currentVal={sleep} />
          <StressOutputChart
            crispStress={crispStress}
            aggregatedSet={aggSet}
            stressUniverse={stressUniverse}
          />
        </div>
      ) : activeView === 'HRV' ? (
        <div className="max-w-3xl mx-auto">
          <HRVChart currentVal={hrv} />
        </div>
      ) : activeView === 'Screen' ? (
        <div className="max-w-3xl mx-auto">
          <ScreenTimeChart currentVal={screenTime} />
        </div>
      ) : activeView === 'Sleep' ? (
        <div className="max-w-3xl mx-auto">
          <SleepChart currentVal={sleep} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <StressOutputChart
            crispStress={crispStress}
            aggregatedSet={aggSet}
            stressUniverse={stressUniverse}
          />
        </div>
      )}

      {/* Centroid Defuzzification Explanatory Note */}
      <div className="liquid-glass rounded-2xl p-5 text-xs text-slate-700 leading-relaxed border border-white shadow-xs">
        <strong className="text-emerald-800">Centroid Defuzzification Mathematics: </strong>
        The shaded area in the Stress Index chart represents the aggregated consequent fuzzy set (Mamdani MAX operator applied across all active rule implications). The vertical marker is the exact center of gravity (centroid) calculated across this continuous shape.
      </div>
    </div>
  );
};
