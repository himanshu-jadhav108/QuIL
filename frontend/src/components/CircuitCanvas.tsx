import React from 'react';
import { ConceptName } from '../types/quantum';
import { Cpu, Info } from 'lucide-react';

interface Props {
  concept: ConceptName;
  circuitDiagram?: string;
}

const CIRCUIT_SPECS: Record<
  ConceptName,
  {
    qubits: number;
    gates: string[];
    summary: string;
    transformation: string;
  }
> = {
  superposition: {
    qubits: 1,
    gates: ['H (Hadamard)', 'M (Measurement)'],
    summary: 'Single-qubit superposition circuit: Maps computational basis ground state |0⟩ to equatorial state |+⟩.',
    transformation: '|0⟩ ──[ H ]──> (|0⟩ + |1⟩) / √2 ──[ M ]──> { 0 (50%), 1 (50%) }',
  },
  measurement: {
    qubits: 1,
    gates: ['H (Hadamard)', 'M (Measurement)'],
    summary: 'Active projective measurement: Projects state onto computational basis and collapses amplitudes irreversibly.',
    transformation: '|+⟩ ──[ M ]──> State collapse to definite outcome |0⟩ or |1⟩ with equal likelihood',
  },
  entanglement: {
    qubits: 2,
    gates: ['H on q₀', 'CX (CNOT) q₀→q₁', 'M on q₀', 'M on q₁'],
    summary: 'Canonical Bell state generator (|Φ⁺⟩): Entangles two independent qubits into a non-separable composite system.',
    transformation: '|00⟩ ──[ H ⊗ I ]──> (|00⟩ + |10⟩)/√2 ──[ CX ]──> (|00⟩ + |11⟩)/√2',
  },
};

export const CircuitCanvas: React.FC<Props> = ({ concept, circuitDiagram }) => {
  const spec = CIRCUIT_SPECS[concept] || CIRCUIT_SPECS.superposition;

  return (
    <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <Cpu className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Quantum Circuit Architecture
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Canonical {spec.qubits}-Qubit Wire · Qiskit Aer Compilation Target
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700'>
            {spec.gates.length} Unitary Ops
          </span>
        </div>
      </div>

      {/* Scientific Wire Diagram */}
      <div className='p-6 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto'>
        <div className='min-w-[420px] flex flex-col gap-8 relative py-2'>
          {/* Wire 0 */}
          <div className='flex items-center relative'>
            <div className='w-12 text-xs font-mono font-bold text-slate-400 shrink-0'>q₀ |0⟩</div>
            <div className='flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between px-8'>
              {/* Gate 1: H */}
              <div className='relative z-10'>
                <div
                  className='w-10 h-10 rounded bg-slate-900 border border-cyan-500 text-cyan-300 font-mono font-bold text-sm flex items-center justify-center shadow-sm cursor-help'
                  title='Hadamard Gate (Unitary transformation)'
                >
                  H
                </div>
                <span className='absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 whitespace-nowrap'>
                  Hadamard
                </span>
              </div>

              {/* CNOT Control (if entanglement) */}
              {concept === 'entanglement' && (
                <div className='relative z-10'>
                  <div
                    className='w-4 h-4 rounded-full bg-violet-400 border border-violet-300 shadow-sm'
                    title='Control Qubit'
                  />
                  <div className='absolute top-2 left-1.5 w-0.5 h-16 bg-violet-500 pointer-events-none' />
                </div>
              )}

              {/* Measurement */}
              <div className='relative z-10'>
                <div
                  className='w-10 h-10 rounded bg-slate-900 border border-emerald-500 text-emerald-300 font-mono font-bold text-sm flex items-center justify-center shadow-sm cursor-help'
                  title='Measurement Gate (Computational Basis Projection)'
                >
                  M
                </div>
                <span className='absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 whitespace-nowrap'>
                  Measure
                </span>
              </div>
            </div>
          </div>

          {/* Wire 1 (if entanglement) */}
          {concept === 'entanglement' && (
            <div className='flex items-center relative pt-4'>
              <div className='w-12 text-xs font-mono font-bold text-slate-400 shrink-0'>q₁ |0⟩</div>
              <div className='flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between px-8'>
                <div className='w-10' />
                {/* CNOT Target */}
                <div className='relative z-10'>
                  <div
                    className='w-8 h-8 rounded-full bg-slate-900 border border-violet-400 text-violet-300 font-mono font-bold text-sm flex items-center justify-center shadow-sm cursor-help'
                    title='Target Qubit (Bit-flip X applied conditionally)'
                  >
                    ⊕
                  </div>
                  <span className='absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 whitespace-nowrap'>
                    Target
                  </span>
                </div>
                {/* Measurement 1 */}
                <div className='relative z-10'>
                  <div
                    className='w-10 h-10 rounded bg-slate-900 border border-emerald-500 text-emerald-300 font-mono font-bold text-sm flex items-center justify-center shadow-sm cursor-help'
                    title='Measurement Gate (q₁)'
                  >
                    M
                  </div>
                  <span className='absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 whitespace-nowrap'>
                    Measure
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytical Transformation Formula */}
      <div className='p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5'>
        <div className='text-slate-400 text-[10px] uppercase tracking-wider font-semibold'>
          Mathematical State Evolution:
        </div>
        <div className='text-cyan-300/90'>{spec.transformation}</div>
      </div>

      {/* Technical Summary Callout */}
      <div className='flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300 leading-relaxed'>
        <Info className='w-4 h-4 text-slate-400 shrink-0 mt-0.5' />
        <span>{spec.summary}</span>
      </div>

      {/* Raw ASCII diagram from Qiskit backend if available */}
      {circuitDiagram && (
        <div className='p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto'>
          <div className='text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider'>
            Qiskit Circuit ASCII Output:
          </div>
          <pre className='text-[11px] font-mono text-slate-400 leading-snug'>{circuitDiagram}</pre>
        </div>
      )}
    </div>
  );
};
