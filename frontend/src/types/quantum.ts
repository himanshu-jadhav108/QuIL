// ─── Core Types ────────────────────────────────────────────────────────────
export type ConceptName = 'superposition' | 'measurement' | 'entanglement';
export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CX' | 'S' | 'T' | 'M';
export type MasteryLevel = 'Learning' | 'Practicing' | 'Mastered';

export interface Gate {
  gate: GateType;
  target: number;
  control?: number | null;
  params?: number[];
}

export interface CanonicalCircuit {
  schema_version: string;
  qubits: number;
  gates: Gate[];
  label?: string | null;
  concept?: string | null;
}

// ─── Simulation ─────────────────────────────────────────────────────────────
export interface TraceStep {
  step: number;
  event: string;
  state_label?: string | null;
  statevector?: number[][] | null;
}

export interface SimulationResult {
  // Simplified surface used by the frontend
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  num_qubits: number;
  num_shots: number;
  circuit_diagram: string;
  gates_applied: string[];
  concept: ConceptName;
  execution_time_ms: number;
  // Optional rich fields from backend schema
  schema_version?: string;
  circuit?: CanonicalCircuit;
  shots?: number;
  final_statevector?: number[][] | null;
  trace?: TraceStep[];
  backend?: string;
  error?: string | null;
}

// ─── Comparison & Diagnostics ──────────────────────────────────────────────
export interface OutcomeComparison {
  outcome: string;
  predicted: number;
  simulated: number;
  delta: number;
  match: boolean;
}

export interface ComparisonResult {
  tolerance: number;
  overall_match: boolean;
  outcomes: OutcomeComparison[];
  accuracy_score: number;
  summary: string;
}

export interface MisconceptionResult {
  rule: 'M1' | 'M2' | 'M3' | 'M4' | string;
  triggered: boolean;
  confidence: number;
  evidence: string;
  learner_explanation: string;
  remediation_concept: string;
  suggested_challenge?: string | null;
  manim_clip_id?: string | null;
}

export interface EvaluationResult {
  concept: ConceptName;
  simulation: SimulationResult;
  comparison: ComparisonResult;
  misconceptions: MisconceptionResult[];
  trace: TraceStep[];
}

// ─── Tutor ───────────────────────────────────────────────────────────────────
export interface TutorRequest {
  concept: ConceptName;
  simulation_result?: SimulationResult | null;
  user_question?: string;
  prediction_probabilities?: Record<string, number> | null;
  misconceptions?: MisconceptionResult[] | null;
  mode?: 'explain' | 'hint' | 'debug';
}

export interface TutorResponse {
  concept: ConceptName;
  explanation: string;
  key_insight: string;
  next_step: string;
  misconception_detected?: string | null;
  grounded_evidence?: Record<string, unknown>;
  suggested_actions?: string[];
}

// ─── Manim ───────────────────────────────────────────────────────────────────
export interface ManimClip {
  clip_id: string;
  title: string;
  concept: ConceptName;
  description: string;
  duration_sec: number;
  video_url?: string | null;
  key_takeaways: string[];
  fallback_explanation: string;
}

// ─── Challenges ──────────────────────────────────────────────────────────────
export interface ChallengeOption {
  id: string;
  text: string;
}

export interface Challenge {
  id: string;
  title: string;
  concept: ConceptName;
  difficulty: string;
  prompt: string;
  options: ChallengeOption[];
  explanation?: string;
}

export interface SubmitAnswerRequest {
  challenge_id: string;
  selected_option_id: string;
  concept: ConceptName;
  simulation_result: SimulationResult;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  feedback: string;
  correct_option_id?: string;
  mastery_delta?: number;
}

// ─── Mastery ─────────────────────────────────────────────────────────────────
export interface ConceptMastery {
  concept: ConceptName;
  score: number;
  level: MasteryLevel;
  attempts: number;
  correct: number;
}

export type MasteryMap = Record<ConceptName, ConceptMastery>;

// ─── Health ──────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  simulator_ready: boolean;
  backend: string;
  version: string;
}
