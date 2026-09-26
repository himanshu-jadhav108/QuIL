import React, { useState, useEffect, useRef } from 'react';
import { SimulationResult, TutorResponse, ConceptName } from '../types/quantum';
import { MessageSquare, Send, Lightbulb, Sparkles, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';

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
  accuracyScore?: number | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'quil';
  text: string;
  time: string;
  insight?: string;
  suggestedActions?: string[];
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize or reset chat on concept change
  useEffect(() => {
    const welcomeMessages: Record<ConceptName, string> = {
      superposition:
        'Hello! I am QuIL, your quantum learning assistant. Ask me anything about the Hadamard gate, how probability amplitudes form equal superpositions, or why a qubit has no predetermined classical value before measurement.',
      measurement:
        'Hello! I am QuIL. I am here to clarify how quantum measurement works. Ask me about projective operators, Born rule probabilities, or why measurement irreversibly collapses the quantum state.',
      entanglement:
        'Hello! I am QuIL. Ask me about the Bell state, non-separable composite wavefunctions, CNOT entanglement mechanics, or why quantum correlation cannot transmit faster-than-light signals.',
    };

    setMessages([
      {
        id: 'welcome',
        sender: 'quil',
        text: welcomeMessages[concept] || welcomeMessages.superposition,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [concept]);

  // Append new tutor response to chat history
  useEffect(() => {
    if (!tutorResponse) return;
    const answerText = tutorResponse.explanation || (tutorResponse as any).response || '';
    if (!answerText) return;

    setMessages((prev) => {
      // Don't duplicate identical consecutive responses
      if (prev.length > 0 && prev[prev.length - 1].text === answerText) return prev;
      return [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'quil',
          text: answerText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          insight: tutorResponse.key_insight,
          suggestedActions: tutorResponse.suggested_actions,
        },
      ];
    });
  }, [tutorResponse]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend !== undefined ? textToSend : question).trim();
    if (!q) return;

    // Add user message to conversation history
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    onAsk(q, 'explain');
  };

  // Context-sensitive suggested inquiries
  const getSuggestedQuestions = (): string[] => {
    if (simResult) {
      // After simulation / diagnosis phase
      const resultQuestions: string[] = [
        'Why was my prediction wrong?',
        concept === 'superposition'
          ? 'What does the H gate do here?'
          : concept === 'entanglement'
          ? 'What does CNOT do here?'
          : 'Why does the state collapse upon measurement?',
        'Why did the simulator get this result?',
      ];
      if (misconceptionRule === 'M1') {
        resultQuestions.push('Why is superposition not a hidden classical value?');
      } else if (misconceptionRule === 'M2') {
        resultQuestions.push('Does measuring a second time yield the exact same state?');
      } else if (misconceptionRule === 'M3') {
        resultQuestions.push('Does entanglement allow faster-than-light communication?');
      }
      return resultQuestions;
    }

    // Pre-simulation conceptual inquiries
    const preQuestions: Record<ConceptName, string[]> = {
      superposition: [
        'Why does H create 50/50?',
        'Is superposition a hidden 0 or 1?',
        'What changes before measurement?',
      ],
      measurement: [
        'What does measurement do?',
        'Why does the state collapse?',
        'Why cannot I know both outcomes?',
      ],
      entanglement: [
        'Why are the results correlated?',
        'Does entanglement transmit information?',
        'What does CNOT do here?',
      ],
    };
    return preQuestions[concept] || preQuestions.superposition;
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <MessageSquare className='w-3.5 h-3.5' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
                Ask QuIL
              </h3>
              <span className='px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono text-[9px]'>
                Grounded Tutor
              </span>
            </div>
            <p className='text-[11px] text-slate-400 font-mono'>
              Evidence-Grounded Learning Assistant · Zero Physics Hallucination
            </p>
          </div>
        </div>

        {/* Action Modes */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => {
              const hintMsg: ChatMessage = {
                id: String(Date.now()),
                sender: 'user',
                text: 'Requesting a conceptual hint...',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages((prev) => [...prev, hintMsg]);
              onAsk('', 'hint');
            }}
            disabled={loading}
            className='px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50'
          >
            Hint
          </button>
          <button
            onClick={() => {
              const debugMsg: ChatMessage = {
                id: String(Date.now()),
                sender: 'user',
                text: 'Running state diagnostic...',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages((prev) => [...prev, debugMsg]);
              onAsk('', 'debug');
            }}
            disabled={loading || !simResult}
            className='px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 transition-colors disabled:opacity-50'
          >
            Debug State
          </button>
        </div>
      </div>

      {/* Grounded Evidence Context Strip */}
      <div className='p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-slate-400'>
        <div className='flex items-center gap-2'>
          <span className='text-slate-500'>Context:</span>
          {simResult ? (
            <>
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
            </>
          ) : (
            <span className='text-slate-300'>
              Concept Inquiries Active · Formulate questions before or after simulation
            </span>
          )}
        </div>
        {onNavigateToResults && simResult && (
          <button
            onClick={onNavigateToResults}
            className='text-cyan-400 hover:text-cyan-300 transition-colors text-[11px] underline-offset-2 hover:underline'
          >
            View Comparison →
          </button>
        )}
      </div>

      {/* Chat Messages Feed */}
      <div className='min-h-[220px] max-h-[360px] overflow-y-auto p-4 bg-slate-950/90 rounded-lg border border-slate-800/90 space-y-3.5 font-sans'>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className='flex items-center gap-1.5 text-[10px] font-mono text-slate-500 px-1'>
                <span>{isUser ? 'YOU' : 'QUIL TUTOR'}</span>
                <span>·</span>
                <span>{msg.time}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-950/40 border border-cyan-800/50 text-cyan-100'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                }`}
              >
                <p className='whitespace-pre-line text-xs font-sans'>{msg.text}</p>

                {/* Core Physical Insight Badge */}
                {msg.insight && (
                  <div className='mt-2.5 pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-cyan-300 font-mono'>
                    <Lightbulb className='w-3 h-3 text-cyan-400 shrink-0 mt-0.5' />
                    <span>{msg.insight}</span>
                  </div>
                )}

                {/* Remediation Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className='mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px] font-mono'>
                    <span className='text-slate-500'>Actions:</span>
                    {msg.suggestedActions.map((act, i) => (
                      <span
                        key={i}
                        className='px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700'
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className='flex items-center gap-2 p-3 text-xs text-slate-400 font-mono bg-slate-900/40 rounded-lg border border-slate-800/50'>
            <div className='w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
            <span>QuIL is formulating a grounded answer from the simulator trace...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Inquiries Pills */}
      <div className='space-y-1.5'>
        <div className='text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5'>
          <HelpCircle className='w-3 h-3 text-slate-500' />
          <span>Suggested Questions:</span>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={loading}
              className='px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors text-left font-sans disabled:opacity-50'
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Inquiry Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className='flex items-center gap-2 pt-1'
      >
        <input
          type='text'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask QuIL about ${concept}, state transformations, or your results...`}
          className='flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 font-sans'
        />
        <button
          type='submit'
          disabled={loading || !question.trim()}
          className='px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40'
        >
          <Send className='w-3 h-3' />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
