import React, { useState } from 'react';
import { Challenge, SubmitAnswerResponse, SimulationResult } from '../types/quantum';
import { Award, CheckCircle2, XCircle, RefreshCw, Send, ArrowRight } from 'lucide-react';

interface Props {
  challenges: Challenge[];
  loading: boolean;
  result: SubmitAnswerResponse | null;
  simResult: SimulationResult | null;
  onSubmit: (challengeId: string, answerId: string) => void;
  onReload: () => void;
}

export const ChallengeView: React.FC<Props> = ({
  challenges,
  loading,
  result,
  simResult,
  onSubmit,
  onReload,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const challengeList = Array.isArray(challenges) ? challenges : [];
  const currentChallenge = challengeList.find((c) => c.id === selectedChallenge) || challengeList[0];

  // Bulletproof options normalization: handles null, undefined, string[], and object[] safely
  const normalizedOptions: Array<{ id: string; text: string }> = React.useMemo(() => {
    if (!currentChallenge) return [];
    const rawOpts = (currentChallenge as any).options;
    if (Array.isArray(rawOpts) && rawOpts.length > 0) {
      return rawOpts.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
          return { id: String(idx), text: opt };
        }
        return {
          id: String(opt?.id ?? idx),
          text: opt?.text || opt?.label || String(opt),
        };
      });
    }

    // Context-sensitive fallback options if options array is missing
    const cid = currentChallenge.id || '';
    const conc = currentChallenge.concept || '';
    if (conc === 'superposition' || cid.includes('superposition')) {
      return [
        { id: '0', text: 'P(|0⟩) = 50%, P(|1⟩) = 50% — Balanced equal superposition' },
        { id: '1', text: 'P(|0⟩) = 100%, P(|1⟩) = 0% — Deterministic outcome |0⟩' },
        { id: '2', text: 'P(|0⟩) = 0%, P(|1⟩) = 100% — Deterministic outcome |1⟩' },
        { id: '3', text: 'P(|0⟩) = 75%, P(|1⟩) = 25% — Biased toward ground state' },
      ];
    }
    if (conc === 'entanglement' || cid.includes('bell')) {
      return [
        { id: '0', text: 'Hadamard on qubit 0, followed by CNOT(control=q0, target=q1)' },
        { id: '1', text: 'Pauli-X on qubit 0, followed by CNOT(control=q0, target=q1)' },
        { id: '2', text: 'Hadamard on both qubit 0 and qubit 1 independently' },
        { id: '3', text: 'CNOT(control=q1, target=q0) without prior superposition' },
      ];
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

  if (loading) {
    return (
      <div className='flex items-center gap-3 p-6 bg-slate-900/60 border border-slate-800 rounded-xl'>
        <div className='w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
        <span className='text-slate-300 font-mono text-xs'>Loading verification challenges...</span>
      </div>
    );
  }

  if (!simResult) {
    return (
      <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-3'>
        <Award className='w-7 h-7 text-slate-600 mx-auto' />
        <p className='text-slate-400 text-xs font-mono'>
          Execute a quantum circuit simulation first to unlock deterministic mastery challenges.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <Award className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Deterministic Mastery Challenges
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Mathematical Assessment · Quantitative Score Progression
            </p>
          </div>
        </div>
        <button
          onClick={onReload}
          className='flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors'
        >
          <RefreshCw className='w-3 h-3' />
          <span>Reload</span>
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className='text-center py-8 text-slate-500 font-mono text-xs'>
          No challenges found for current concept.{' '}
          <button onClick={onReload} className='text-cyan-400 underline'>
            Reload
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Challenge Tabs */}
          <div className='flex gap-1.5 flex-wrap'>
            {challenges.map((c, idx) => {
              const isSelected =
                selectedChallenge === c.id || (!selectedChallenge && challenges[0]?.id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedChallenge(c.id);
                    setSelectedOption('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                    isSelected
                      ? 'bg-slate-800 border-slate-600 text-white font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Challenge {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Challenge Form */}
          {currentChallenge && (
            <div className='space-y-4'>
              <div className='p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2'>
                <div className='flex items-center justify-between text-xs font-mono'>
                  <span className='text-cyan-300 font-semibold'>{currentChallenge.title}</span>
                  <span className='px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] capitalize border border-slate-700'>
                    {currentChallenge.difficulty}
                  </span>
                </div>
                <p className='text-xs text-slate-200 leading-relaxed font-sans'>
                  {currentChallenge.prompt}
                </p>
              </div>

              {/* Options */}
              <div className='space-y-2'>
                {normalizedOptions.map((opt) => {
                  const isChecked = selectedOption === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-slate-800/90 border-cyan-500/80 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type='radio'
                        name='challenge_option'
                        value={opt.id}
                        checked={isChecked}
                        onChange={() => setSelectedOption(opt.id)}
                        className='mt-0.5 accent-cyan-500'
                      />
                      <span className='leading-relaxed'>{opt.text}</span>
                    </label>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className='pt-1'>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                  className='px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40'
                >
                  <Send className='w-3 h-3' />
                  <span>Submit Solution</span>
                </button>
              </div>

              {/* Evaluated Outcome Feedback */}
              {result && (
                <div
                  className={`p-4 rounded-lg border space-y-2 ${
                    result.correct
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                      : 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                  }`}
                >
                  <div className='flex items-center justify-between text-xs font-mono font-semibold'>
                    <div className='flex items-center gap-2'>
                      {result.correct ? (
                        <CheckCircle2 className='w-4 h-4 text-emerald-400' />
                      ) : (
                        <XCircle className='w-4 h-4 text-amber-400' />
                      )}
                      <span>
                        {result.correct ? 'Solution Validated — Correct' : 'Incorrect Solution'}
                      </span>
                    </div>
                    <span className='text-slate-400'>
                      Score: {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className='text-xs text-slate-300 leading-relaxed font-sans'>{result.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
