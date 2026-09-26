'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from '../components/Navbar';
import { BlochSphere } from '../components/BlochSphere';
import { Histogram } from '../components/Histogram';
import { CircuitCanvas } from '../components/CircuitCanvas';
import { AITutorPanel } from '../components/AITutorPanel';
import { ManimPlayer } from '../components/ManimPlayer';
import { TraceViewer } from '../components/TraceViewer';
import { ChallengeView } from '../components/ChallengeView';
import { MasteryView } from '../components/MasteryView';
import {
  SimulationResult,
  TutorResponse,
  ManimClip,
  TraceStep,
  Challenge,
  SubmitAnswerResponse,
  MasteryMap,
  ConceptName,
} from '../types/quantum';
import {
  runSimulation,
  getTutorExplanation,
  getManimClip,
  getTrace,
  listChallenges,
  submitAnswer,
  getMastery,
  checkHealth,
} from '../lib/api';
import { Atom, BookOpen, BrainCircuit, Cpu, Layers, PlayCircle, Zap, AlertTriangle } from 'lucide-react';

/* ── CONCEPT CONFIG ───────────────────────────────────────────────── */
const CONCEPTS: { id: ConceptName; title: string; description: string; color: string }[] = [
  {
    id: 'superposition',
    title: 'Quantum Superposition',
    description: 'A qubit exists in multiple states simultaneously until measured.',
    color: 'cyan',
  },
  {
    id: 'measurement',
    title: 'Quantum Measurement',
    description: 'Measuring collapses the quantum state to a definite classical value.',
    color: 'indigo',
  },
  {
    id: 'entanglement',
    title: 'Quantum Entanglement',
    description: 'Two qubits become correlated; measuring one instantly determines the other.',
    color: 'violet',
  },
];

/* ── PREDICTION STATE ─────────────────────────────────────────────── */
interface Prediction {
  zero: number;
  one: number;
}

/* ── EMPTY STATES ─────────────────────────────────────────────────── */
const emptyResult: SimulationResult = {
  counts: {},
  probabilities: {},
  num_qubits: 1,
  num_shots: 1024,
  circuit_diagram: '',
  gates_applied: [],
  concept: 'superposition',
  execution_time_ms: 0,
};

