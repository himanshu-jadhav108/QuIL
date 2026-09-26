'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, ActiveTab } from '../components/Navbar';
import { BlochSphere } from '../components/BlochSphere';
import { Histogram } from '../components/Histogram';
import { CircuitCanvas } from '../components/CircuitCanvas';
import { ChallengeView } from '../components/ChallengeView';
import { MasteryView } from '../components/MasteryView';
import { ManimPlayer } from '../components/ManimPlayer';
import { AITutorPanel } from '../components/AITutorPanel';
import {
  SimulationResult,
  TutorResponse,
  Challenge,
  SubmitAnswerResponse,
  MasteryMap,
  ConceptName,
  EvaluationResult,
  ManimClip,
} from '../types/quantum';
import {
  evaluatePrediction,
  getTutorExplanation,
  getManimClip,
  listChallenges,
  submitAnswer,
  getMastery,
  checkHealth,
} from '../lib/api';
import {
  BrainCircuit,
  Cpu,
  Zap,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Award,
  PlayCircle,
  MessageSquare,
  Film,
} from 'lucide-react';

/* ── CONCEPT CONFIGURATION ────────────────────────────────────────── */
interface ConceptDetail {
  id: ConceptName;
  title: string;
  tagline: string;
  description: string;
  mathState: string;
  qubits: number;
  circuitVisual: string;
  gates: string;
}

const CONCEPTS: ConceptDetail[] = [
  {
    id: 'superposition',
    title: 'Superposition',
    tagline: 'Linear Combination of Orthogonal Basis States',
    description:
      'A Hadamard gate transforms the computational ground state |0⟩ into a balanced superposition state (|0⟩ + |1⟩)/√2. The qubit has no predetermined classical value prior to measurement.',
    mathState: '|ψ⟩ = (|0⟩ + |1⟩) / √2',
    qubits: 1,
    circuitVisual: '|0⟩ ──────[ H ]──────[ M ]──────> { 0 (50%), 1 (50%) }',
    gates: 'H ── M',
  },
  {
    id: 'measurement',
    title: 'Measurement',
    tagline: 'Wavefunction Collapse & Born Probability Rule',
    description:
      'Measurement projects the continuous superposition state onto a definite eigenvalue (|0⟩ or |1⟩). The quantum superposition is irreversibly collapsed.',
    mathState: 'P(|i⟩) = |⟨i|ψ⟩|²,  Σ P(|i⟩) = 1',
    qubits: 1,
    circuitVisual: '|+⟩ ──────────────[ M ]──────> Collapse to definite |0⟩ or |1⟩',
    gates: 'H ── M',
  },
  {
    id: 'entanglement',
    title: 'Entanglement',
    tagline: 'Non-Separable Multi-Qubit Bell State |Φ⁺⟩',
    description:
      'Hadamard on qubit 0 followed by a CNOT gate entangles two qubits into the Bell state |Φ⁺⟩. Measuring one qubit instantly correlates the state of the other.',
    mathState: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
    qubits: 2,
    circuitVisual: 'q₀: |0⟩ ───[ H ]───●───[ M ]───>\nq₁: |0⟩ ───────────X───[ M ]───>',
    gates: 'H, CX, M',
  },
];

