import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  RefreshCw,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Heart,
  Monitor,
  Moon,
  Sparkles,
  Bookmark,
  CheckCircle2,
  ArrowRight,
  Wind,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import {
  AVAILABLE_TIME_OPTIONS,
  CONTEXT_OPTIONS,
  UNIVERSE_CONFIG,
} from '../../engine/fuzzyConfig';
import { runFuzzyInference } from '../../engine/inference';
import { classifyStress, getCategoryBadgeInfo } from '../../engine/classifier';
import { selectCopingRecommendation } from '../../recommendation/recommendationEngine';
import { generateExplanation } from '../../explanation/explanationEngine';
import { StressinaPanda } from '../mascot/StressinaPanda';
import {
  CopingRecommendation,
  ExplanationPayload,
  InferenceResult,
  StressCategory,
  UserAccount,
} from '../../types';
import { store } from '../../storage/store';

interface AssessmentTabProps {
  hrv: number;
  setHrv: (v: number) => void;
  screenTime: number;
  setScreenTime: (v: number) => void;
  sleep: number;
  setSleep: (v: number) => void;
  timeOption: string;
  setTimeOption: (v: string) => void;
  contextOption: string;
  setContextOption: (v: string) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onAssessmentCompleted?: (result: {
    inference: InferenceResult;
    category: StressCategory;
    recommendation: CopingRecommendation;
    explanation: ExplanationPayload;
  }) => void;
  onOpenChatWithTopic?: (topic: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AssessmentTab: React.FC<AssessmentTabProps> = ({
  hrv,
  setHrv,
  screenTime,
  setScreenTime,
  sleep,
  setSleep,
  timeOption,
  setTimeOption,
  contextOption,
  setContextOption,
  currentUser,
  onOpenAuthModal,
  onAssessmentCompleted,
  onOpenChatWithTopic,
  onNavigateToTab,
}) => {
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [category, setCategory] = useState<StressCategory>('Low');
  const [recommendation, setRecommendation] = useState<CopingRecommendation | null>(null);
  const [explanation, setExplanation] = useState<ExplanationPayload | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showTransparency, setShowTransparency] = useState<boolean>(false);
  const [showHowCalculated, setShowHowCalculated] = useState<boolean>(false);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);

  // Validate inputs
  const validateInputs = (): string | null => {
    if (hrv < UNIVERSE_CONFIG.hrv.min || hrv > UNIVERSE_CONFIG.hrv.max) {
      return `HRV must be between ${UNIVERSE_CONFIG.hrv.min} and ${UNIVERSE_CONFIG.hrv.max} ms.`;
    }
    if (screenTime < UNIVERSE_CONFIG.screen_time.min || screenTime > UNIVERSE_CONFIG.screen_time.max) {
      return `Screen time must be between ${UNIVERSE_CONFIG.screen_time.min} and ${UNIVERSE_CONFIG.screen_time.max} hours.`;
    }
    if (sleep < UNIVERSE_CONFIG.sleep_duration.min || sleep > UNIVERSE_CONFIG.sleep_duration.max) {
      return `Sleep duration must be between ${UNIVERSE_CONFIG.sleep_duration.min} and ${UNIVERSE_CONFIG.sleep_duration.max} hours.`;
    }
    return null;
  };

  const validationError = validateInputs();

  // Run initial calculation once mounted
  useEffect(() => {
    if (!inferenceResult) {
      executeAnalysis();
    }
  }, []);

  const executeAnalysis = () => {
    if (validationError) return;

    const res = runFuzzyInference(hrv, screenTime, sleep);
    const cat = classifyStress(res.crisp_stress_index);

    let stressorHint: string | undefined = undefined;
    if (res.memberships.sleep_duration.inadequate >= 0.4) {
      stressorHint = 'sleep';
    } else if (res.memberships.screen_time.prolonged >= 0.4) {
      stressorHint = 'screen';
    } else if (res.memberships.hrv.low >= 0.5) {
      stressorHint = 'breathing';
    }

    const rec = selectCopingRecommendation(cat, timeOption, contextOption, stressorHint);
    const exp = generateExplanation(res, cat, rec);

    setInferenceResult(res);
    setCategory(cat);
    setRecommendation(rec);
    setExplanation(exp);
    setSaveStatus('');

    if (onAssessmentCompleted) {
      onAssessmentCompleted({
        inference: res,
        category: cat,
        recommendation: rec,
        explanation: exp,
      });
    }
  };

  // Re-run on slider changes if continuous mode is enabled
  useEffect(() => {
    if (continuousMode && !validationError) {
      executeAnalysis();
    }
  }, [hrv, screenTime, sleep, timeOption, contextOption, continuousMode]);

  const resetDefaults = () => {
    triggerHaptic('medium');
    setHrv(UNIVERSE_CONFIG.hrv.default);
    setScreenTime(UNIVERSE_CONFIG.screen_time.default);
    setSleep(UNIVERSE_CONFIG.sleep_duration.default);
    setTimeOption(AVAILABLE_TIME_OPTIONS[0]);
    setContextOption(CONTEXT_OPTIONS[0]);
  };

