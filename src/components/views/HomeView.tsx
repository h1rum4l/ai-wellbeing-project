import React, { useState } from 'react';
import {
  Wind,
  MessageSquare,
  Leaf,
} from 'lucide-react';
import { StressinaPanda } from '../mascot/StressinaPanda';
import { InteractiveStressinaCompanion } from '../mascot/InteractiveStressinaCompanion';
import { InferenceResult, StressCategory, CopingRecommendation, ExplanationPayload } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface HomeViewProps {
  lastAssessment: {
    inference: InferenceResult;
    category: StressCategory;
    recommendation: CopingRecommendation;
    explanation: ExplanationPayload;
  } | null;
  onNavigate: (viewId: string) => void;
  onQuickScan: () => void;
  onSelectPreset: (hrv: number, screen: number, sleep: number, name: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lastAssessment,
  onNavigate,
  onQuickScan,
  onSelectPreset,
}) => {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [chatPreviewIndex, setChatPreviewIndex] = useState(0);

  // Exercises carousel data
  const exercises = [
    {
      title: 'Mindful Exercises',
      subtitle: 'Translucent overlay active & interactive calming themes',
      duration: '3-5 min',
      actionTarget: 'breathing',
    },
    {
      title: 'Stress Crush Match',
      subtitle: 'Gentle cognitive deflection game to dissolve acute worry',
      duration: '2-4 min',
      actionTarget: 'candy_crush',
    },
  ];

  const currentExercise = exercises[exerciseIndex];

  // Calculated stress score: 0 to 100
  const stressScore = lastAssessment
    ? Math.round(lastAssessment.inference.crisp_stress_index)
    : 38;

  const getStressCategory = (score: number) => {
    if (score < 35) return { label: 'Low Tension', color: '#10B981', fillPct: score };
    if (score < 65) return { label: 'Moderate Load', color: '#059669', fillPct: score };
    return { label: 'High Alert', color: '#E11D48', fillPct: score };
  };

  const stressInfo = getStressCategory(stressScore);

  // Calculate arc node angle (-135 deg to -45 deg across upper semi-circle arc)
  const angleDeg = -135 + (stressScore / 100) * 90;
  const radius = 55;
  const nodeX = 80 + radius * Math.cos((angleDeg * Math.PI) / 180);
  const nodeY = 75 + radius * Math.sin((angleDeg * Math.PI) / 180);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in py-3 select-none">
      
      {/* 
        3-Column Layout Matching User Blueprint:
        - Left: "My Stress Level / Daily check-in" with Arch & Pillar Gauge + Panda Head Icon
        - Center: "Stressina.Ai" Hero Modal with Zen Panda on Lotus + 2 Pill Buttons
        - Right: Stacked Frosted Glass Cards (Mindful Exercises & Supportive Chat)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: My Stress Level / Daily check-in                    */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 flex flex-col items-center justify-between liquid-glass p-6 text-center relative overflow-hidden group">
          {/* Subtle Ambient Rim Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Title Header */}
          <div className="relative z-10 w-full mb-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight drop-shadow-xs">
              My Stress Level
            </h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              Daily check-in
            </p>
          </div>

          {/* Arched & Vertical Pillar Gauge (Composite Design from Mockup) */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            
            {/* 1. Curved Semi-Circle Arch Gauge */}
            <div className="relative w-44 h-24 flex items-center justify-center">
              <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="archGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A9DFBF" />
                    <stop offset="50%" stopColor="#52BE80" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                  </filter>
                </defs>

                {/* Background Track Arc */}
                <path
                  d="M 25 85 A 55 55 0 0 1 135 85"
                  fill="none"
                  stroke="rgba(82, 190, 128, 0.2)"
                  strokeWidth="11"
                  strokeLinecap="round"
                />

                {/* Active Level Arc */}
                <path
                  d="M 25 85 A 55 55 0 0 1 135 85"
                  fill="none"
                  stroke="url(#archGrad)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray="172"
                  strokeDashoffset={172 - (stressScore / 100) * 172}
                  className="transition-all duration-1000 ease-out"
                />

                {/* Glowing Indicator Node on Arc */}
                <circle
                  cx={nodeX}
                  cy={nodeY}
                  r="7"
                  fill="#52BE80"
                  filter="url(#nodeGlow)"
                  className="transition-all duration-1000 ease-out"
                />
                <circle
                  cx={nodeX}
                  cy={nodeY}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>

            {/* 2. Vertical Translucent Thermometer Tube / Column */}
            <div className="relative -mt-6 w-11 h-40 rounded-full bg-white/70 border border-white/90 p-1 flex flex-col justify-end overflow-hidden shadow-inner backdrop-blur-md">
              {/* Animated Liquid Level Fill */}
              <div
                className="w-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  height: `${Math.max(stressScore, 15)}%`,
                  background: 'linear-gradient(180deg, rgba(209, 234, 39, 0.95) 0%, rgba(169, 223, 191, 0.95) 40%, rgba(82, 190, 128, 0.95) 100%)',
                  boxShadow: '0 0 12px rgba(82, 190, 128, 0.4)',
                }}
              />

              {/* Inner highlight glass reflection line */}
              <div className="absolute top-2 left-2 bottom-2 w-0.5 bg-white/60 rounded-full pointer-events-none" />
            </div>

            {/* Drifting Leaf Motifs around the gauge */}
            <div className="absolute -left-3 top-1/2 opacity-75 animate-gentle-float">
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div
              className="absolute -right-3 top-1/3 opacity-70 animate-gentle-float"
              style={{ animationDelay: '-2s' }}
            >
              <Leaf className="w-3.5 h-3.5 text-lime-600" />
            </div>

            {/* 3. Stressina Panda Mascot Face at Bottom of Gauge */}
            <div className="relative -mt-4 w-16 h-16 rounded-full bg-white/90 backdrop-blur-md border border-white flex items-center justify-center shadow-lg overflow-hidden transition-transform group-hover:scale-105">
              <StressinaPanda
                pose="hero_zen"
                expression="calm"
                size="xs"
                showLotusPlatform={false}
                showAura={false}
              />
            </div>

            {/* Metric Score Indicator */}
            <div className="mt-2 text-center">
              <span className="text-sm font-bold text-slate-800 tracking-wide">
                {stressInfo.label}
              </span>
              <span className="text-[11px] text-slate-500 block font-mono font-medium">
                {stressScore} / 100 index
              </span>
            </div>
          </div>

          {/* Interactive Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('checkin');
            }}
            className="w-full mt-4 py-2.5 px-4 rounded-full liquid-button-clear text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="text-slate-800">Scan Biometrics</span>
            <span className="text-emerald-700 font-bold">→</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* CENTRAL HERO SECTION: STRESSINA.AI                            */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 flex flex-col justify-between liquid-glass-hero p-6 sm:p-9 text-center relative overflow-hidden shadow-2xl">
          
          {/* Subtle Backlight Radial Halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-r from-emerald-300/25 via-teal-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top Tag & Main Headline */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-600 bg-clip-text text-transparent drop-shadow-xs">
                Stressina.Ai
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-lg mx-auto">
              Your Space to Breathe<br />and Coping Stress
            </h1>
          </div>

          {/* Interactive Stressina Panda Companion with Voice & Anti-Gravity Arena */}
          <div className="relative z-10 my-3">
            <InteractiveStressinaCompanion
              lastAssessment={lastAssessment}
              onNavigateToTab={onNavigate}
            />
          </div>

          {/* Two Prominent Action Buttons from Reference Mockup */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {/* 1. "Get Started" Pill Button (Soft sage-green gradient) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onNavigate('checkin');
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-full liquid-button-sage text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Get Started</span>
            </button>

            {/* 2. "Quick Scan →" Pill Button (Clear liquid frosted glass) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onQuickScan();
              }}
              className="w-full sm:w-auto px-7 py-3 rounded-full liquid-button-clear text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span className="text-slate-800">Quick Scan</span>
              <span className="text-emerald-700 font-bold">→</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Stacked Frosted Glass Panels                      */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 flex flex-col gap-6 justify-between">
          
          {/* Top Panel: Mindful Exercises */}
          <div
            onClick={() => {
              triggerHaptic('selection');
              onNavigate(currentExercise.actionTarget);
            }}
            className="liquid-glass p-6 flex flex-col items-center justify-between flex-1 text-center cursor-pointer liquid-glass-interactive group"
          >
            {/* Top Emblem: Meditating Lotus Figure in Soft Green Disc */}
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
              <Wind className="w-6 h-6 text-emerald-700" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 my-auto">
              <h4 className="text-base font-bold text-slate-800 tracking-tight">
                {currentExercise.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {currentExercise.subtitle}
              </p>
            </div>

            {/* Pagination Navigation Dots */}
            <div className="flex items-center gap-1.5 pt-3">
              {exercises.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    setExerciseIndex(idx);
                  }}
                  className={`rounded-full transition-all ${
                    exerciseIndex === idx
                      ? 'w-2.5 h-2.5 bg-emerald-700 shadow-xs'
                      : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Switch exercise ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Panel: Supportive Chat */}
          <div
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('chat');
            }}
            className="liquid-glass p-6 flex flex-col items-center justify-between flex-1 text-center cursor-pointer liquid-glass-interactive group"
          >
            {/* Top Emblem: Speech Bubbles in Soft White Disc */}
            <div className="w-14 h-14 rounded-full bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 text-teal-800" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 my-auto">
              <h4 className="text-base font-bold text-slate-800 tracking-tight">
                Supportive Chat
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Talk through emotions with Stressina in a safe, confidential sanctuary.
              </p>
            </div>

            {/* Pagination Navigation Dots */}
            <div className="flex items-center gap-1.5 pt-3">
              {[0, 1].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    setChatPreviewIndex(idx);
                  }}
                  className={`rounded-full transition-all ${
                    chatPreviewIndex === idx
                      ? 'w-2.5 h-2.5 bg-teal-700 shadow-xs'
                      : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Switch chat mode ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Preset Benchmarks Strip (Quick 1-Click Testing) */}
      <div className="liquid-glass p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 tracking-wide">
            Biometric Testing Scenarios
          </h4>
          <p className="text-[11px] text-slate-500">
            Click any profile to immediately preview fuzzy stress inference:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSelectPreset(32, 10.5, 4.5, 'Workplace Rush')}
            className="px-3.5 py-2 rounded-xl liquid-button-clear text-left text-xs cursor-pointer shadow-xs"
          >
            <span className="font-bold text-amber-800 block">Workplace Rush</span>
            <span className="text-[10px] text-slate-500">HRV 32ms · 10.5h screen</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset(55, 7.0, 6.5, 'Balanced Routine')}
            className="px-3.5 py-2 rounded-xl liquid-button-clear text-left text-xs cursor-pointer shadow-xs"
          >
            <span className="font-bold text-emerald-800 block">Balanced Routine</span>
            <span className="text-[10px] text-slate-500">HRV 55ms · 7.0h screen</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset(85, 3.5, 8.5, 'Zen Sanctuary')}
            className="px-3.5 py-2 rounded-xl liquid-button-clear text-left text-xs cursor-pointer shadow-xs"
          >
            <span className="font-bold text-teal-800 block">Zen Sanctuary</span>
            <span className="text-[10px] text-slate-500">HRV 85ms · 3.5h screen</span>
          </button>
        </div>
      </div>

    </div>
  );
};
