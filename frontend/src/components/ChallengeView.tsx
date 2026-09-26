import React, { useState, useMemo, useRef } from 'react';
import { Challenge, ChallengeOption, SubmitAnswerResponse, SimulationResult, ConceptName } from '../types/quantum';
import { Award, CheckCircle2, XCircle, RefreshCw, Send, ArrowRight, Lightbulb, Sparkles, Filter } from 'lucide-react';

interface Props {
  challenges: Challenge[];
  loading: boolean;
  result: SubmitAnswerResponse | null;
  simResult?: SimulationResult | null;
  onSubmit: (challengeId: string, answerId: string) => void;
  onReload: () => void;
}

export const ChallengeView: React.FC<Props> = ({
  challenges,
  loading,
  result,
  simResult: _simResult,
  onSubmit,
  onReload,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [filterConcept, setFilterConcept] = useState<'all' | ConceptName>('all');
  const [challengeHistory, setChallengeHistory] = useState<
    Record<string, { correct: boolean; score: number; points: number; feedback: string; advice?: string }>
  >({});
  const lastHandledResultRef = useRef<SubmitAnswerResponse | null>(null);

  const rawList = useMemo(() => (Array.isArray(challenges) ? challenges : []), [challenges]);

  // Filter challenges by concept if selected
  const filteredChallenges = useMemo(() => {
    if (filterConcept === 'all') return rawList;
    return rawList.filter((c) => c.concept.toLowerCase() === filterConcept.toLowerCase());
  }, [rawList, filterConcept]);

  const currentChallenge = useMemo(() => {
    return filteredChallenges.find((c) => c.id === selectedChallenge) || filteredChallenges[0] || rawList[0];
  }, [filteredChallenges, selectedChallenge, rawList]);

  // When result comes in, update history for scoring
  React.useEffect(() => {
    if (!result || !currentChallenge || result === lastHandledResultRef.current) return;
    lastHandledResultRef.current = result;
    const pts = result.points_earned ?? (result.correct ? (currentChallenge.points ?? 100) : 0);
    const challengeId = currentChallenge.id;
    const entry = {
      correct: result.correct,
      score: result.score,
      points: pts,
      feedback: result.feedback,
      advice: result.improvement_advice || currentChallenge.improvement_tip,
    };
    const timer = setTimeout(() => {
      setChallengeHistory((prev) => ({
        ...prev,
        [challengeId]: entry,
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [result, currentChallenge]);

  // Score Calculations
  const stats = useMemo(() => {
    const totalPossiblePoints = rawList.reduce((acc, c) => acc + (c.points || 100), 0) || 900;
    const attemptedCount = Object.keys(challengeHistory).length;
    const passedCount = Object.values(challengeHistory).filter((h) => h.correct).length;
    const totalPointsEarned = Object.values(challengeHistory).reduce((acc, h) => acc + h.points, 0);
    const accuracy = attemptedCount > 0 ? Math.round((passedCount / attemptedCount) * 100) : 0;
    return { totalPossiblePoints, attemptedCount, passedCount, totalPointsEarned, accuracy };
  }, [rawList, challengeHistory]);

  // Options normalization
  const normalizedOptions: Array<{ id: string; text: string }> = useMemo(() => {
    if (!currentChallenge) return [];
    const rawOpts = currentChallenge.options;
    if (Array.isArray(rawOpts) && rawOpts.length > 0) {
      return rawOpts.map((opt: ChallengeOption | string, idx: number) => {
        if (typeof opt === 'string') {
          return { id: String(idx), text: opt };
        }
        return {
          id: String(opt?.id ?? idx),
          text: opt?.text || String(opt),
        };
      });
    }

    return [
      { id: '0', text: 'Option A: The quantum state aligns with theoretical expectation' },
      { id: '1', text: 'Option B: The quantum state collapses deterministically' },
    ];
  }, [currentChallenge]);

  const handleSubmit = () => {
    if (!currentChallenge || !selectedOption) return;
    onSubmit(currentChallenge.id, selectedOption);
  };

  const handleNextChallenge = () => {
    const currentIdx = filteredChallenges.findIndex((c) => c.id === currentChallenge?.id);
    if (currentIdx >= 0 && currentIdx < filteredChallenges.length - 1) {
      setSelectedChallenge(filteredChallenges[currentIdx + 1].id);
      setSelectedOption('');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center gap-3 p-8 bg-[#0d1424] border border-slate-800 rounded-xl'>
        <div className='w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin' />
        <span className='text-slate-300 font-mono text-xs'>Loading verification challenges from quantum engine...</span>
      </div>
    );
  }

  const activeAttempt = currentChallenge ? challengeHistory[currentChallenge.id] : null;

  return (
    <div className='space-y-6'>
      {/* ── SCOREBOARD BANNER ── */}
      <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400'>
              <Award className='w-5 h-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-sm font-bold uppercase tracking-wider text-white'>
                  Deterministic Mastery Challenges
                </h2>
                <span className='px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono text-[10px]'>
                  9 Total Challenges
                </span>
              </div>
              <p className='text-xs text-slate-400 font-mono'>
                Quantitative Assessment · Real-time Score Progression · Improvement Insights
              </p>
            </div>
          </div>

          <button
            onClick={onReload}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors self-start sm:self-auto'
          >
            <RefreshCw className='w-3 h-3' />
            <span>Reload All</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <div className='p-3 bg-slate-950/80 rounded-lg border border-slate-800'>
            <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>Total Points</div>
            <div className='text-lg font-bold font-mono text-cyan-300 mt-0.5'>
              {stats.totalPointsEarned} <span className='text-xs text-slate-500'>/ {stats.totalPossiblePoints}</span>
            </div>
          </div>
          <div className='p-3 bg-slate-950/80 rounded-lg border border-slate-800'>
            <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>Completed</div>
            <div className='text-lg font-bold font-mono text-white mt-0.5'>
              {stats.attemptedCount} <span className='text-xs text-slate-500'>/ {rawList.length || 9}</span>
            </div>
          </div>
          <div className='p-3 bg-slate-950/80 rounded-lg border border-slate-800'>
            <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>Solved Correctly</div>
            <div className='text-lg font-bold font-mono text-emerald-400 mt-0.5'>
              {stats.passedCount}
            </div>
          </div>
          <div className='p-3 bg-slate-950/80 rounded-lg border border-slate-800'>
            <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>Accuracy Rate</div>
            <div className='text-lg font-bold font-mono text-indigo-300 mt-0.5'>
              {stats.accuracy}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='space-y-1.5 pt-1'>
          <div className='flex justify-between text-[11px] font-mono text-slate-400'>
            <span>Curriculum Score Progress</span>
            <span className='text-cyan-400 font-bold'>
              {Math.round((stats.totalPointsEarned / (stats.totalPossiblePoints || 1)) * 100)}% Complete
            </span>
          </div>
          <div className='h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800'>
            <div
              className='h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300'
              style={{
                width: `${Math.min(100, Math.round((stats.totalPointsEarned / (stats.totalPossiblePoints || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── CONCEPT FILTER BAR ── */}
      <div className='flex items-center justify-between gap-2 overflow-x-auto pb-1'>
        <div className='flex items-center gap-1.5'>
          <span className='text-xs font-mono text-slate-400 flex items-center gap-1 mr-1'>
            <Filter className='w-3 h-3' /> Concept:
          </span>
          {(['all', 'superposition', 'measurement', 'entanglement'] as const).map((c) => (
            <button
              key={c}
              onClick={() => {
                setFilterConcept(c);
                setSelectedOption('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors capitalize ${
                filterConcept === c
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {c === 'all' ? 'All Challenges (9)' : c}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHALLENGE TABS / SELECTOR ── */}
      <div className='flex gap-2 flex-wrap'>
        {filteredChallenges.map((c, idx) => {
          const isSelected = currentChallenge?.id === c.id;
          const status = challengeHistory[c.id];
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedChallenge(c.id);
                setSelectedOption('');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono transition-colors border flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500/80 text-white font-semibold'
                  : 'bg-[#0d1424] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {status ? (
                status.correct ? (
                  <CheckCircle2 className='w-3.5 h-3.5 text-emerald-400' />
                ) : (
                  <XCircle className='w-3.5 h-3.5 text-amber-400' />
                )
              ) : (
                <span className='w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center text-slate-400'>
                  {idx + 1}
                </span>
              )}
              <span>{c.title.split(':')[0]}</span>
              <span className='text-[10px] text-slate-500 font-mono'>+{c.points || 100}</span>
            </button>
          );
        })}
      </div>

      {/* ── CURRENT ACTIVE CHALLENGE CARD ── */}
      {currentChallenge && (
        <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-6 sm:p-7 space-y-6'>
          {/* Header */}
          <div className='space-y-2 pb-4 border-b border-slate-800'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded'>
                  {currentChallenge.concept}
                </span>
                <span className='text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800'>
                  {currentChallenge.difficulty}
                </span>
              </div>
              <span className='text-xs font-mono font-bold text-amber-400 flex items-center gap-1'>
                <Sparkles className='w-3.5 h-3.5' /> {currentChallenge.points || 100} Points
              </span>
            </div>

            <h3 className='text-lg font-bold text-white'>{currentChallenge.title}</h3>
            <p className='text-sm text-slate-200 leading-relaxed'>{currentChallenge.prompt}</p>
          </div>

          {/* Multiple Choice Options */}
          <div className='space-y-2.5'>
            <div className='text-xs font-mono uppercase tracking-wider text-slate-400'>Select Your Answer:</div>
            {normalizedOptions.map((opt) => {
              const isChecked = selectedOption === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-slate-800/90 border-cyan-500 text-white font-medium'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type='radio'
                    name='challenge_option'
                    value={opt.id}
                    checked={isChecked}
                    onChange={() => setSelectedOption(opt.id)}
                    className='mt-0.5 accent-cyan-500 cursor-pointer'
                  />
                  <span className='leading-relaxed'>{opt.text}</span>
                </label>
              );
            })}
          </div>

          {/* Submission Action Button */}
          <div className='flex items-center gap-3 pt-2'>
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className='px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <Send className='w-3.5 h-3.5' />
              <span>Submit & Evaluate Solution</span>
            </button>
          </div>

          {/* ── WHAT TO IMPROVE & EVALUATED FEEDBACK ── */}
          {(activeAttempt || result) && (
            <div
              className={`p-5 rounded-xl border space-y-4 animate-tab-fade ${
                (activeAttempt?.correct ?? result?.correct)
                  ? 'bg-emerald-950/20 border-emerald-800/70 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-800/70 text-amber-200'
              }`}
            >
              {/* Outcome Header & Score */}
              <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
                <div className='flex items-center gap-2'>
                  {(activeAttempt?.correct ?? result?.correct) ? (
                    <CheckCircle2 className='w-5 h-5 text-emerald-400 shrink-0' />
                  ) : (
                    <XCircle className='w-5 h-5 text-amber-400 shrink-0' />
                  )}
                  <span className='font-bold text-sm'>
                    {(activeAttempt?.correct ?? result?.correct)
                      ? `Solution Validated — Correct (+${activeAttempt?.points ?? (result?.points_earned ?? (currentChallenge.points || 100))} Points)`
                      : 'Incorrect Solution (0 Points)'}
                  </span>
                </div>
                <span className='text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-white'>
                  Score: {((activeAttempt?.score ?? (result?.score ?? 0)) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Physical Principle Explanation */}
              <div className='space-y-1.5'>
                <div className='text-xs font-mono uppercase tracking-wider text-slate-400'>Physical Principle:</div>
                <p className='text-xs text-slate-300 leading-relaxed font-sans'>
                  {activeAttempt?.feedback || result?.feedback}
                </p>
              </div>

              {/* ACTIONABLE "WHAT TO IMPROVE" GUIDANCE */}
              <div className='p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2'>
                <div className='flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400'>
                  <Lightbulb className='w-4 h-4 text-amber-400' />
                  <span>What to Improve / Next Learning Step:</span>
                </div>
                <p className='text-xs text-slate-300 leading-relaxed font-sans'>
                  {activeAttempt?.advice ||
                    result?.improvement_advice ||
                    currentChallenge.improvement_tip ||
                    'Review the lesson for this concept and re-test your prediction on the Qiskit Aer simulator.'}
                </p>
              </div>

              {/* Next Challenge Action */}
              <div className='pt-1 flex items-center justify-end'>
                <button
                  onClick={handleNextChallenge}
                  className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono border border-slate-700 transition-colors'
                >
                  <span>Next Challenge</span>
                  <ArrowRight className='w-3.5 h-3.5' />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
