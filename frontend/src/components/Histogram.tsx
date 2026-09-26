import React from 'react';
import { SimulationResult } from '../types/quantum';
import { BarChart3 } from 'lucide-react';

interface Props {
  result: SimulationResult;
  prediction?: Record<string, number>;
}

export const Histogram: React.FC<Props> = ({ result, prediction }) => {
  const outcomes = Object.keys(result.probabilities).sort();
  const maxProb = Math.max(
    ...Object.values(result.probabilities),
    ...Object.values(prediction || {}).map((v) => v / 100),
    0.01
  );

  return (
    <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300'>
            <BarChart3 className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Measurement Probability Distribution
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Qiskit Aer Simulator · {result.num_shots.toLocaleString()} shots · Execution: {result.execution_time_ms.toFixed(1)} ms
            </p>
          </div>
        </div>
      </div>

      {/* Bars Chart */}
      <div className='flex items-end gap-6 h-48 pt-6 px-2'>
        {outcomes.map((outcome) => {
          const simProb = result.probabilities[outcome] ?? 0;
          const count = result.counts[outcome] ?? 0;
          const simHeight = (simProb / maxProb) * 100;

          // Prediction probability for this outcome
          const predPct = prediction ? (prediction[outcome] ?? 0) : null;
          const predProb = predPct !== null ? predPct / 100 : null;
          const predHeight = predProb !== null ? (predProb / maxProb) * 100 : 0;
          const delta = predProb !== null ? (simProb - predProb) * 100 : null;

          return (
            <div key={outcome} className='flex-1 flex flex-col items-center gap-2'>
              {/* Bars container */}
              <div className='w-full flex items-end justify-center gap-2 h-32'>
                {/* Hypothesis (Prediction) Bar */}
                {predProb !== null && (
                  <div className='w-7 flex flex-col justify-end items-center h-full'>
                    <span className='text-[10px] font-mono text-slate-400 mb-1'>
                      {(predProb * 100).toFixed(0)}%
                    </span>
                    <div
                      className='w-full rounded-t border border-dashed border-indigo-400/80 bg-indigo-950/40 transition-all duration-300'
                      style={{ height: `${Math.max(predHeight, 4)}%` }}
                      title={`Predicted: ${(predProb * 100).toFixed(1)}%`}
                    />
                  </div>
                )}

                {/* Simulator Ground Truth Bar */}
                <div className='w-7 flex flex-col justify-end items-center h-full'>
                  <span className='text-[10px] font-mono text-cyan-300 font-bold mb-1'>
                    {(simProb * 100).toFixed(1)}%
                  </span>
                  <div
                    className='w-full rounded-t bg-cyan-500 border border-cyan-400 transition-all duration-300'
                    style={{ height: `${Math.max(simHeight, 4)}%` }}
                    title={`Simulator: ${(simProb * 100).toFixed(1)}% (${count} shots)`}
                  />
                </div>
              </div>

              {/* Basis state outcome label */}
              <div className='text-center space-y-0.5 pt-1 border-t border-slate-800 w-full'>
                <div className='text-xs font-mono font-bold text-white'>|{outcome}⟩</div>
                <div className='text-[10px] font-mono text-slate-400'>{count} shots</div>
                {delta !== null && (
                  <div
                    className={`text-[10px] font-mono font-medium ${
                      Math.abs(delta) <= 10 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    Δ {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className='flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/80'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <span className='w-3 h-3 rounded-sm bg-cyan-500 border border-cyan-400 inline-block' />
            <span className='text-slate-200'>Simulator (Qiskit Aer)</span>
          </div>
          {prediction && (
            <div className='flex items-center gap-1.5'>
              <span className='w-3 h-3 rounded-sm border border-dashed border-indigo-400 bg-indigo-950/40 inline-block' />
              <span className='text-slate-300'>Learner Hypothesis</span>
            </div>
          )}
        </div>
        <div className='text-[10px] text-slate-500'>Stochastic Tolerance: ±10%</div>
      </div>
    </div>
  );
};