  const downloadReport = () => {
    if (!explanation) return;
    triggerHaptic('light');
    const blob = new Blob([explanation.formatted_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stress_assessment_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAssessment = () => {
    if (!inferenceResult || !recommendation) return;
    if (!currentUser) {
      triggerHaptic('selection');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const prefs = store.getPreferences(currentUser.id);
    if (!prefs.save_assessments) {
      triggerHaptic('warning');
      setSaveStatus('Please enable "Save assessments" in Account Settings.');
      setTimeout(() => setSaveStatus(''), 4000);
      return;
    }

    triggerHaptic('success');
    store.saveAssessment(
      currentUser.id,
      hrv,
      screenTime,
      sleep,
      inferenceResult.crisp_stress_index,
      category,
      recommendation.title
    );
    setSaveStatus('Saved to your private timeline!');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const badge = getCategoryBadgeInfo(category);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Top Banner with Mascot Guide in Liquid Glass */}
      <div className="liquid-glass p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/80 border border-white flex items-center justify-center shadow-md">
            <StressinaPanda
              pose="analyzing"
              expression="listening"
              size="sm"
              showLotusPlatform={false}
              showAura={false}
            />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Daily Physiological Evaluation
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Real-Time Biometric Stress Scanner
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Stressina actively analyzes your autonomic heart rate variability, screen fatigue, and sleep recovery using Mamdani fuzzy inference.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer bg-white/70 px-3.5 py-2 rounded-full border border-white shadow-xs backdrop-blur-md">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>Live Scan</span>
          </label>
          <button
            type="button"
            onClick={resetDefaults}
            className="text-xs text-slate-700 flex items-center gap-1.5 px-3.5 py-2 rounded-full liquid-button-clear cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Input Universe Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* HRV Slider Card */}
        <div className="liquid-glass p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>Autonomic HRV (RMSSD)</span>
            </label>
            <span className="text-xs font-mono font-bold text-slate-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {hrv.toFixed(0)} ms
            </span>
          </div>
          <input
            type="range"
            min={UNIVERSE_CONFIG.hrv.min}
            max={UNIVERSE_CONFIG.hrv.max}
            step={UNIVERSE_CONFIG.hrv.step}
            value={hrv}
            onChange={(e) => {
              triggerHaptic('selection');
              setHrv(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>20 ms (Depressed)</span>
            <span>120 ms (Resilient)</span>
          </div>
          <p className="text-[11px] text-slate-600 pt-1 leading-snug">
            Higher values signify parasympathetic vagal activation and biological recovery.
          </p>
        </div>

        {/* Screen Time Slider Card */}
        <div className="liquid-glass p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>Digital Screen Exposure</span>
            </label>
            <span className="text-xs font-mono font-bold text-slate-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {screenTime.toFixed(1)} h
            </span>
          </div>
          <input
            type="range"
            min={UNIVERSE_CONFIG.screen_time.min}
            max={UNIVERSE_CONFIG.screen_time.max}
            step={UNIVERSE_CONFIG.screen_time.step}
            value={screenTime}
            onChange={(e) => {
              triggerHaptic('selection');
              setScreenTime(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 h (Rest)</span>
            <span>16 h (Overload)</span>
          </div>
          <p className="text-[11px] text-slate-600 pt-1 leading-snug">
            Prolonged sensory exposure triggers ocular strain and sympathetic arousal.
          </p>
        </div>

        {/* Sleep Duration Slider Card */}
        <div className="liquid-glass p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-emerald-600" />
              <span>Nightly Sleep Duration</span>
            </label>
            <span className="text-xs font-mono font-bold text-slate-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {sleep.toFixed(1)} h
            </span>
          </div>
          <input
            type="range"
            min={UNIVERSE_CONFIG.sleep_duration.min}
            max={UNIVERSE_CONFIG.sleep_duration.max}
            step={UNIVERSE_CONFIG.sleep_duration.step}
            value={sleep}
            onChange={(e) => {
              triggerHaptic('selection');
              setSleep(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2 h (Acute debt)</span>
            <span>10 h (Optimal)</span>
          </div>
          <p className="text-[11px] text-slate-600 pt-1 leading-snug">
            Slow-wave cycles regenerate neural neurotransmitters and emotional resilience.
          </p>
        </div>
      </div>

      {/* Contextual Coping Preferences */}
      <div className="liquid-glass p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-2/3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Available Break Window:</span>
              </label>
              <select
                value={timeOption}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setTimeOption(e.target.value);
                }}
                className="w-full liquid-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                {AVAILABLE_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Environment:</span>
              </label>
              <select
                value={contextOption}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setContextOption(e.target.value);
                }}
                className="w-full liquid-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                {CONTEXT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full sm:w-1/3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                executeAnalysis();
              }}
              className="w-full py-3 px-5 rounded-full liquid-button-sage text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute Stress Index</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section in Liquid Glass */}
      {inferenceResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Defuzzification Metric Card */}
            <div className="liquid-glass p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Defuzzified Stress Index
                </span>
                <span className="text-xs text-emerald-800 font-mono font-bold">Centroid Defuzzification</span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-5xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                  {inferenceResult.crisp_stress_index.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-slate-500">/ 100 points</span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="w-full bg-slate-200 border border-slate-300 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400"
                    style={{ width: `${inferenceResult.crisp_stress_index}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 (Low)</span>
                  <span>40 (Medium)</span>
                  <span>70 (High)</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Linguistic Classification Card */}
            <div className="liquid-glass p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Linguistic State
                </span>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badge.badgeClass}`}>
                  {badge.label}
                </span>
              </div>

              <div className="my-1">
                <h4 className="text-2xl font-extrabold text-slate-900 mb-1">{category} Stress Load</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{badge.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-mono">
                  Boundaries: Low &lt; 40 | Med 40–70 | High &gt; 70
                </span>
                <button
                  type="button"
                  onClick={downloadReport}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coping Recommendation */}
          {recommendation && (
            <div className="liquid-glass-hero p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Adaptive Recommendation
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      {recommendation.duration}
                    </span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {recommendation.title}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveAssessment}
                    className="liquid-button-sage px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save to Timeline</span>
                  </button>

                  {onOpenChatWithTopic && (
                    <button
                      type="button"
                      onClick={() => onOpenChatWithTopic(recommendation.title)}
                      className="liquid-button-clear text-xs px-4 py-2 rounded-full font-semibold cursor-pointer shadow-xs"
                    >
                      <span className="text-slate-800">Discuss with Stressina</span>
                    </button>
                  )}
                </div>
              </div>

              {saveStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">{saveStatus}</span>
                </div>
              )}

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {recommendation.description}
              </p>

              <div className="p-4 rounded-2xl bg-white/70 border border-emerald-200 text-xs text-slate-700 shadow-xs">
                <strong className="text-slate-900 font-bold">Physiological Rationale: </strong>
                {recommendation.selection_rationale || recommendation.reason}
              </div>

              {/* Quick links to breathing & games */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {onNavigateToTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        onNavigateToTab('breathing');
                      }}
                      className="p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-white text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                          <Wind className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                            Guided Breathing Sanctuary
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Regulate nervous system vagal tone
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        onNavigateToTab('candy_crush');
                      }}
                      className="p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-white text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                            Stress Crush Puzzle
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Match-3 candy game for quick stress deflection
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transparency Accordions */}
          <div className="space-y-3">
            {/* Membership Degrees Accordion */}
            <div className="liquid-glass rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowHowCalculated(!showHowCalculated);
                }}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-white/60 transition-colors cursor-pointer"
              >
                <span>Fuzzy Membership Breakdown (Input Degrees)</span>
                {showHowCalculated ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
              </button>
              {showHowCalculated && (
                <div className="p-5 border-t border-slate-200 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-4 font-semibold">Input Variable</th>
                          <th className="py-2 pr-4 font-semibold">Low / Short / Inadequate</th>
                          <th className="py-2 pr-4 font-semibold">Normal / Moderate / Marginal</th>
                          <th className="py-2 pr-4 font-semibold">High / Prolonged / Optimal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        <tr>
                          <td className="py-2.5 pr-4 font-sans font-medium text-slate-900">
                            HRV ({hrv.toFixed(0)} ms)
                          </td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.hrv.low.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.hrv.normal.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.hrv.high.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-4 font-sans font-medium text-slate-900">
                            Screen Time ({screenTime.toFixed(1)} h)
                          </td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.screen_time.short.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.screen_time.moderate.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.screen_time.prolonged.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-4 font-sans font-medium text-slate-900">
                            Sleep ({sleep.toFixed(1)} h)
                          </td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.sleep_duration.inadequate.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.sleep_duration.marginal.toFixed(2)}</td>
                          <td className="py-2.5 pr-4">{inferenceResult.memberships.sleep_duration.optimal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Active Rules Accordion */}
            <div className="liquid-glass rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowTransparency(!showTransparency);
                }}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-white/60 transition-colors cursor-pointer"
              >
                <span>Active Fired Rules ({inferenceResult.active_rules.length} Active Rules)</span>
                {showTransparency ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
              </button>
              {showTransparency && (
                <div className="p-5 border-t border-slate-200 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-semibold">Rule ID</th>
                          <th className="py-2 pr-3 font-semibold">Condition</th>
                          <th className="py-2 pr-3 font-semibold">Consequent</th>
                          <th className="py-2 pr-3 font-semibold">Strength (α)</th>
                          <th className="py-2 font-semibold">Design Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {inferenceResult.active_rules.map((r) => (
                          <tr key={r.rule_id} className="hover:bg-emerald-50/50">
                            <td className="py-2.5 pr-3 font-mono font-bold text-emerald-800">{r.rule_id}</td>
                            <td className="py-2.5 pr-3 text-xs">{r.condition_text}</td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.consequent === 'High'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : r.consequent === 'Low'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {r.consequent}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 font-mono font-bold text-slate-800">{r.firing_strength.toFixed(4)}</td>
                            <td className="py-2.5 text-[11px] text-slate-500 max-w-xs">{r.rationale}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
