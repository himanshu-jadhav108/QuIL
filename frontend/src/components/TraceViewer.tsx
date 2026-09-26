import React from 'react';
import { TraceStep } from '../types/quantum';
import { Layers } from 'lucide-react';

interface TraceViewerProps {
  trace: TraceStep[];
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ trace }) => {
  return (
    <div className='bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6'>
      <div className='flex items-center justify-between pb-4 border-b border-slate-800'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center'>
            <Layers className='w-4 h-4 text-emerald-400' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-white'>Step-by-Step Quantum Execution Trace</h3>
            <p className='text-xs text-slate-400 font-mono'>
              Structured statevector evolution generated directly by Qiskit Aer.
            </p>
          </div>
        </div>
        <span className='text-xs px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-mono'>
          {trace.length} Execution Steps
        </span>
      </div>

      <div className='space-y-3 relative'>
        {trace.length === 0 ? (
          <p className='text-xs text-slate-500 py-6 text-center'>
            Run a simulation to generate the deterministic step-by-step state trace.
          </p>
        ) : (
          trace.map((step, idx) => (
            <div key={idx} className='flex items-start gap-4 group'>
              {/* Step indicator */}
              <div className='flex flex-col items-center'>
                <div className='w-7 h-7 rounded-full bg-slate-950 border border-cyan-500/60 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold shadow-sm shadow-cyan-950'>
                  {step.step}
                </div>
                {idx < trace.length - 1 && <div className='w-0.5 h-10 bg-slate-800 my-1' />}
              </div>

              {/* Event card */}
              <div className='flex-1 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 group-hover:border-cyan-900/80 transition-all flex items-center justify-between'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono font-semibold text-xs text-slate-200'>{step.event}</span>
                  </div>
                  {step.state_label && (
                    <div className='mt-1 text-xs font-mono text-cyan-400'>
                      State: <span className='text-cyan-300 font-bold'>{step.state_label}</span>
                    </div>
                  )}
                </div>

                <div className='text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800'>
                  Step {step.step + 1} of {trace.length}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
