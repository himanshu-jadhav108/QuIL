import React from 'react';
import { ManimClip, ConceptName } from '../types/quantum';
import { PlayCircle, RefreshCw, BookOpen, CheckCircle2 } from 'lucide-react';

interface Props {
  clip: ManimClip | null;
  loading: boolean;
  concept: ConceptName;
  onFetch: () => void;
}

export const ManimPlayer: React.FC<Props> = ({ clip, loading, concept, onFetch }) => {
  return (
    <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <PlayCircle className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Show Me Why — Geometric Visual Remediation
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Mathematical Derivation & Concept Visualizer · Target Concept: {concept}
            </p>
          </div>
        </div>
        <button
          onClick={onFetch}
          disabled={loading}
          className='flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors disabled:opacity-50'
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Reload Visual'}</span>
        </button>
      </div>

      {loading && (
        <div className='flex items-center justify-center h-52 text-slate-400 gap-3 font-mono text-xs bg-slate-950/80 rounded-lg border border-slate-800'>
          <div className='w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
          <span>Loading visual explanation for {concept}...</span>
        </div>
      )}

      {!loading && !clip && (
        <div className='flex flex-col items-center justify-center h-52 gap-3 text-slate-400 bg-slate-950/80 rounded-lg border border-slate-800'>
          <BookOpen className='w-7 h-7 text-slate-600' />
          <p className='text-xs font-mono text-slate-400'>No visualization loaded for current context.</p>
          <button
            onClick={onFetch}
            className='px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors'
          >
            Load Visual Explanation
          </button>
        </div>
      )}

      {!loading && clip && (
        <div className='space-y-4'>
          {/* Concept Header */}
          <div className='p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold text-white'>{clip.title}</h4>
              <span className='text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 uppercase'>
                Analytical Remediation
              </span>
            </div>
            <p className='text-xs text-slate-300 leading-relaxed'>{clip.description}</p>
          </div>

          {/* Primary Visual Breakdown Panel (First-class visual weight) */}
          <div className='p-5 bg-slate-950/90 border border-slate-800 rounded-lg space-y-3'>
            <div className='flex items-center gap-2 text-xs font-mono text-cyan-400 font-medium pb-2 border-b border-slate-800/80'>
              <BookOpen className='w-3.5 h-3.5' />
              <span>Geometric Derivation & Analytical State Evolution</span>
            </div>
            <p className='text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line'>
              {clip.fallback_explanation}
            </p>
          </div>

          {/* Key Conceptual Principles */}
          {clip.key_takeaways.length > 0 && (
            <div className='p-4 bg-slate-950/50 rounded-lg border border-slate-800/80 space-y-2.5'>
              <div className='text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold'>
                Key Conceptual Takeaways:
              </div>
              <ul className='space-y-2'>
                {clip.key_takeaways.map((takeaway, i) => (
                  <li key={i} className='flex items-start gap-2 text-xs text-slate-200 leading-relaxed'>
                    <CheckCircle2 className='w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5' />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
