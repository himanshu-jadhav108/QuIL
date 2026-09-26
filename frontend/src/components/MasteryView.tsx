import React from 'react';
import { MasteryMap, ConceptName, ConceptMastery } from '../types/quantum';
import { Layers, CheckCircle2, TrendingUp } from 'lucide-react';

interface Props {
  mastery: MasteryMap | null;
}

const CONCEPTS: ConceptName[] = ['superposition', 'measurement', 'entanglement'];

export const MasteryView: React.FC<Props> = ({ mastery }) => {
  const overallScore = React.useMemo(() => {
    if (!mastery) return 0;
    if (typeof (mastery as any).overall_progress === 'number') {
      return (mastery as any).overall_progress;
    }
    const scores = CONCEPTS.map((c) => {
      const entry = (mastery as any).concepts?.[c] || mastery[c];
      return typeof entry?.score === 'number' ? entry.score : 0;
    });
    return scores.reduce((s, val) => s + val, 0) / Math.max(scores.length, 1);
  }, [mastery]);

  return (
    <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <Layers className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Student Competency & Mastery Matrix
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Quantitative Progression Derived from Deterministic Verification Challenges
            </p>
          </div>
        </div>
        <div className='text-right'>
          <div className='text-[10px] text-slate-500 font-mono uppercase tracking-wider'>
            Aggregate Mastery
          </div>
          <div className='text-lg font-bold text-white font-mono'>
            {(overallScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Aggregate Progress Track */}
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-[11px] font-mono text-slate-400'>
          <span>Curriculum Coverage</span>
          <span>Learning → Practicing → Mastered</span>
        </div>
        <div className='h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800'>
          <div
            className='h-full bg-cyan-500 rounded-full transition-all duration-500'
            style={{ width: `${Math.max(overallScore * 100, 2)}%` }}
          />
        </div>
      </div>

      {/* Per-concept competency breakdown */}
      {!mastery ? (
        <div className='text-center py-8 text-slate-500 font-mono text-xs flex flex-col items-center gap-2 bg-slate-950/60 rounded-lg border border-slate-800'>
          <TrendingUp className='w-6 h-6 text-slate-700' />
          <span>Complete challenges in the laboratory to populate competency metrics.</span>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5'>
          {CONCEPTS.map((conceptName) => {
            const rawEntry = (mastery as any).concepts?.[conceptName] || mastery[conceptName];
            const cm: ConceptMastery = rawEntry && typeof rawEntry === 'object' ? rawEntry : {
              concept: conceptName,
              score: 0,
              level: 'Learning',
              attempts: 0,
              correct: 0,
            };

            const levelBadge =
              cm.level === 'Mastered'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                : cm.level === 'Practicing'
                ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80'
                : 'bg-slate-950 text-slate-400 border-slate-800';

            return (
              <div
                key={conceptName}
                className='p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3'
              >
                <div className='flex items-center justify-between'>
                  <span className='capitalize font-bold text-slate-200 text-xs font-mono'>
                    {conceptName}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${levelBadge}`}>
                    {cm.level}
                  </span>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-[11px] font-mono text-slate-400'>
                    <span>Proficiency Score</span>
                    <span className='text-cyan-300 font-bold'>{(cm.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className='h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800'>
                    <div
                      className='h-full bg-cyan-400 rounded-full transition-all duration-500'
                      style={{ width: `${Math.max(cm.score * 100, 2)}%` }}
                    />
                  </div>
                </div>

                <div className='flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80'>
                  <span>Attempts: {cm.attempts}</span>
                  <span>
                    Accuracy: {cm.attempts > 0 ? ((cm.correct / cm.attempts) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
