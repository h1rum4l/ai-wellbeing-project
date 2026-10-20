import React, { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle, Info } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface StageDetail {
  number: number;
  name: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
}

const STAGES: StageDetail[] = [
  {
    number: 1,
    name: '1. User Input',
    subtitle: 'HRV, Screen, Sleep + Context Flags',
    bullets: [
      'Non-invasive data collection: Heart Rate Variability (ms), daily screen hours, and prior sleep hours.',
      'Optional contextual modifiers: Available coping duration (5m, 10m, 20m+) and environment (Home, University, Work, Other).',
    ],
  },
  {
    number: 2,
    name: '2. Preprocessing',
    subtitle: 'Validation & Clamping Bounds Verification',
    bullets: [
      'Strict type checking, range validation, and out-of-bounds safety clamping.',
      'Guarantees numerical stability: HRV ∈ [20, 120] ms, Screen ∈ [0, 16] h, Sleep ∈ [2, 10] h.',
    ],
  },
  {
    number: 3,
    name: '3. AI Engine Layer',
    subtitle: '3.1 Fuzzification (μ) • 3.2 Mamdani Inference (Min) • 3.3 Centroid Defuzz (0–100)',
    bullets: [
      '3.1 Fuzzification: Computes continuous membership degrees μ ∈ [0, 1] across trapezoidal & triangular functions.',
      '3.2 Mamdani Rule Evaluation: Evaluates 31 rules (27 core Cartesian + 4 supplementary) using fuzzy AND (min operator).',
      '3.3 Centroid Defuzzification: Integrates aggregated consequent surface to calculate center of gravity crisp score (0–100).',
    ],
    highlight: true,
  },
  {
    number: 4,
    name: '4. Recommendation',
    subtitle: 'Rule-Based Coping Decoupled Engine',
    bullets: [
      'Completely decoupled component: Receives crisp category (Low, Medium, High) from Stage 3.',
      'Strict architectural boundary: Context flags only select between actions within category; never alter category.',
    ],
  },
  {
    number: 5,
    name: '5. Coping Output',
    subtitle: 'Selected Coping Action Targeted Interventions',
    bullets: [
      'Selects from evidence-informed library: Breathing exercises, sleep hygiene, cardio breaks, digital detox, PMR.',
      'Provides duration, clear step-by-step instructions, and physiological rationale.',
    ],
  },
  {
    number: 6,
    name: '6. Explanation',
    subtitle: 'Natural Language Transparency Engine',
    bullets: [
      'Translates fuzzy mathematics into plain-English explanations.',
      'Identifies dominant stress drivers, prints active firing rules, and provides clinical rationale.',
    ],
  },
  {
    number: 7,
    name: '7. Feedback Loop',
    subtitle: 'Longitudinal Wellness Tracking',
    bullets: [
      'Saves session assessment and intervention reflections to user storage.',
      'Tracks stress curve over time and measures relaxation intervention efficacy.',
    ],
  },
  {
    number: 8,
    name: '8. Model Adaptation',
    subtitle: 'Calibrated Membership Breakpoints',
    bullets: [
      'Enables individual personalization and population-level model tuning.',
      'Allows dynamic calibration of fuzzy membership boundaries for clinical research.',
    ],
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(3);
  const current = STAGES.find((s) => s.number === selectedStage) || STAGES[2];

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Container */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 overflow-x-auto border border-white shadow-sm text-slate-800">
        <div className="mb-6">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
            System Architecture
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5 tracking-tight">
            Eight-Stage System Pipeline Architecture
          </h3>
          <p className="text-xs text-slate-600">
            Mamdani Fuzzy Inference System & Decoupled Deterministic Recommendation Engine
          </p>
        </div>

        {/* Pipeline Grid */}
        <div className="min-w-[720px] max-w-4xl mx-auto space-y-6">
          {/* Row 1: Stages 1 to 4 */}
          <div className="grid grid-cols-4 gap-3 items-center">
            {STAGES.slice(0, 4).map((stage) => (
              <React.Fragment key={stage.number}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedStage(stage.number);
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedStage === stage.number
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                      : stage.highlight
                      ? 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100 text-slate-800'
                      : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        selectedStage === stage.number ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {stage.name}
                    </span>
                    {selectedStage === stage.number && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] leading-tight line-clamp-2 ${
                      selectedStage === stage.number ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {stage.subtitle}
                  </p>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Connectors between rows */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] text-emerald-900 font-bold shadow-xs">
                <ArrowUp className="w-3 h-3 text-emerald-700 animate-pulse" />
                <span>Feedback Flow</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-center text-xs text-slate-500 font-medium">
              Decoupled Pipeline Hand-off
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[10px] text-slate-700 font-bold">
                <span>Category Output</span>
                <ArrowDown className="w-3 h-3 text-emerald-700" />
              </div>
            </div>
          </div>

          {/* Row 2: Stages 8 to 5 (rendered right to left in logical flow) */}
          <div className="grid grid-cols-4 gap-3 items-center">
            {[STAGES[7], STAGES[6], STAGES[5], STAGES[4]].map((stage) => (
              <button
                key={stage.number}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedStage(stage.number);
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedStage === stage.number
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                    : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${
                      selectedStage === stage.number ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {stage.name}
                  </span>
                  {selectedStage === stage.number && (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <p
                  className={`text-[11px] leading-tight line-clamp-2 ${
                    selectedStage === stage.number ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {stage.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Click any stage above to inspect its decoupled logic and academic specifications.
          </p>
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="liquid-glass rounded-2xl p-6 border border-white shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-xs">
            {current.number}
          </span>
          <h4 className="text-sm font-bold text-slate-900 tracking-wide">{current.name}</h4>
          <span className="text-xs text-emerald-700 font-semibold">({current.subtitle})</span>
        </div>

        <ul className="space-y-2 mt-4 text-xs text-slate-700">
          {current.bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
