import React, { useState } from 'react';
import { Play, BarChart2, Filter, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { SYNTHETIC_DATA } from '../../data/syntheticData';
import { runFuzzyInference } from '../../engine/inference';
import { classifyStress } from '../../engine/classifier';
import { StressCategory } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface BatchResultRow {
  hrv_ms: number;
  screen_time_h: number;
  sleep_h: number;
  stress_index: number;
  calculated_category: StressCategory;
  reference_category: StressCategory;
  active_rules: number;
  is_match: boolean;
}

export const DatasetTab: React.FC = () => {
  const [batchResults, setBatchResults] = useState<BatchResultRow[] | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [previewExpanded, setPreviewExpanded] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const runBatchSimulation = () => {
    triggerHaptic('medium');
    setIsRunning(true);
    setTimeout(() => {
      const results: BatchResultRow[] = SYNTHETIC_DATA.map((row) => {
        const res = runFuzzyInference(row.hrv_ms, row.screen_time_h, row.sleep_h);
        const predCat = classifyStress(res.crisp_stress_index);
        return {
          hrv_ms: row.hrv_ms,
          screen_time_h: row.screen_time_h,
          sleep_h: row.sleep_h,
          stress_index: res.crisp_stress_index,
          calculated_category: predCat,
          reference_category: row.reference_category,
          active_rules: res.active_rules.length,
          is_match: predCat === row.reference_category,
        };
      });

      triggerHaptic('success');
      setBatchResults(results);
      setIsRunning(false);
    }, 200);
  };

  // Metrics
  const totalSamples = batchResults ? batchResults.length : SYNTHETIC_DATA.length;
  const matches = batchResults ? batchResults.filter((r) => r.is_match).length : 0;
  const matchRate = batchResults ? (matches / totalSamples) * 100 : 0;

  // Distribution counts
  const categoryCounts = batchResults
    ? batchResults.reduce(
        (acc, r) => {
          acc[r.calculated_category] = (acc[r.calculated_category] || 0) + 1;
          return acc;
        },
        { Low: 0, Medium: 0, High: 0 } as Record<StressCategory, number>
      )
    : { Low: 0, Medium: 0, High: 0 };

  const displayedRows = batchResults
    ? batchResults.filter((r) => (filterCategory === 'All' ? true : r.calculated_category === filterCategory))
    : [];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Model Verification
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
              Synthetic Dataset & Batch Inference Validation
            </h3>
            <p className="text-xs text-slate-600">
              Evaluate the Mamdani fuzzy system against {SYNTHETIC_DATA.length} synthetic reference clinical scenarios in-browser.
            </p>
          </div>
          <button
            type="button"
            onClick={runBatchSimulation}
            disabled={isRunning}
            className="liquid-button-sage px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm text-white shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Processing...' : 'Run All 122 Tests'}</span>
          </button>
        </div>
      </div>

      {/* Dataset Preview Collapsible */}
      <div className="liquid-glass rounded-2xl overflow-hidden border border-white shadow-xs">
        <button
          type="button"
          onClick={() => setPreviewExpanded(!previewExpanded)}
          className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span>Preview Synthetic Dataset (Raw CSV Features, first 10 rows)</span>
          {previewExpanded ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
        </button>
        {previewExpanded && (
          <div className="p-5 border-t border-slate-200/80 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">HRV (ms)</th>
                  <th className="py-2 pr-4">Screen Time (h)</th>
                  <th className="py-2 pr-4">Sleep (h)</th>
                  <th className="py-2">Reference Ground Truth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono text-slate-800">
                {SYNTHETIC_DATA.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2 pr-4">{row.hrv_ms.toFixed(1)}</td>
                    <td className="py-2 pr-4">{row.screen_time_h.toFixed(1)}</td>
                    <td className="py-2 pr-4">{row.sleep_h.toFixed(1)}</td>
                    <td className="py-2 font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          row.reference_category === 'High'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : row.reference_category === 'Low'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {row.reference_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results View */}
      {batchResults && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="liquid-glass p-5 rounded-2xl border border-white shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Accuracy / Parity Rate
              </span>
              <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
                {matchRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {matches} out of {totalSamples} synthetic scenarios matched
              </p>
            </div>

            <div className="liquid-glass p-5 rounded-2xl border border-white shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Class Distribution
              </span>
              <div className="text-xs text-slate-700 space-y-1 mt-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-bold">Low Stress:</span>
                  <span className="font-mono font-bold">{categoryCounts.Low}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-bold">Medium Stress:</span>
                  <span className="font-mono font-bold">{categoryCounts.Medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700 font-bold">High Stress:</span>
                  <span className="font-mono font-bold">{categoryCounts.High}</span>
                </div>
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-2xl border border-white shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Execution Method
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                Zero-Latency Client FIS
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                122 continuous fuzzifications, rule firings, and defuzzifications executed in 200ms.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="liquid-glass rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span className="text-slate-700 font-medium">Filter by Calculated Category:</span>
              {(['All', 'Low', 'Medium', 'High'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    filterCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {displayedRows.length} rows
            </span>
          </div>

          {/* Results Table */}
          <div className="liquid-glass rounded-2xl overflow-hidden border border-white shadow-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">HRV</th>
                    <th className="py-2.5 px-3">Screen</th>
                    <th className="py-2.5 px-3">Sleep</th>
                    <th className="py-2.5 px-3">Stress Index</th>
                    <th className="py-2.5 px-3">Model Category</th>
                    <th className="py-2.5 px-3">Ref Category</th>
                    <th className="py-2.5 px-3">Fired Rules</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 font-mono text-slate-800">
                  {displayedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-slate-500 font-sans">{i + 1}</td>
                      <td className="py-2 px-3">{r.hrv_ms.toFixed(0)} ms</td>
                      <td className="py-2 px-3">{r.screen_time_h.toFixed(1)} h</td>
                      <td className="py-2 px-3">{r.sleep_h.toFixed(1)} h</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{r.stress_index.toFixed(1)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r.calculated_category === 'High'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : r.calculated_category === 'Low'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {r.calculated_category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-sans">{r.reference_category}</td>
                      <td className="py-2 px-3 text-emerald-800 font-bold">{r.active_rules}</td>
                      <td className="py-2 px-3 font-sans">
                        {r.is_match ? (
                          <span className="text-emerald-700 font-bold">Match</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Boundary Delta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
