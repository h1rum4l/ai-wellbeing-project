import React from 'react';
import { HRV_MF, SCREEN_TIME_MF, SLEEP_MF, STRESS_MF, STRESS_THRESHOLDS } from '../../engine/fuzzyConfig';
import { trapmf, trimf } from '../../engine/membership';

interface ChartProps {
  title: string;
  xLabel: string;
  xMin: number;
  xMax: number;
  currentVal?: number;
  curves: Array<{
    name: string;
    label: string;
    color: string;
    dash?: string;
    fn: (x: number) => number;
  }>;
  unit: string;
  categoryZones?: boolean;
  aggregatedSet?: number[];
  stressUniverse?: number[];
  centroid?: number;
}

export const FuzzyCurveChart: React.FC<ChartProps> = ({
  title,
  xLabel,
  xMin,
  xMax,
  currentVal,
  curves,
  unit,
  categoryZones = false,
  aggregatedSet,
  centroid,
}) => {
  // Chart dimensions
  const width = 640;
  const height = 280;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 35;
  const padBottom = 45;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const scaleX = (x: number) => padLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const scaleY = (y: number) => padTop + (1.0 - y) * plotHeight;

  // Generate path data for each curve (sampled at 120 points)
  const steps = 120;
  const curvePaths = curves.map((c) => {
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = Math.min(Math.max(c.fn(x), 0), 1);
      points.push([scaleX(x), scaleY(y)]);
    }
    const d = points.reduce(
      (acc, pt, idx) => (idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`),
      ''
    );
    return { ...c, pathData: d };
  });

  // Aggregated fuzzy set shaded area
  let aggregatedPath = '';
  let aggregatedFillPath = '';
  if (aggregatedSet && aggregatedSet.length > 0) {
    const aggPoints: [number, number][] = [];
    for (let i = 0; i < aggregatedSet.length; i++) {
      const x = xMin + (i / (aggregatedSet.length - 1)) * (xMax - xMin);
      const y = Math.min(Math.max(aggregatedSet[i], 0), 1);
      aggPoints.push([scaleX(x), scaleY(y)]);
    }
    aggregatedPath = aggPoints.reduce(
      (acc, pt, idx) => (idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`),
      ''
    );
    // Closed shape for fill down to baseline
    aggregatedFillPath = `${aggregatedPath} L ${scaleX(xMax)} ${scaleY(0)} L ${scaleX(xMin)} ${scaleY(0)} Z`;
  }

  // Y-axis ticks [0.0, 0.25, 0.5, 0.75, 1.0]
  const yTicks = [0.0, 0.25, 0.5, 0.75, 1.0];

  // X-axis ticks (5 ticks evenly spaced)
  const xTicksCount = 5;
  const xTicks = Array.from({ length: xTicksCount }, (_, i) => {
    return xMin + (i / (xTicksCount - 1)) * (xMax - xMin);
  });

  return (
    <div className="liquid-glass rounded-2xl p-5 space-y-3 border border-white shadow-xs text-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{title}</span>
        </h4>
        {currentVal !== undefined && (
          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
            Active: {currentVal.toFixed(1)} {unit}
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[320px] select-none">
          {/* Category zones background (for Stress Index) */}
          {categoryZones && (
            <g>
              {/* Low zone: [0, 40) */}
              <rect
                x={scaleX(0)}
                y={padTop}
                width={scaleX(STRESS_THRESHOLDS.medium_min) - scaleX(0)}
                height={plotHeight}
                fill="#06B6D4"
                fillOpacity="0.08"
              />
              {/* Medium zone: [40, 70) */}
              <rect
                x={scaleX(STRESS_THRESHOLDS.medium_min)}
                y={padTop}
                width={scaleX(STRESS_THRESHOLDS.high_min) - scaleX(STRESS_THRESHOLDS.medium_min)}
                height={plotHeight}
                fill="#0EA5E9"
                fillOpacity="0.04"
              />
              {/* High zone: [70, 100] */}
              <rect
                x={scaleX(STRESS_THRESHOLDS.high_min)}
                y={padTop}
                width={scaleX(100) - scaleX(STRESS_THRESHOLDS.high_min)}
                height={plotHeight}
                fill="#F43F5E"
                fillOpacity="0.08"
              />

              {/* Zone labels */}
              <text x={scaleX(20)} y={padTop + 14} fill="#22D3EE" fontSize="10" textAnchor="middle" opacity="0.9">
                Low [0–40)
              </text>
              <text x={scaleX(55)} y={padTop + 14} fill="#E2E8F0" fontSize="10" textAnchor="middle" opacity="0.8">
                Medium [40–70)
              </text>
              <text x={scaleX(85)} y={padTop + 14} fill="#FB7185" fontSize="10" textAnchor="middle" opacity="0.9">
                High [70–100]
              </text>
            </g>
          )}

          {/* Grid lines */}
          {yTicks.map((y) => (
            <g key={`y-${y}`}>
              <line
                x1={padLeft}
                y1={scaleY(y)}
                x2={width - padRight}
                y2={scaleY(y)}
                stroke="rgba(34, 211, 238, 0.1)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={scaleY(y) + 3}
                fill="#64748B"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {y.toFixed(2)}
              </text>
            </g>
          ))}

          {xTicks.map((x) => (
            <g key={`x-${x}`}>
              <line
                x1={scaleX(x)}
                y1={padTop}
                x2={scaleX(x)}
                y2={height - padBottom}
                stroke="rgba(34, 211, 238, 0.1)"
                strokeWidth="1"
              />
              <text
                x={scaleX(x)}
                y={height - padBottom + 16}
                fill="#64748B"
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {x.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="1.2"
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={height - padBottom}
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="1.2"
          />

          {/* Axis Labels */}
          <text
            x={padLeft + plotWidth / 2}
            y={height - 8}
            fill="#94A3B8"
            fontSize="10"
            textAnchor="middle"
          >
            {xLabel}
          </text>
          <text
            x={14}
            y={padTop + plotHeight / 2}
            fill="#94A3B8"
            fontSize="10"
            textAnchor="middle"
            transform={`rotate(-90 14 ${padTop + plotHeight / 2})`}
          >
            Membership Degree (μ)
          </text>

          {/* Shaded Aggregated Consequent Set (if present) */}
          {aggregatedFillPath && (
            <g>
              <path d={aggregatedFillPath} fill="rgba(6, 182, 212, 0.35)" />
              <path d={aggregatedPath} fill="none" stroke="#22D3EE" strokeWidth="2.5" />
            </g>
          )}

          {/* Curves */}
          {curvePaths.map((c) => (
            <path
              key={c.name}
              d={c.pathData}
              fill="none"
              stroke={c.color}
              strokeWidth={categoryZones ? '1.8' : '2.2'}
              strokeDasharray={c.dash}
            />
          ))}

          {/* Current input vertical marker */}
          {currentVal !== undefined && (
            <g>
              <line
                x1={scaleX(currentVal)}
                y1={padTop}
                x2={scaleX(currentVal)}
                y2={height - padBottom}
                stroke="#22D3EE"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx={scaleX(currentVal)}
                cy={height - padBottom}
                r="5"
                fill="#050B14"
                stroke="#22D3EE"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Centroid Defuzzified Marker */}
          {centroid !== undefined && (
            <g>
              <line
                x1={scaleX(centroid)}
                y1={padTop}
                x2={scaleX(centroid)}
                y2={height - padBottom}
                stroke="#F8FAFC"
                strokeWidth="2.5"
              />
              <circle
                cx={scaleX(centroid)}
                cy={scaleY(0)}
                r="6"
                fill="#22D3EE"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={scaleX(centroid)}
                y={padTop - 8}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                Centroid: {centroid.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-200/80 text-xs">
        {curves.map((c) => (
          <div key={c.name} className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-1 rounded"
              style={{
                backgroundColor: c.color,
                borderTop: c.dash ? '1px dashed' : undefined,
              }}
            />
            <span className="text-slate-600 font-medium">{c.label}</span>
          </div>
        ))}
        {currentVal !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-emerald-500" />
            <span className="text-emerald-800 font-bold">Your Value ({currentVal.toFixed(0)})</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 1. HRV Chart
export const HRVChart: React.FC<{ currentVal?: number }> = ({ currentVal }) => (
  <FuzzyCurveChart
    title="HRV Input Membership Functions"
    xLabel="Heart Rate Variability — HRV (ms)"
    xMin={20.0}
    xMax={120.0}
    unit="ms"
    currentVal={currentVal}
    curves={[
      {
        name: 'low',
        label: 'Low [20, 20, 35, 55]',
        color: '#FB7185',
        dash: '5 3',
        fn: (x) => trapmf(x, HRV_MF.low as [number, number, number, number]),
      },
      {
        name: 'normal',
        label: 'Normal [40, 60, 80]',
        color: '#22D3EE',
        fn: (x) => trimf(x, HRV_MF.normal as [number, number, number]),
      },
      {
        name: 'high',
        label: 'High [65, 85, 120, 120]',
        color: '#34D399',
        fn: (x) => trapmf(x, HRV_MF.high as [number, number, number, number]),
      },
    ]}
  />
);

// 2. Screen Time Chart
export const ScreenTimeChart: React.FC<{ currentVal?: number }> = ({ currentVal }) => (
  <FuzzyCurveChart
    title="Screen Time Input Membership Functions"
    xLabel="Daily Screen Time (hours)"
    xMin={0.0}
    xMax={16.0}
    unit="h"
    currentVal={currentVal}
    curves={[
      {
        name: 'short',
        label: 'Short [0, 0, 2, 4]',
        color: '#34D399',
        fn: (x) => trapmf(x, SCREEN_TIME_MF.short as [number, number, number, number]),
      },
      {
        name: 'moderate',
        label: 'Moderate [3, 6, 9]',
        color: '#22D3EE',
        fn: (x) => trimf(x, SCREEN_TIME_MF.moderate as [number, number, number]),
      },
      {
        name: 'prolonged',
        label: 'Prolonged [7, 10, 16, 16]',
        color: '#FB7185',
        dash: '5 3',
        fn: (x) => trapmf(x, SCREEN_TIME_MF.prolonged as [number, number, number, number]),
      },
    ]}
  />
);

// 3. Sleep Duration Chart
export const SleepChart: React.FC<{ currentVal?: number }> = ({ currentVal }) => (
  <FuzzyCurveChart
    title="Sleep Duration Input Membership Functions"
    xLabel="Nightly Sleep (hours)"
    xMin={2.0}
    xMax={10.0}
    unit="h"
    currentVal={currentVal}
    curves={[
      {
        name: 'inadequate',
        label: 'Inadequate [2, 2, 4, 6]',
        color: '#FB7185',
        dash: '5 3',
        fn: (x) => trapmf(x, SLEEP_MF.inadequate as [number, number, number, number]),
      },
      {
        name: 'marginal',
        label: 'Marginal [5, 6.5, 8]',
        color: '#FBBF24',
        fn: (x) => trimf(x, SLEEP_MF.marginal as [number, number, number]),
      },
      {
        name: 'optimal',
        label: 'Optimal [7, 8.5, 10, 10]',
        color: '#34D399',
        fn: (x) => trapmf(x, SLEEP_MF.optimal as [number, number, number, number]),
      },
    ]}
  />
);

// 4. Stress Output Universe & Defuzzification Chart
export const StressOutputChart: React.FC<{
  crispStress?: number;
  aggregatedSet?: number[];
  stressUniverse?: number[];
}> = ({ crispStress, aggregatedSet, stressUniverse }) => (
  <FuzzyCurveChart
    title="Stress Index Output Universe & Centroid Defuzzification"
    xLabel="Defuzzified Stress Index (0 – 100 score)"
    xMin={0.0}
    xMax={100.0}
    unit="pts"
    categoryZones={true}
    centroid={crispStress}
    aggregatedSet={aggregatedSet}
    stressUniverse={stressUniverse}
    curves={[
      {
        name: 'low',
        label: 'Low Stress [0, 0, 40]',
        color: '#22D3EE',
        fn: (x) => trimf(x, STRESS_MF.low as [number, number, number]),
      },
      {
        name: 'medium',
        label: 'Medium Stress [25, 50, 75]',
        color: '#38BDF8',
        fn: (x) => trimf(x, STRESS_MF.medium as [number, number, number]),
      },
      {
        name: 'high',
        label: 'High Stress [60, 100, 100]',
        color: '#FB7185',
        fn: (x) => trimf(x, STRESS_MF.high as [number, number, number]),
      },
    ]}
  />
);