/* ── DEFAULT PREDICTIONS ──────────────────────────────────────────── */
const DEFAULT_PREDICTIONS: Record<ConceptName, Record<string, number>> = {
  superposition: { '0': 80, '1': 20 },
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

  /* manim video clips */
  const [manimClip, setManimClip] = useState<ManimClip | null>(null);
  const [manimLoading, setManimLoading] = useState(false);
  const [showMeWhy, setShowMeWhy] = useState(false);

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

  /* Fetch pre-rendered Manim instructional video metadata */
  const handleFetchManim = useCallback(async () => {
    setManimLoading(true);
    try {
      const clip = await getManimClip(selectedConcept);
      setManimClip(clip);
    } catch {
      /* fallback to static asset handled gracefully in ManimPlayer */
    } finally {
      setManimLoading(false);
    }
  }, [selectedConcept]);

  useEffect(() => {
    handleFetchManim();
  }, [handleFetchManim]);

  /* Reset prediction and state when concept changes */
  const handleSelectConcept = useCallback((concept: ConceptName) => {
    setSelectedConcept(concept);
    setPrediction(DEFAULT_PREDICTIONS[concept]);
    setPredictionLocked(false);
    setSimResult(null);
    setEvaluation(null);
    setTutorResponse(null);
    setChallenges([]);
    setShowMeWhy(false);
    setTutorQuestion('');
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
    setActiveTab('results');
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
    } catch (e: unknown) {
      setSimError(e instanceof Error ? e.message : 'Simulation evaluation failed');
    } finally {
      setSimLoading(false);
    }
  }, [selectedConcept, prediction]);

  /* ── ASK QUIL TUTOR (Context-Aware Pre and Post Simulation) ────────── */
  const handleAskTutor = useCallback(
    async (questionText: string, mode: 'explain' | 'hint' | 'debug' = 'explain') => {
      setTutorLoading(true);
      try {
        const sum = Object.values(prediction).reduce((a, b) => a + b, 0) || 1;
        const probMap: Record<string, number> = {};
        Object.entries(prediction).forEach(([k, v]) => {
          probMap[k] = +(v / sum).toFixed(4);
        });

        const resp = await getTutorExplanation({
          concept: selectedConcept,
          simulation_result: simResult || undefined,
          prediction_probabilities: probMap,
          misconceptions: evaluation?.misconceptions,
          user_question: questionText || undefined,
          mode,
        });
        setTutorResponse(resp);
      } catch (err) {
        console.error('Tutor inquiry failed, providing grounded fallback:', err);
        setTutorResponse({
          concept: selectedConcept,
          explanation:
            selectedConcept === 'superposition'
              ? 'The Hadamard gate maps the ground state |0⟩ to an equal superposition (|0⟩ + |1⟩)/√2. By Born\'s rule, measuring yields |0⟩ or |1⟩ with equal 50% probability.'
              : selectedConcept === 'measurement'
              ? 'Quantum measurement is a non-unitary projective operation that collapses a superposition state into a single definite eigenbasis state.'
              : 'The Bell circuit entangles two qubits into the non-separable state (|00⟩ + |11⟩)/√2, ensuring perfectly correlated measurement outcomes.',
          key_insight: 'Quantum probabilities are governed by squared complex amplitudes under unitary evolution and projection.',
          next_step: 'Formulate your prediction or run the quantum experiment to verify with real simulator evidence.',
        });
      } finally {
        setTutorLoading(false);
      }
    },
    [selectedConcept, simResult, prediction, evaluation]
  );

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
      <main className='flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6'>

        {/* ══════════════════════════════════════════════════════════════
            1. HOME / WORKSPACE (Clean, Credible within 3 seconds)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className='space-y-6 animate-tab-fade'>
            {/* Header Banner */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                <img
                  src='/logo.png'
                  alt='QuIL Logo'
                  className='w-6 h-6 rounded object-contain border border-slate-700 bg-slate-900 p-0.5'
                />
                <span className='font-bold text-xs uppercase tracking-widest text-cyan-400 font-mono'>
                  QUIL
                </span>
                <span className='text-slate-600 font-mono'>·</span>
                <span className='text-xs font-mono text-slate-400'>
                  Quantum Intelligence Learning Lab
                </span>
              </div>
              <p className='text-xs text-slate-400 font-mono'>
                Students predict. The simulator proves. AI explains why.
              </p>
            </div>

            {/* Current Lesson Primary Card */}
            <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6'>
              <div className='flex items-center justify-between'>
                <span className='text-[11px] font-mono uppercase tracking-widest text-slate-400'>
                  CURRENT LESSON
                </span>
                <div className='flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800'>
                  {CONCEPTS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConcept(c.id)}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        selectedConcept === c.id
                          ? 'bg-slate-800 text-cyan-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-white'>
                  {currentConcept.title}
                </h1>
                <p className='text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl'>
                  {currentConcept.description}
                </p>
              </div>

              {/* Circuit Preview Visual */}
              <div className='space-y-2'>
                <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>
                  Canonical Circuit Architecture
                </div>
                <div className='p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre'>
                  {currentConcept.circuitVisual}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className='pt-2 flex items-center justify-between'>
                <button
                  onClick={() => setActiveTab('predict')}
                  className='flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors'
                >
                  <span>Formulate Prediction</span>
                  <ArrowRight className='w-4 h-4' />
                </button>
                <span className='text-xs font-mono text-slate-400'>
                  Step 1 of 4: Learn & Hypothesize
                </span>
              </div>
            </div>

            {/* Visual Concept Explanation (Pre-rendered Manim Instruction) */}
            <ManimPlayer
              clip={manimClip}
              loading={manimLoading}
              concept={selectedConcept}
              onFetch={handleFetchManim}
              mode='lesson'
              titleOverride={`Visual Explanation: ${currentConcept.title}`}
            />

            {/* Ask QuIL Interactive Learning Assistant */}
            <AITutorPanel
              simResult={simResult}
              tutorResponse={tutorResponse}
              loading={tutorLoading}
              onAsk={handleAskTutor}
              question={tutorQuestion}
              setQuestion={setTutorQuestion}
              misconceptionRule={evaluation?.misconceptions?.[0]?.rule}
              concept={selectedConcept}
              accuracyScore={evaluation?.comparison?.accuracy_score}
            />

            {/* Next Step Callout */}
            <div className='p-6 bg-[#0d1424] border border-cyan-800/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className='space-y-1 text-center sm:text-left'>
                <div className='text-xs font-mono uppercase tracking-widest text-cyan-400'>
                  Ready to test your quantum intuition?
                </div>
                <div className='text-sm text-slate-300'>
                  Formulate your hypothesis for this circuit and execute it on the Qiskit Aer quantum simulator.
                </div>
              </div>
              <button
                onClick={() => setActiveTab('predict')}
                className='flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap'
              >
                <span>Make Prediction →</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. PREDICTION ("What do you think will happen?")
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'predict' && (
          <div className='space-y-6 animate-tab-fade'>
            <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6'>
              {/* Question Header */}
              <div className='space-y-1 pb-4 border-b border-slate-800'>
                <div className='text-[11px] font-mono uppercase tracking-widest text-slate-400'>
                  LESSON: {currentConcept.title.toUpperCase()}
                </div>
                <h2 className='text-2xl font-bold text-white'>
                  What do you think will happen?
                </h2>
                <p className='text-xs text-slate-300 font-mono'>
                  Set your expected measurement probabilities for the circuit below.
                </p>
              </div>

              {/* Circuit Visual */}
              <div className='space-y-2'>
                <div className='text-[10px] font-mono uppercase tracking-wider text-slate-400'>
                  Circuit to be Executed:
                </div>
                <div className='p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre'>
                  {currentConcept.circuitVisual}
                </div>
              </div>

              {/* Prediction Probability Controls */}
              <div className='space-y-4 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-mono text-slate-300'>
                    Hypothesized Outcome Probabilities:
                  </span>
                  {/* Presets */}
                  <div className='flex gap-2'>
                    {selectedConcept === 'superposition' && (
                      <>
                        <button
                          onClick={() => setPrediction({ '0': 80, '1': 20 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: 80% |0⟩ (Definite)
                        </button>
                        <button
                          onClick={() => setPrediction({ '0': 50, '1': 50 })}
                          disabled={predictionLocked}
                          className='px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-700'
                        >
                          Preset: 50/50 Balanced
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedConcept !== 'entanglement' ? (
                  <div className='space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800'>
                    <div className='flex justify-between items-center text-sm font-mono'>
                      <span className='text-slate-300'>
                        |0⟩ Probability: <span className='text-cyan-300 font-bold'>{prediction['0'] ?? 50}%</span>
                      </span>
                      <span className='text-slate-300'>
                        |1⟩ Probability: <span className='text-indigo-300 font-bold'>{prediction['1'] ?? 50}%</span>
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

                    {/* Segment visual */}
                    <div className='flex h-3 rounded overflow-hidden border border-slate-800'>
                      <div
                        className='bg-cyan-500 transition-all duration-150'
                        style={{ width: `${prediction['0'] ?? 50}%` }}
                      />
                      <div
                        className='bg-indigo-500 flex-1 transition-all duration-150'
                      />
                    </div>
                  </div>
                ) : (
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800'>
                    {['00', '01', '10', '11'].map((state) => (
                      <div key={state} className='space-y-1'>
                        <div className='text-xs font-mono text-slate-300'>|{state}⟩ Probability</div>
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
                          className='w-full px-3 py-1.5 rounded bg-[#0d1424] border border-slate-700 text-sm font-mono text-white'
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className='flex items-center gap-3 pt-4 border-t border-slate-800'>
                {!predictionLocked ? (
                  <button
                    onClick={() => setPredictionLocked(true)}
                    className='px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors'
                  >
                    Lock Prediction
                  </button>
                ) : (
                  <div className='flex items-center gap-4 flex-wrap'>
                    <span className='px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono font-medium'>
                      Prediction recorded ✓
                    </span>
                    <button
                      onClick={handleRunEvaluation}
                      disabled={simLoading}
                      className='flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors'
                    >
                      <Zap className='w-4 h-4' />
                      <span>{simLoading ? 'Running quantum experiment…' : 'Run Experiment →'}</span>
                    </button>
                    <button
                      onClick={() => setPredictionLocked(false)}
                      className='text-slate-400 hover:text-slate-200 text-xs font-mono'
                    >
                      Change Prediction
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. SIMULATE (Circuit View & Run)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'circuit' && (
          <div className='space-y-6 animate-tab-fade'>
            <CircuitCanvas
              concept={selectedConcept}
              circuitDiagram={simResult?.circuit_diagram || ''}
            />

            <div className='flex items-center justify-between p-4 bg-[#0d1424] border border-slate-800 rounded-xl'>
              <div className='text-xs font-mono text-slate-300'>
                Qiskit Aer Simulator · Shots: 1,024
              </div>
              <button
                onClick={handleRunEvaluation}
                disabled={simLoading}
                className='flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors'
              >
                <Zap className='w-4 h-4' />
                <span>{simLoading ? 'Running quantum experiment…' : 'Run Experiment →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. UNDERSTAND (Comparison, Diagnosis, Tutor Insight, Show Me Why)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'results' && (
          <div className='space-y-6 animate-tab-fade'>
            {/* Running Experiment Banner */}
            {simLoading && (
              <div className='flex items-center justify-center gap-3 p-8 bg-[#0d1424] border border-slate-800 rounded-xl font-mono text-sm text-slate-300'>
                <div className='w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin' />
                <span>Running quantum experiment on Qiskit Aer…</span>
              </div>
            )}

            {simError && (
              <div className='flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs font-mono'>
                <AlertTriangle className='w-4 h-4 shrink-0 text-red-400' />
                <span>{simError}</span>
              </div>
            )}

            {simResult && !simLoading && (
              <div className='space-y-6'>
                {/* ── SECTION A: TWO-COLUMN COMPARISON ── */}
                <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-6 space-y-5'>
                  <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                    <div className='text-xs font-mono uppercase tracking-widest text-slate-400'>
                      SIMULATION RESULT & COMPARISON
                    </div>
                    <span className='text-xs font-mono text-slate-400'>
                      Qiskit Aer (1,024 Shots)
                    </span>
                  </div>

                  {/* Outcome Comparison Table */}
                  {evaluation?.comparison && (
                    <div className='space-y-4'>
                      <div className='overflow-hidden rounded-lg border border-slate-800 bg-slate-950'>
                        <table className='w-full text-left font-mono text-xs'>
                          <thead className='bg-slate-900/80 text-slate-400 border-b border-slate-800'>
                            <tr>
                              <th className='py-2.5 px-4 uppercase text-[10px]'>Outcome</th>
                              <th className='py-2.5 px-4 uppercase text-[10px] text-right'>Your Prediction</th>
                              <th className='py-2.5 px-4 uppercase text-[10px] text-right'>Simulator Result</th>
                              <th className='py-2.5 px-4 uppercase text-[10px] text-right'>Difference</th>
                              <th className='py-2.5 px-4 uppercase text-[10px] text-right'>Status</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-800/80'>
                            {evaluation.comparison.outcomes.map((o) => (
                              <tr key={o.outcome} className='hover:bg-slate-900/40'>
                                <td className='py-3 px-4 font-bold text-white text-sm'>|{o.outcome}⟩</td>
                                <td className='py-3 px-4 text-right text-indigo-300 font-medium'>
                                  {(o.predicted * 100).toFixed(0)}%
                                </td>
                                <td className='py-3 px-4 text-right text-cyan-300 font-bold'>
                                  {(o.simulated * 100).toFixed(1)}%
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${o.match ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {o.delta > 0 ? `+${(o.delta * 100).toFixed(1)}%` : `${(o.delta * 100).toFixed(1)}%`}
                                </td>
                                <td className='py-3 px-4 text-right'>
                                  {o.match ? (
                                    <span className='px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px]'>
                                      Match
                                    </span>
                                  ) : (
                                    <span className='px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400 text-[10px]'>
                                      Differed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Emphasized Difference Callout */}
                      <div
                        className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
                          evaluation.comparison.overall_match
                            ? 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                            : 'bg-amber-950/20 border-amber-800 text-amber-200'
                        }`}
                      >
                        <div className='flex items-center gap-2.5'>
                          {evaluation.comparison.overall_match ? (
                            <CheckCircle2 className='w-5 h-5 text-emerald-400 shrink-0' />
                          ) : (
                            <XCircle className='w-5 h-5 text-amber-400 shrink-0' />
                          )}
                          <span className='font-bold text-base'>
                            {evaluation.comparison.overall_match
                              ? 'Your prediction matches the simulation.'
                              : 'Your prediction differs from the simulation.'}
                          </span>
                        </div>
                        <span className='text-xs font-mono opacity-80'>
                          Accuracy: {(evaluation.comparison.accuracy_score * 100).toFixed(0)}% (±{(evaluation.comparison.tolerance * 100).toFixed(0)}% tolerance)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Side-by-side Histogram & Bloch Sphere Projections */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2'>
                    <Histogram result={simResult} prediction={prediction} />
                    <BlochSphere result={simResult} />
                  </div>
                </div>

                {/* ── SECTION B: MISCONCEPTION DETECTED ── */}
                {evaluation?.misconceptions && evaluation.misconceptions.length > 0 && (
                  <div className='bg-[#0d1424] border border-amber-800/60 rounded-xl p-6 space-y-4'>
                    <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold font-mono tracking-wider text-amber-400 uppercase'>
                          MISCONCEPTION DETECTED
                        </span>
                        <span className='text-slate-600'>·</span>
                        <span className='text-xs font-mono text-slate-300'>
                          {evaluation.misconceptions[0].rule} · {currentConcept.title}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-2 text-sm text-slate-200 leading-relaxed'>
                      <p className='text-slate-300 font-medium'>
                        {selectedConcept === 'superposition' && Object.values(prediction).some((v) => v >= 80)
                          ? 'Your prediction expected a mostly definite result, while the simulation produced an approximately balanced distribution. This suggests a misconception about how the Hadamard gate changes the qubit state.'
                          : evaluation.misconceptions[0].learner_explanation}
                      </p>
                      <div className='p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-amber-300'>
                        {evaluation.misconceptions[0].evidence}
                      </div>
                    </div>

                    {/* Remediation Action Controls */}
                    <div className='flex items-center gap-3 pt-2 flex-wrap'>
                      <button
                        onClick={() => {
                          setShowMeWhy(true);
                          setTimeout(() => {
                            document.getElementById('show-me-why-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className='flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors'
                      >
                        <PlayCircle className='w-4 h-4' />
                        <span>▶ Show Me Why</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAskTutor('Why was my prediction wrong?');
                          setTimeout(() => {
                            document.getElementById('ask-quil-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className='flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-colors'
                      >
                        <MessageSquare className='w-4 h-4 text-cyan-400' />
                        <span>Ask QuIL: Why was my prediction wrong?</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── SECTION C: SHOW ME WHY (Visual Explanation & Manim Remediation) ── */}
                {showMeWhy ? (
                  <div id='show-me-why-section' className='space-y-4 animate-tab-fade'>
                    <div className='flex items-center justify-between px-1'>
                      <div className='text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2'>
                        <PlayCircle className='w-4 h-4' />
                        <span>Remediation Video Player</span>
                      </div>
                      <button
                        onClick={() => setShowMeWhy(false)}
                        className='text-xs font-mono text-slate-400 hover:text-slate-200'
                      >
                        Close Video
                      </button>
                    </div>

                    <ManimPlayer
                      clip={manimClip}
                      loading={manimLoading}
                      concept={selectedConcept}
                      onFetch={handleFetchManim}
                      mode='remediation'
                      titleOverride={`Why did this happen? — ${currentConcept.title} Remediation`}
                    />

                    {/* Analytical State-Vector Derivation */}
                    <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-3'>
                      <div className='flex items-center justify-between pb-2 border-b border-slate-800'>
                        <h4 className='text-xs font-bold font-mono uppercase tracking-wider text-slate-200'>
                          Mathematical State Vector Evolution
                        </h4>
                        <span className='text-[10px] font-mono text-slate-400'>
                          Unitary Evolution & Born Projection
                        </span>
                      </div>

                      <div className='p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-line'>
                        {selectedConcept === 'superposition' && (
                          <>
                            <div className='text-cyan-400 font-bold'>1. Initial State:</div>
                            <div>|ψ₀⟩ = |0⟩  (North pole on Bloch sphere, θ = 0)</div>
                            <div className='text-cyan-400 font-bold pt-2'>2. Hadamard Gate Transformation:</div>
                            <div>H = (1/√2) [ [1,  1], [1, -1] ]</div>
                            <div>H|0⟩ = (|0⟩ + |1⟩) / √2 = |+⟩  (Equator on Bloch sphere, θ = π/2, ϕ = 0)</div>
                            <div className='text-cyan-400 font-bold pt-2'>3. Projective Measurement (Born Rule):</div>
                            <div>P(0) = |⟨0|+⟩|² = |1/√2|² = 1/2 = 50.0%</div>
                            <div>P(1) = |⟨1|+⟩|² = |1/√2|² = 1/2 = 50.0%</div>
                          </>
                        )}
                        {selectedConcept === 'measurement' && (
                          <>
                            <div className='text-cyan-400 font-bold'>1. Superposition Prior to Measurement:</div>
                            <div>|ψ⟩ = (|0⟩ + |1⟩) / √2</div>
                            <div className='text-cyan-400 font-bold pt-2'>2. Measurement Operator Projection:</div>
                            <div>M projects |ψ⟩ onto |0⟩ with P=0.5 or |1⟩ with P=0.5.</div>
                            <div className='text-cyan-400 font-bold pt-2'>3. Post-Measurement State:</div>
                            <div>State collapses irreversibly: any subsequent measurement yields the exact same outcome with P=1.0.</div>
                          </>
                        )}
                        {selectedConcept === 'entanglement' && (
                          <>
                            <div className='text-cyan-400 font-bold'>1. Independent Qubits:</div>
                            <div>|ψ₀⟩ = |00⟩</div>
                            <div className='text-cyan-400 font-bold pt-2'>2. Hadamard on q₀ creates Superposition:</div>
                            <div>(H ⊗ I)|00⟩ = (|00⟩ + |10⟩) / √2</div>
                            <div className='text-cyan-400 font-bold pt-2'>3. CNOT Entangles q₀ and q₁:</div>
                            <div>CNOT((|00⟩ + |10⟩)/√2) = (|00⟩ + |11⟩) / √2 = |Φ⁺⟩  (Bell State)</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='p-5 bg-[#0d1424] border border-cyan-800/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4'>
                    <div className='space-y-1 text-center sm:text-left'>
                      <div className='text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 justify-center sm:justify-start'>
                        <PlayCircle className='w-4 h-4' />
                        <span>Visual Remediation Available</span>
                      </div>
                      <p className='text-xs text-slate-300'>
                        Watch the dedicated pre-rendered Manim animation explaining the geometric state evolution for {currentConcept.title}.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowMeWhy(true);
                        setTimeout(() => {
                          document.getElementById('show-me-why-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0'
                    >
                      <PlayCircle className='w-4 h-4' />
                      <span>▶ Show Me Why</span>
                    </button>
                  </div>
                )}

                {/* ── SECTION D: ASK QUIL (Contextual Post-Simulation Tutor) ── */}
                <div id='ask-quil-section'>
                  <AITutorPanel
                    simResult={simResult}
                    tutorResponse={tutorResponse}
                    loading={tutorLoading}
                    onAsk={handleAskTutor}
                    question={tutorQuestion}
                    setQuestion={setTutorQuestion}
                    misconceptionRule={evaluation?.misconceptions?.[0]?.rule}
                    concept={selectedConcept}
                    accuracyScore={evaluation?.comparison?.accuracy_score}
                  />
                </div>

                {/* ── SECTION E: RETRY & NEXT ACTIONS ── */}
                <div className='flex flex-wrap items-center gap-3 pt-2'>
                  <button
                    onClick={() => {
                      setPredictionLocked(false);
                      setActiveTab('predict');
                    }}
                    className='flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors'
                  >
                    <RotateCcw className='w-4 h-4' />
                    <span>Try Again with a New Prediction</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('challenges')}
                    className='flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors'
                  >
                    <Award className='w-4 h-4 text-cyan-400' />
                    <span>Test Concept in Challenge →</span>
                  </button>
                </div>
              </div>
            )}

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
                  Run Experiment Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. CHALLENGES (Deterministic Verification)
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
            6. MASTERY MAP
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'mastery' && (
          <div className='animate-tab-fade'>
            <MasteryView mastery={mastery} />
          </div>
        )}

      </main>

      {/* Scientific Lab Footer */}
      <footer className='border-t border-slate-900 bg-[#060910] py-3.5 text-center text-xs font-mono text-slate-500'>
        <div className='max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2'>
          <span>Eureka Forge · SIH26140 · QuIL: Quantum Intelligence Learning Lab</span>
          <span>Simulator computes. Everything else reads. · Powered by Qiskit Aer</span>
        </div>
      </footer>
    </div>
  );
}