/* ══════════════════════════════════════════════════════════════════ */
export default function Home() {
  /* navigation */
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedConcept, setSelectedConcept] = useState<ConceptName>('superposition');

  /* backend health */
  const [backendReady, setBackendReady] = useState(false);
  const [healthError, setHealthError] = useState('');

  /* simulation */
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState('');

  /* prediction */
  const [prediction, setPrediction] = useState<Prediction>({ zero: 50, one: 50 });
  const [predictionLocked, setPredictionLocked] = useState(false);

  /* tutor */
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState('');

  /* manim */
  const [manimClip, setManimClip] = useState<ManimClip | null>(null);
  const [manimLoading, setManimLoading] = useState(false);

  /* trace */
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [traceLoading, setTraceLoading] = useState(false);

  /* challenges */
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeResult, setChallengeResult] = useState<SubmitAnswerResponse | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);

  /* mastery */
  const [mastery, setMastery] = useState<MasteryMap | null>(null);

  /* ── BOOT: health check with auto-reconnect for Render cold starts ── */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let attempts = 0;

    const probe = async () => {
      try {
        const h = await checkHealth();
        if (h.simulator_ready) {
          setBackendReady(true);
          setHealthError('');
          return;
        }
      } catch {
        attempts += 1;
        if (attempts === 1) {
          setHealthError('Connecting to Quantum Engine... (Render free tier takes ~30-45s to wake up if sleeping)');
        } else {
          setHealthError(`Connecting to Quantum Engine (attempt ${attempts})... Spinning up simulator.`);
        }
        timer = setTimeout(probe, 4000);
      }
    };

    probe();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  /* ── RUN SIMULATION ─────────────────────────────────────────────── */
  const handleSimulate = useCallback(async () => {
    setSimLoading(true);
    setSimError('');
    try {
      const result = await runSimulation(selectedConcept, 1024);
      setSimResult(result);
      /* auto-fetch trace */
      const t = await getTrace(selectedConcept);
      setTrace(t);
    } catch (e: unknown) {
      setSimError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  }, [selectedConcept]);

  /* ── TUTOR ──────────────────────────────────────────────────────── */
  const handleAskTutor = useCallback(async (question: string) => {
    if (!simResult) return;
    setTutorLoading(true);
    try {
      const resp = await getTutorExplanation({
        concept: simResult.concept,
        simulation_result: simResult,
        user_question: question || undefined,
      });
      setTutorResponse(resp);
    } catch {
      /* noop */
    } finally {
      setTutorLoading(false);
    }
  }, [simResult]);

  /* ── MANIM ──────────────────────────────────────────────────────── */
  const handleFetchManim = useCallback(async () => {
    if (!simResult) return;
    setManimLoading(true);
    try {
      const clip = await getManimClip(simResult.concept);
      setManimClip(clip);
    } catch {
      /* noop */
    } finally {
      setManimLoading(false);
    }
  }, [simResult]);

  /* ── CHALLENGES ─────────────────────────────────────────────────── */
  const handleLoadChallenges = useCallback(async () => {
    setChallengeLoading(true);
    try {
      const list = await listChallenges(selectedConcept);
      setChallenges(list);
    } catch {
      /* noop */
    } finally {
      setChallengeLoading(false);
    }
  }, [selectedConcept]);

  const handleSubmitAnswer = useCallback(async (challengeId: string, answerId: string) => {
    if (!simResult) return;
    try {
      const res = await submitAnswer({
        challenge_id: challengeId,
        selected_option_id: answerId,
        concept: simResult.concept,
        simulation_result: simResult,
      });
      setChallengeResult(res);
      /* refresh mastery */
      const m = await getMastery();
      setMastery(m);
    } catch {
      /* noop */
    }
  }, [simResult]);

  /* ── MASTERY ────────────────────────────────────────────────────── */
  useEffect(() => {
    getMastery().then(setMastery).catch(() => {});
  }, []);

  /* ── TAB SIDE EFFECTS ───────────────────────────────────────────── */
  useEffect(() => {
    if (activeTab === 'challenges' && challenges.length === 0) handleLoadChallenges();
    if (activeTab === 'mastery') getMastery().then(setMastery).catch(() => {});
    if (activeTab === 'manim' && !manimClip && simResult) handleFetchManim();
  }, [activeTab]); // eslint-disable-line

  /* ── HELPERS ────────────────────────────────────────────────────── */
  const conceptColor = (c: string) => {
    if (c === 'cyan') return 'from-cyan-500 to-cyan-700 border-cyan-500/40 text-cyan-300';
    if (c === 'indigo') return 'from-indigo-500 to-indigo-700 border-indigo-500/40 text-indigo-300';
    return 'from-violet-500 to-violet-700 border-violet-500/40 text-violet-300';
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className='flex flex-col min-h-screen bg-slate-950'>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} simulatorReady={backendReady} />

      {/* OFFLINE BANNER */}
      {healthError && (
        <div className='flex items-center gap-3 px-6 py-3 bg-amber-950/60 border-b border-amber-800/40 text-amber-300 text-sm font-mono'>
          <AlertTriangle className='w-4 h-4 shrink-0' />
          {healthError}
        </div>
      )}

      <main className='flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6'>

        {/* ── DASHBOARD ────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className='space-y-8'>
            {/* Hero */}
            <div className='text-center space-y-4 py-8'>
              <div className='flex items-center justify-center mb-3'>
                <div className='relative group'>
                  <div className='absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-700 animate-pulse'></div>
                  <img
                    src='/logo.png'
                    alt='QuIL Logo'
                    className='relative w-32 h-32 md:w-36 md:h-36 rounded-2xl object-contain shadow-2xl shadow-cyan-500/30 border border-cyan-500/30 bg-slate-950/80 p-2 backdrop-blur-sm'
                  />
                </div>
              </div>
              <h1 className='text-4xl md:text-5xl font-extrabold text-white tracking-tight'>
                Quantum Intelligence Learning Lab
              </h1>
              <p className='text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-medium'>
                Students predict. The simulator proves. AI explains why.
              </p>
              <p className='text-cyan-400/90 text-sm font-mono'>
                Predict → Build → Simulate → Compare → Diagnose → Explain → Show Me Why → Challenge → Mastery
              </p>
              <div className='flex items-center justify-center gap-2 text-xs font-mono mt-2'>
                <span className='px-3 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800'>SIH26140</span>
                <span className='px-3 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700'>Qiskit Aer Simulator</span>
                <span className={`px-3 py-1 rounded border font-mono text-xs ${backendReady ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'}`}>
                  {backendReady ? 'Simulator Online' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Concept selector */}
            <div>
              <h2 className='text-sm font-mono text-slate-400 uppercase tracking-widest mb-4'>Select a Concept to Explore</h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {CONCEPTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedConcept(c.id); setSimResult(null); setChallenges([]); }}
                    className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedConcept === c.id
                        ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono uppercase tracking-widest mb-2">
                      {selectedConcept === c.id ? '▶ ACTIVE' : 'CONCEPT'}
                    </div>
                    <h3 className='text-white font-bold text-base mb-1'>{c.title}</h3>
                    <p className='text-slate-400 text-sm leading-relaxed'>{c.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {[
                { label: 'Run Simulation', icon: <Zap className='w-4 h-4' />, tab: null as null, action: () => { setActiveTab('results'); handleSimulate(); } },
                { label: 'AI Tutor', icon: <BrainCircuit className='w-4 h-4' />, tab: 'tutor' as ActiveTab, action: () => setActiveTab('tutor') },
                { label: 'Challenges', icon: <Cpu className='w-4 h-4' />, tab: 'challenges' as ActiveTab, action: () => setActiveTab('challenges') },
                { label: 'Mastery Map', icon: <Layers className='w-4 h-4' />, tab: 'mastery' as ActiveTab, action: () => setActiveTab('mastery') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className='flex items-center gap-2 justify-center p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-800 hover:bg-slate-800/80 transition-all text-sm font-medium text-slate-300 hover:text-white'
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LESSON (placeholder) ─────────────────────────────────── */}
        {activeTab === 'lesson' && (
          <div className='space-y-6'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center'>
                <BookOpen className='w-4 h-4 text-cyan-400' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white capitalize'>{selectedConcept} — Lesson</h2>
                <p className='text-xs text-slate-400 font-mono'>Concept introduction before prediction</p>
              </div>
            </div>
            {CONCEPTS.filter(c => c.id === selectedConcept).map(c => (
              <div key={c.id} className='bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-4'>
                <h3 className='text-2xl font-bold text-white'>{c.title}</h3>
                <p className='text-slate-300 text-base leading-relaxed'>{c.description}</p>
                <div className='pt-4 border-t border-slate-800'>
                  <p className='text-xs font-mono text-slate-500 mb-3'>Core principle:</p>
                  <div className='bg-slate-950 rounded-xl p-4 border border-slate-800'>
                    {c.id === 'superposition' && (
                      <p className='text-cyan-300 font-mono text-sm'>
                        |ψ⟩ = α|0⟩ + β|1⟩ &nbsp;→&nbsp; P(0) = |α|², P(1) = |β|², &nbsp; |α|² + |β|² = 1
                      </p>
                    )}
                    {c.id === 'measurement' && (
                      <p className='text-indigo-300 font-mono text-sm'>
                        M|ψ⟩ → |0⟩ with P=|α|² or |1⟩ with P=|β|² — irreversible collapse
                      </p>
                    )}
                    {c.id === 'entanglement' && (
                      <p className='text-violet-300 font-mono text-sm'>
                        |Φ+⟩ = (1/√2)(|00⟩ + |11⟩) — Bell state, non-separable
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('predict')}
                  className='mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold hover:from-cyan-500 hover:to-indigo-500 transition-all'
                >
                  Continue to Predict →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── PREDICT ──────────────────────────────────────────────── */}
        {activeTab === 'predict' && (
          <div className='space-y-6'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center'>
                <BrainCircuit className='w-4 h-4 text-indigo-400' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>Make Your Prediction</h2>
                <p className='text-xs text-slate-400 font-mono'>Before you simulate, what do you expect to see?</p>
              </div>
            </div>
            <div className='bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-6'>
              <p className='text-slate-300'>
                For <span className='text-cyan-300 font-semibold capitalize'>{selectedConcept}</span>, 
                predict the probability distribution. Drag the slider to set your expected |0⟩ probability:
              </p>
              <div className='space-y-3'>
                <div className='flex justify-between text-sm font-mono text-slate-400'>
                  <span>|0⟩ outcome: <span className='text-cyan-300 font-bold'>{prediction.zero}%</span></span>
                  <span>|1⟩ outcome: <span className='text-indigo-300 font-bold'>{prediction.one}%</span></span>
                </div>
                <input
                  type='range' min={0} max={100} value={prediction.zero}
                  onChange={e => setPrediction({ zero: +e.target.value, one: 100 - +e.target.value })}
                  disabled={predictionLocked}
                  className='w-full accent-cyan-500'
                />
                <div className='flex gap-2 h-8 rounded overflow-hidden border border-slate-700'>
                  <div className='bg-cyan-600 transition-all' style={{ width: `${prediction.zero}%` }} />
                  <div className='bg-indigo-600 flex-1 transition-all' />
                </div>
              </div>
              <button
                onClick={() => { setPredictionLocked(true); setActiveTab('circuit'); }}
                disabled={predictionLocked}
                className='px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50'
              >
                {predictionLocked ? 'Prediction Locked ✓' : 'Lock Prediction & Build Circuit →'}
              </button>
            </div>
          </div>
        )}

        {/* ── CIRCUIT LAB ──────────────────────────────────────────── */}
        {activeTab === 'circuit' && (
          <div className='space-y-6'>
            <CircuitCanvas concept={selectedConcept} circuitDiagram={simResult?.circuit_diagram || ''} />
            <div className='flex gap-3'>
              <button
                onClick={() => { setActiveTab('results'); handleSimulate(); }}
                disabled={simLoading}
                className='px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-70 flex items-center gap-2'
              >
                <Zap className='w-4 h-4' />
                {simLoading ? 'Simulating...' : 'Run on Aer Simulator →'}
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS / COMPARE ────────────────────────────────────── */}
        {activeTab === 'results' && (
          <div className='space-y-6'>
            {simLoading && (
              <div className='flex items-center gap-3 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl'>
                <div className='w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
                <span className='text-slate-300 font-mono text-sm'>Running Qiskit Aer simulation...</span>
              </div>
            )}
            {simError && (
              <div className='flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-sm font-mono'>
                <AlertTriangle className='w-4 h-4 shrink-0' />
                {simError}
              </div>
            )}
            {simResult && !simLoading && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <Histogram result={simResult} prediction={prediction} />
                  <div className='bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2'>
                    <h4 className='text-xs font-mono text-slate-400 uppercase tracking-widest'>Your Prediction vs Reality</h4>
                    <div className='grid grid-cols-2 gap-3 text-sm font-mono'>
                      <div className='p-3 rounded-xl bg-slate-950 border border-slate-800'>
                        <div className='text-slate-500 text-xs mb-1'>You predicted |0⟩</div>
                        <div className='text-cyan-300 font-bold text-lg'>{prediction.zero}%</div>
                      </div>
                      <div className='p-3 rounded-xl bg-slate-950 border border-slate-800'>
                        <div className='text-slate-500 text-xs mb-1'>Simulator says |0⟩</div>
                        <div className='text-emerald-300 font-bold text-lg'>
                          {((simResult.probabilities['0'] || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <BlochSphere result={simResult} />
              </div>
            )}
            {!simResult && !simLoading && (
              <div className='text-center py-16 text-slate-500 font-mono'>
                No simulation data yet.{' '}
                <button onClick={handleSimulate} className='text-cyan-400 underline'>Run simulation</button>
              </div>
            )}
            {simResult && (
              <div className='flex gap-3 pt-2'>
                <button onClick={() => setActiveTab('trace')} className='px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 font-medium transition-all'>
                  View Execution Trace →
                </button>
                <button onClick={() => setActiveTab('tutor')} className='px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 font-medium transition-all'>
                  Ask AI Tutor →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TRACE ────────────────────────────────────────────────── */}
        {activeTab === 'trace' && (
          <div className='space-y-6'>
            {traceLoading ? (
              <div className='flex items-center gap-3 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl'>
                <div className='w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                <span className='text-slate-300 font-mono text-sm'>Fetching execution trace...</span>
              </div>
            ) : (
              <TraceViewer trace={trace} />
            )}
            {trace.length > 0 && (
              <button onClick={() => setActiveTab('tutor')} className='px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 font-medium transition-all'>
                Ask AI Tutor About the Trace →
              </button>
            )}
          </div>
        )}

        {/* ── AI TUTOR ─────────────────────────────────────────────── */}
        {activeTab === 'tutor' && (
          <AITutorPanel
            simResult={simResult}
            tutorResponse={tutorResponse}
            loading={tutorLoading}
            onAsk={handleAskTutor}
            question={tutorQuestion}
            setQuestion={setTutorQuestion}
          />
        )}

        {/* ── MANIM (Show Me Why) ───────────────────────────────────── */}
        {activeTab === 'manim' && (
          <div className='space-y-6'>
            <ManimPlayer
              clip={manimClip}
              loading={manimLoading}
              concept={selectedConcept}
              onFetch={handleFetchManim}
            />
          </div>
        )}

        {/* ── CHALLENGES ───────────────────────────────────────────── */}
        {activeTab === 'challenges' && (
          <ChallengeView
            challenges={challenges}
            loading={challengeLoading}
            result={challengeResult}
            simResult={simResult}
            onSubmit={handleSubmitAnswer}
            onReload={handleLoadChallenges}
          />
        )}

        {/* ── MASTERY ──────────────────────────────────────────────── */}
        {activeTab === 'mastery' && (
          <MasteryView mastery={mastery} />
        )}

      </main>

      {/* FOOTER */}
      <footer className='border-t border-slate-900 py-4 text-center text-xs font-mono text-slate-600'>
        Eureka Forge · SIH26140 · Simulator computes. Everything else reads. · Powered by Qiskit Aer
      </footer>
    </div>
  );
}
