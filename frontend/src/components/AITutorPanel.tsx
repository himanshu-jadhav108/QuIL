import React from 'react';
import { SimulationResult, TutorResponse, ConceptName } from '../types/quantum';
import { BookOpen, Send, Lightbulb, Compass, AlertCircle } from 'lucide-react';

interface Props {
  simResult: SimulationResult | null;
  tutorResponse: TutorResponse | null;
  loading: boolean;
  onAsk: (question: string, mode?: 'explain' | 'hint' | 'debug') => void;
  question: string;
  setQuestion: (q: string) => void;
  misconceptionRule?: string | null;
  concept?: ConceptName;
  onNavigateToResults?: () => void;
}

export const AITutorPanel: React.FC<Props> = ({
  simResult,
  tutorResponse,
  loading,
  onAsk,
  question,
  setQuestion,
  misconceptionRule,
  concept = 'superposition',
  onNavigateToResults,
}) => {
  const quickQuestions: Record<ConceptName, string[]> = {
    superposition: [
      'Why does the Hadamard gate produce exactly 50% for |0⟩ and |1⟩?',
      'Is a qubit in superposition secretly a 0 or 1 before measurement?',
      'How does the state vector rotate on the Bloch sphere equator?',
    ],
    measurement: [
      'Why is wavefunction collapse irreversible in quantum mechanics?',
      'Does measuring a second time immediately produce the same outcome?',
      'Why does double Hadamard H·H return the qubit to |0⟩?',
    ],
    entanglement: [
      'Why can entanglement not be used for faster-than-light signalling?',
      'Why do outcomes |01⟩ and |10⟩ never occur in the Bell state?',
      'How does the CNOT gate create non-separable composite amplitudes?',
    ],
  };

  const currentQuestions = quickQuestions[concept] || quickQuestions.superposition;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onAsk(question, 'explain');
  };

  return (
    <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <BookOpen className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Grounded Pedagogical Engine
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Evidence-Grounded Explanations · Zero Probabilistic Physics Hallucination
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => onAsk('', 'hint')}
            disabled={loading || !simResult}
            className='px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50'
          >
            Request Hint
          </button>
          <button
            onClick={() => onAsk('', 'debug')}
            disabled={loading || !simResult}
            className='px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 transition-colors disabled:opacity-50'
          >
            Debug State
          </button>
        </div>
      </div>

      {/* Ground Truth Evidence Context Strip (Linked to Results) */}
      {simResult ? (
        <div className='p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400'>
          <div className='flex items-center gap-2'>
            <span className='text-slate-400'>Grounded In:</span>
            <span className='text-slate-200'>Qiskit Aer ({simResult.num_shots} shots)</span>
            <span className='text-slate-600'>·</span>
            <span className='text-cyan-400 font-medium capitalize'>{simResult.concept}</span>
            {misconceptionRule && (
              <>
                <span className='text-slate-600'>·</span>
                <span className='px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono text-[10px]'>
                  Rule {misconceptionRule} Active
                </span>
              </>
            )}
          </div>
          {onNavigateToResults && (
            <button
              onClick={onNavigateToResults}
              className='text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] underline-offset-2 hover:underline'
            >
              <span>View full comparison in Evidence & Compare</span>
              <span>→</span>
            </button>
          )}
        </div>
      ) : (
        <div className='p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-400 font-mono text-center'>
          Simulation evidence pending · Run a circuit in the lab to ground tutor answers.
        </div>
      )}

      {/* Main Grounded Explanation Display */}
      <div className='min-h-[160px] p-4 bg-slate-950/90 rounded-lg border border-slate-800/90'>
        {loading ? (
          <div className='flex items-center justify-center h-36 text-slate-400 text-xs gap-2 font-mono'>
            <div className='w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
            <span>Formulating grounded explanation from simulator trace...</span>
          </div>
        ) : tutorResponse ? (
          <div className='space-y-3.5 text-xs text-slate-200 leading-relaxed'>
            <div className='space-y-2'>
              <div className='text-[10px] font-mono uppercase tracking-wider text-slate-500'>
                Pedagogical Analysis:
              </div>
              <p className='whitespace-pre-line text-slate-300 text-sm leading-relaxed'>
                {tutorResponse.explanation}
              </p>
            </div>

            {tutorResponse.key_insight && (
              <div className='p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-1'>
                <div className='flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] font-mono'>
                  <Lightbulb className='w-3.5 h-3.5' />
                  Core Physical Principle
                </div>
                <p className='text-cyan-200/90'>{tutorResponse.key_insight}</p>
              </div>
            )}

            {tutorResponse.suggested_actions && tutorResponse.suggested_actions.length > 0 && (
              <div className='pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px] font-mono'>
                <span className='text-slate-500'>Remediation Steps:</span>
                {tutorResponse.suggested_actions.map((act, i) => (
                  <span
                    key={i}
                    className='px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700'
                  >
                    {act}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-36 text-slate-500 text-xs space-y-2'>
            <Compass className='w-6 h-6 text-slate-700' />
            <span>Select an inquiry below or ask a specific question regarding circuit mechanics.</span>
          </div>
        )}
      </div>

      {/* Suggested Inquiries */}
      <div className='space-y-2'>
        <div className='text-[10px] font-mono text-slate-500 uppercase tracking-wider'>
          Conceptual Inquiries Grounded in {concept}:
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {currentQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(q);
                onAsk(q, 'explain');
              }}
              className='px-3 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-left'
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Inquiry Form */}
      <form onSubmit={handleSubmit} className='flex items-center gap-2 pt-1'>
        <input
          type='text'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask a scientific question regarding ${concept} state evolution...`}
          className='flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 font-sans'
        />
        <button
          type='submit'
          disabled={loading || !question.trim()}
          className='px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40'
        >
          <Send className='w-3 h-3' />
          <span>Inquire</span>
        </button>
      </form>
    </div>
  );
};
