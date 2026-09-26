'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  EvaluationResult,
} from '../types/quantum';
import {
  evaluatePrediction,
  getTutorExplanation,
  getManimClip,
  getTrace,
  listChallenges,
  submitAnswer,
  getMastery,
  checkHealth,
} from '../lib/api';
import {
  Atom,
  BrainCircuit,
  Cpu,
  Layers,
  PlayCircle,
  Zap,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

/* ── CONCEPT CONFIGURATION ────────────────────────────────────────── */
interface ConceptDetail {
  id: ConceptName;
  title: string;
  tagline: string;
  description: string;
  mathState: string;
  qubits: number;
  gates: string;
  keyMisconception: string;
}

const CONCEPTS: ConceptDetail[] = [
  {
    id: 'superposition',
    title: 'Quantum Superposition',
    tagline: 'Linear Combination of Orthogonal Basis States',
    description:
      'Applying a Hadamard gate maps the computational ground state |0⟩ into an equatorial superposition state |+⟩. The system has no hidden deterministic outcome prior to measurement.',
    mathState: '|ψ⟩ = (|0⟩ + |1⟩) / √2',
    qubits: 1,
    gates: 'H ── M',
    keyMisconception: 'M1: Superposition treated as hidden classical variable',
  },
  {
    id: 'measurement',
    tagline: 'Wavefunction Collapse & Born Probability Rule',
    title: 'Quantum Measurement',
    description:
      'Measurement projects the continuous superposition state onto a classical eigenvalue (|0⟩ or |1⟩) with probability P(i) = |⟨i|ψ⟩|². The quantum coherence is irreversibly destroyed.',
    mathState: 'P(|i⟩) = |⟨i|ψ⟩|²,  Σ P(|i⟩) = 1',
    qubits: 1,
    gates: 'H ── M',
    keyMisconception: 'M2: Measurement thought to preserve superposition amplitude',
  },
  {
    id: 'entanglement',
    title: 'Quantum Entanglement',
    tagline: 'Non-Separable Multi-Qubit Bell State |Φ⁺⟩',
    description:
      'Hadamard on qubit 0 followed by a CNOT gate entangles two qubits into the Bell state |Φ⁺⟩. Measuring one qubit collapses the entire joint state instantly with perfect correlation.',
    mathState: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
    qubits: 2,
    gates: 'q₀: H ─●─ M \nq₁: ───X─ M',
    keyMisconception: 'M3: Entanglement treated as independent product state',
  },
];

/* ── DEFAULT PREDICTIONS ──────────────────────────────────────────── */
const DEFAULT_PREDICTIONS: Record<ConceptName, Record<string, number>> = {
  superposition: { '0': 50, '1': 50 },
  measurement: { '0': 50, '1': 50 },
  entanglement: { '00': 50, '01': 0, '10': 0, '11': 50 },
};

export default function Home() {
  /* navigation */
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedConcept, setSelectedConcept] = useState<ConceptName>('superposition');

  /* backend health */
  const [backendReady, setBackendReady] = useState(false);
  const [healthError, setHealthError] = useState('');

  /* simulation & evaluation */
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState('');

  /* learner hypothesis (percentages) */
  const [prediction, setPrediction] = useState<Record<string, number>>(DEFAULT_PREDICTIONS.superposition);
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

  /* active concept detail */
  const currentConcept = useMemo(
    () => CONCEPTS.find((c) => c.id === selectedConcept) || CONCEPTS[0],
    [selectedConcept]
  );

  /* Reset prediction when concept changes */
  const handleSelectConcept = useCallback((concept: ConceptName) => {
    setSelectedConcept(concept);
    setPrediction(DEFAULT_PREDICTIONS[concept]);
    setPredictionLocked(false);
    setSimResult(null);
    setEvaluation(null);
    setTutorResponse(null);
    setManimClip(null);
    setChallenges([]);
  }, []);

  /* ── BOOT: health check with auto-reconnect ── */
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
          setHealthError('Connecting to Quantum Engine... (Cold-start initialization in progress)');
        } else {
          setHealthError(`Connecting to Quantum Engine (attempt ${attempts})... Spinning up Qiskit Aer simulator.`);
        }
        timer = setTimeout(probe, 4000);
      }
    };

    probe();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  /* ── EVALUATE PREDICTION (Core Scientific Workflow) ───────────────── */
  const handleRunEvaluation = useCallback(async () => {
    setSimLoading(true);
    setSimError('');
    try {
      // Normalize predictions to probabilities (0..1)
      const sum = Object.values(prediction).reduce((a, b) => a + b, 0) || 1;
      const probMap: Record<string, number> = {};
      Object.entries(prediction).forEach(([k, v]) => {
        probMap[k] = +(v / sum).toFixed(4);
      });

      const evalRes = await evaluatePrediction(selectedConcept, probMap, 1024);
      setEvaluation(evalRes);
      setSimResult(evalRes.simulation);
      setTrace(evalRes.trace || []);

      // If misconception was diagnosed, pre-populate tutor inquiry
      if (evalRes.misconceptions.length > 0) {
        const primaryMisconception = evalRes.misconceptions[0];
        setTutorQuestion(
          `Why did my hypothesis differ from the simulator? (${primaryMisconception.learner_explanation})`
        );
      }
    } catch (e: unknown) {
      setSimError(e instanceof Error ? e.message : 'Simulation evaluation failed');
    } finally {
      setSimLoading(false);
    }
  }, [selectedConcept, prediction]);

  /* ── TUTOR ──────────────────────────────────────────────────────── */
  const handleAskTutor = useCallback(
    async (question: string) => {
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
    },
    [simResult]
  );

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

  const handleSubmitAnswer = useCallback(
    async (challengeId: string, answerId: string) => {
      if (!simResult) return;
      try {
        const res = await submitAnswer({
          challenge_id: challengeId,
          selected_option_id: answerId,
          concept: simResult.concept,
          simulation_result: simResult,
        });
        setChallengeResult(res);
        const m = await getMastery();
        setMastery(m);
      } catch {
        /* noop */
      }
    },
    [simResult]
  );

  /* ── MASTERY BOOT ───────────────────────────────────────────────── */
  useEffect(() => {
    getMastery().then(setMastery).catch(() => {});
  }, []);

  /* ── TAB SIDE EFFECTS ───────────────────────────────────────────── */
  useEffect(() => {
    if (activeTab === 'challenges' && challenges.length === 0) handleLoadChallenges();
    if (activeTab === 'mastery') getMastery().then(setMastery).catch(() => {});
    if (activeTab === 'manim' && !manimClip && simResult) handleFetchManim();
  }, [activeTab]); // eslint-disable-line

  return (
    <div className='flex flex-col min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-cyan-500/20'>
      {/* Precision Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simulatorReady={backendReady}
        selectedConcept={selectedConcept}
        onSelectConcept={handleSelectConcept}
      />

      {/* Backend cold-start notification */}
      {healthError && (
        <div className='flex items-center justify-between px-6 py-2 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-xs font-mono'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-3.5 h-3.5 shrink-0 text-amber-400' />
            <span>{healthError}</span>
          </div>
          <span className='text-[10px] text-amber-500'>Qiskit Aer runtime initializing</span>
        </div>
      )}

      {/* Main Container */}
      <main className='flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6'>

        {/* ══════════════════════════════════════════════════════════════
            1. WORKSPACE / DASHBOARD
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className='space-y-6 animate-tab-fade'>
            {/* Scientific Workspace Header (Unified Learning Objective & Workflow) */}
            <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-6 sm:p-7 space-y-5'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-5'>
                <div className='flex items-start gap-4'>
                  <img
                    src='/logo.png'
                    alt='QuIL Logo'
                    className='w-12 h-12 rounded-lg object-contain border border-slate-700/80 bg-slate-900 p-1 shrink-0'
                  />
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2.5 flex-wrap'>
                      <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-white'>
                        Quantum Intelligence Learning Lab
                      </h1>
                      <span className='px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-[11px] font-mono'>
                        SIH26140
                      </span>
                      <span className='px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono'>
                        Qiskit Aer 1,024 Shots
                      </span>
                    </div>
                    <p className='text-sm text-slate-300 font-medium'>
                      Students formulate hypotheses. The quantum simulator computes ground truth. AI diagnoses misconceptions.
                    </p>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className='flex items-center gap-3 shrink-0'>
                  <button
                    onClick={() => setActiveTab('predict')}
                    className='flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors'
                  >
                    <span>Start Experiment</span>
                    <ArrowRight className='w-4 h-4' />
                  </button>
                </div>
              </div>

              {/* Combined Active Learning Objective & State Indicator */}
              <div className='pt-4 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center'>
                <div className='lg:col-span-2 space-y-1.5'>
                  <div className='flex items-center gap-2'>
                    <span className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>
                      Active Learning Objective
                    </span>
                    <span className='text-[10px] font-mono text-cyan-400 border border-cyan-800/60 bg-cyan-950/40 px-1.5 py-0.5 rounded'>
                      {currentConcept.qubits} Qubit · {currentConcept.gates.replace('\n', ' ')}
                    </span>
                  </div>
                  <h2 className='text-base font-bold text-white'>{currentConcept.title}</h2>
                  <p className='text-xs text-slate-300 leading-relaxed max-w-2xl'>{currentConcept.description}</p>
                </div>

                <div className='p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 text-center lg:text-right'>
                  <div className='text-[10px] text-slate-400 mb-1 uppercase tracking-wider'>State Vector Target</div>
                  <div>{currentConcept.mathState}</div>
                </div>
              </div>
            </div>

            {/* Curriculum Concept Selector */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xs font-mono uppercase tracking-wider text-slate-400'>
                  Curriculum Modules
                </h3>
                <span className='text-xs text-slate-400 font-mono'>Click to switch module</span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {CONCEPTS.map((c) => {
                  const isSelected = selectedConcept === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConcept(c.id)}
                      className={`cursor-pointer rounded-xl border p-5 space-y-3 transition-all ${
                        isSelected
                          ? 'bg-[#0d1424] border-cyan-500/80 shadow-sm'
                          : 'bg-[#0d1424] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {isSelected ? '● Active Module' : 'Module'}
                        </span>
                        <span className='text-xs font-mono text-slate-400'>{c.qubits} Qubit</span>
                      </div>
                      <div>
                        <h4 className='font-bold text-sm text-white mb-1'>{c.title}</h4>
                        <p className='text-xs text-slate-400 leading-relaxed line-clamp-2'>
                          {c.tagline}
                        </p>
                      </div>
                      <div className='pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400'>
                        <span>Target: {c.gates.replace('\n', ' ')}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. PREDICT PHASE (Hypothesis Formulation)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'predict' && (
          <div className='space-y-6 animate-tab-fade'>
            {/* Header */}
            <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
                  <BrainCircuit className='w-4 h-4' />
                </div>
                <div>
                  <h2 className='text-base font-bold text-white'>
                    Phase 1: Formulate Your Hypothesis
                  </h2>
                  <p className='text-xs text-slate-400 font-mono'>
                    Scientific Method Step: Predict outcomes before running the physical simulation
                  </p>
                </div>
              </div>
              <span className='text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400'>
                Target: {currentConcept.title}
              </span>
            </div>

            {/* Experiment Context Card */}
            <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-4'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80'>
                <div>
                  <h3 className='text-sm font-semibold text-slate-200'>Experimental Context</h3>
                  <p className='text-xs text-slate-300 mt-1 max-w-2xl'>{currentConcept.description}</p>
                </div>
                <div className='p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 whitespace-nowrap self-start md:self-center'>
                  {currentConcept.mathState}
                </div>
              </div>

              {/* Hypothesis Sliders / Inputs */}
              <div className='space-y-5 pt-2'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-xs font-mono uppercase tracking-wider text-slate-400'>
                    Hypothesized Basis State Probabilities (%)
                  </h4>
                  <div className='flex gap-2'>
                    {selectedConcept === 'entanglement' ? (
                      <>
                        <button
                          onClick={() => setPrediction({ '00': 50, '01': 0, '10': 0, '11': 50 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: Bell State (50/50)
                        </button>
                        <button
                          onClick={() => setPrediction({ '00': 25, '01': 25, '10': 25, '11': 25 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: Independent Mix
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setPrediction({ '0': 50, '1': 50 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: Balanced 50/50
                        </button>
                        <button
                          onClick={() => setPrediction({ '0': 100, '1': 0 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: Deterministic |0⟩
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Single Qubit Prediction Slider */}
                {selectedConcept !== 'entanglement' ? (
                  <div className='space-y-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800'>
                    <div className='flex justify-between items-center text-sm font-mono'>
                      <span className='text-slate-300'>
                        |0⟩ Probability:{' '}
                        <span className='text-cyan-300 font-bold text-base'>{prediction['0'] ?? 50}%</span>
                      </span>
                      <span className='text-slate-300'>
                        |1⟩ Probability:{' '}
                        <span className='text-indigo-300 font-bold text-base'>{prediction['1'] ?? 50}%</span>
                      </span>
                    </div>

                    <input
                      type='range'
                      min={0}
                      max={100}
                      value={prediction['0'] ?? 50}
                      onChange={(e) => {
                        const val = +e.target.value;
                        setPrediction({ '0': val, '1': 100 - val });
                      }}
                      disabled={predictionLocked}
                      className='w-full accent-cyan-500 cursor-pointer disabled:cursor-not-allowed'
                    />

                    {/* Visual Segment Bar */}
                    <div className='flex h-4 rounded overflow-hidden border border-slate-700'>
                      <div
                        className='bg-cyan-500 transition-all duration-150 flex items-center justify-center text-[10px] font-mono text-slate-950 font-bold'
                        style={{ width: `${prediction['0'] ?? 50}%` }}
                      >
                        {(prediction['0'] ?? 50) > 15 ? `${prediction['0'] ?? 50}%` : ''}
                      </div>
                      <div
                        className='bg-indigo-500 flex-1 transition-all duration-150 flex items-center justify-center text-[10px] font-mono text-white font-bold'
                      >
                        {(prediction['1'] ?? 50) > 15 ? `${prediction['1'] ?? 50}%` : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Two Qubit Prediction Grid */
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800'>
                    {['00', '01', '10', '11'].map((state) => (
                      <div key={state} className='space-y-1.5'>
                        <div className='text-xs font-mono text-slate-300'>
                          |{state}⟩ Probability
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <input
                            type='number'
                            min={0}
                            max={100}
                            value={prediction[state] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, +e.target.value));
                              setPrediction((prev) => ({ ...prev, [state]: val }));
                            }}
                            disabled={predictionLocked}
                            className='w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50'
                          />
                          <span className='text-xs font-mono text-slate-400'>%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className='text-[11px] font-mono text-slate-400 flex items-center gap-2'>
                  <HelpCircle className='w-3.5 h-3.5 text-slate-400' />
                  <span>
                    Scientific protocol: Once locked, the hypothesis cannot be modified until the Qiskit Aer simulator computes the true statevector.
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-3 pt-4 border-t border-slate-800/80'>
                <button
                  onClick={() => {
                    setPredictionLocked(true);
                    setActiveTab('circuit');
                  }}
                  className='flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors'
                >
                  <span>{predictionLocked ? 'Hypothesis Recorded ✓' : 'Lock Hypothesis & Build Circuit'}</span>
                  <ArrowRight className='w-4 h-4' />
                </button>

                {predictionLocked && (
                  <button
                    onClick={() => setPredictionLocked(false)}
                    className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors'
                  >
                    <RotateCcw className='w-3.5 h-3.5' />
                    <span>Unlock & Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. CIRCUIT LAB PHASE
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'circuit' && (
          <div className='space-y-6 animate-tab-fade'>
            <CircuitCanvas
              concept={selectedConcept}
              circuitDiagram={simResult?.circuit_diagram || ''}
            />

            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d1424] border border-slate-800 rounded-xl p-4'>
              <div className='flex items-center gap-3 text-xs font-mono text-slate-300'>
                <div className='w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50' />
                <span>Compilation target: Qiskit Aer Simulator · Shots: 1,024</span>
              </div>

              <div className='flex items-center gap-3 w-full sm:w-auto'>
                <button
                  onClick={() => {
                    setActiveTab('results');
                    handleRunEvaluation();
                  }}
                  disabled={simLoading}
                  className='flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50'
                >
                  <Zap className='w-4 h-4' />
                  <span>{simLoading ? 'Simulating on Aer...' : 'Run on Qiskit Aer Simulator →'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. EVIDENCE & COMPARE (Simulator Ground Truth vs Hypothesis)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'results' && (
          <div className='space-y-6 animate-tab-fade'>
            {/* Simulator Loading State */}
            {simLoading && (
              <div className='flex items-center gap-3 p-6 bg-[#0d1424] border border-slate-800 rounded-xl'>
                <div className='w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin' />
                <span className='text-slate-300 font-mono text-xs'>
                  Transpiling canonical circuit to Qiskit Aer backend and sampling 1,024 measurement shots...
                </span>
              </div>
            )}

            {/* Simulation Error */}
            {simError && (
              <div className='flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs font-mono'>
                <AlertTriangle className='w-4 h-4 shrink-0 text-red-400' />
                <span>{simError}</span>
              </div>
            )}

            {/* Results Display */}
            {simResult && !simLoading && (
              <div className='space-y-6'>
                {/* Comparison Header Summary */}
                {evaluation?.comparison && (
                  <div
                    className={`p-5 rounded-xl border ${
                      evaluation.comparison.overall_match
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                        : 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                    }`}
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        {evaluation.comparison.overall_match ? (
                          <CheckCircle2 className='w-5 h-5 text-emerald-400 shrink-0' />
                        ) : (
                          <XCircle className='w-5 h-5 text-amber-400 shrink-0' />
                        )}
                        <div>
                          <div className='text-sm font-bold'>
                            {evaluation.comparison.overall_match
                              ? 'Hypothesis Verified: Simulator Confirms Prediction'
                              : 'Hypothesis Mismatch: Simulator Diverges from Prediction'}
                          </div>
                          <div className='text-xs font-mono opacity-90 mt-0.5'>
                            {evaluation.comparison.summary}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-4 text-xs font-mono shrink-0'>
                        <div className='text-right'>
                          <div className='text-[10px] opacity-75 uppercase'>Accuracy Score</div>
                          <div className='text-base font-bold'>
                            {(evaluation.comparison.accuracy_score * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className='text-right border-l border-slate-700/60 pl-4'>
                          <div className='text-[10px] opacity-75 uppercase'>Tolerance Window</div>
                          <div className='text-base font-bold'>
                            ±{(evaluation.comparison.tolerance * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Data Visualizers: Side-by-Side Histogram + Bloch Sphere */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <Histogram result={simResult} prediction={prediction} />
                  <BlochSphere result={simResult} />
                </div>

                {/* Misconception Diagnostic Engine Output */}
                {evaluation?.misconceptions && evaluation.misconceptions.length > 0 && (
                  <div className='bg-[#0d1424] border border-amber-800/50 rounded-xl p-5 space-y-4'>
                    <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400'>
                          <AlertTriangle className='w-3.5 h-3.5' />
                        </div>
                        <div>
                          <h4 className='text-xs font-semibold uppercase tracking-wider text-amber-300'>
                            Diagnostic Engine: Observed Misconception
                          </h4>
                          <p className='text-[11px] text-slate-400 font-mono'>
                            Automated rule evaluation (M1–M4) triggered by experimental divergence
                          </p>
                        </div>
                      </div>
                      <span className='px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono'>
                        Rule {evaluation.misconceptions[0].rule} · {(evaluation.misconceptions[0].confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono'>
                      <div className='p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5'>
                        <div className='text-slate-400 uppercase text-[10px]'>Empirical Evidence</div>
                        <div className='text-slate-200 leading-relaxed'>
                          {evaluation.misconceptions[0].evidence}
                        </div>
                      </div>

                      <div className='p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5'>
                        <div className='text-cyan-400 uppercase text-[10px]'>Physical Principle</div>
                        <div className='text-slate-200 leading-relaxed'>
                          {evaluation.misconceptions[0].learner_explanation}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 pt-2'>
                      <button
                        onClick={() => setActiveTab('tutor')}
                        className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors'
                      >
                        <BrainCircuit className='w-3.5 h-3.5 text-cyan-400' />
                        <span>Ask AI Tutor to Explain Misconception →</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('manim')}
                        className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors'
                      >
                        <PlayCircle className='w-3.5 h-3.5 text-cyan-400' />
                        <span>Show Me Why (Visual Proof) →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Next Step Navigations */}
                <div className='flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800/80'>
                  <button
                    onClick={() => setActiveTab('tutor')}
                    className='flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors'
                  >
                    <span>Ask the Tutor Why</span>
                    <ArrowRight className='w-4 h-4' />
                  </button>

                  <button
                    onClick={() => setActiveTab('manim')}
                    className='text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 py-1 px-2'
                  >
                    <PlayCircle className='w-3.5 h-3.5 text-slate-500' />
                    <span>Watch Geometric Video (Show Me Why) →</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('challenges')}
                    className='text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 py-1 px-2'
                  >
                    <Layers className='w-3.5 h-3.5 text-slate-500' />
                    <span>Test Concept in Challenge →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!simResult && !simLoading && (
              <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-12 text-center space-y-4'>
                <Cpu className='w-8 h-8 text-slate-500 mx-auto' />
                <div className='space-y-1'>
                  <h3 className='text-sm font-semibold text-slate-300'>No Simulation Evidence Yet</h3>
                  <p className='text-xs text-slate-400 font-mono max-w-md mx-auto'>
                    Formulate your hypothesis first, then execute the circuit on the Qiskit Aer backend to generate comparative evidence.
                  </p>
                </div>
                <button
                  onClick={handleRunEvaluation}
                  className='px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors'
                >
                  Run Simulation Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. GROUNDED AI TUTOR
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'tutor' && (
          <div className='animate-tab-fade'>
            <AITutorPanel
              simResult={simResult}
              tutorResponse={tutorResponse}
              loading={tutorLoading}
              onAsk={handleAskTutor}
              question={tutorQuestion}
              setQuestion={setTutorQuestion}
              misconceptionRule={evaluation?.misconceptions?.[0]?.rule || null}
              concept={selectedConcept}
              onNavigateToResults={() => setActiveTab('results')}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            6. SHOW ME WHY (Manim Video Engine)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'manim' && (
          <div className='animate-tab-fade'>
            <ManimPlayer
              clip={manimClip}
              loading={manimLoading}
              concept={selectedConcept}
              onFetch={handleFetchManim}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            7. CHALLENGES (Deterministic Verification)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'challenges' && (
          <div className='animate-tab-fade'>
            <ChallengeView
              challenges={challenges}
              loading={challengeLoading}
              result={challengeResult}
              simResult={simResult}
              onSubmit={handleSubmitAnswer}
              onReload={handleLoadChallenges}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            8. MASTERY MAP
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'mastery' && (
          <div className='animate-tab-fade'>
            <MasteryView mastery={mastery} />
          </div>
        )}

      </main>

      {/* Scientific Lab Footer */}
      <footer className='border-t border-slate-900 bg-[#060910] py-3.5 text-center text-xs font-mono text-slate-500'>
        <div className='max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2'>
          <span>Eureka Forge · SIH26140 · QuIL: Quantum Intelligence Learning Lab</span>
          <span>Simulator computes. Everything else reads. · Powered by Qiskit Aer</span>
        </div>
      </footer>
    </div>
  );
}
