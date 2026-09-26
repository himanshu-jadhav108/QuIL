'''
Canonical circuit + execution-result schema.
Principle: Simulator computes. Everything else reads.
SCHEMA_VERSION is embedded for consumer compatibility checks.
'''
from __future__ import annotations
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field, model_validator

SCHEMA_VERSION = '1.0'

class GateType(str, Enum):
    H  = 'H'; X  = 'X'; Y  = 'Y'; Z  = 'Z'
    CX = 'CX'; S  = 'S'; T  = 'T'; M  = 'M'

class Gate(BaseModel):
    gate: GateType
    target: int = Field(..., ge=0)
    control: int | None = Field(None, ge=0)
    params: list[float] = Field(default_factory=list)

    @model_validator(mode='after')
    def _check_cx(self) -> 'Gate':
        if self.gate == GateType.CX and self.control is None:
            raise ValueError('CX gate requires a control qubit')
        return self

class CanonicalCircuit(BaseModel):
    schema_version: str = Field(SCHEMA_VERSION)
    qubits: int = Field(..., ge=1, le=20)
    gates: list[Gate] = Field(default_factory=list)
    label: str | None = None
    concept: str | None = None

class PredictionInput(BaseModel):
    circuit: CanonicalCircuit
    probabilities: dict[str, float]
    session_id: str | None = None
    concept: str | None = None
    notes: str | None = None

    @model_validator(mode='after')
    def _check_sum(self) -> 'PredictionInput':
        total = sum(self.probabilities.values())
        if abs(total - 1.0) > 0.05:
            raise ValueError(f'Probabilities must sum to ~1.0 (got {total:.3f})')
        return self

class TraceStep(BaseModel):
    step: int
    event: str
    state_label: str | None = None
    statevector: list[list[float]] | None = None

class SimulationResult(BaseModel):
    '''Source of quantum-result truth. Never overridden by the LLM.'''
    schema_version: str = Field(SCHEMA_VERSION)
    circuit: CanonicalCircuit
    shots: int = Field(..., ge=1)
    counts: dict[str, int]
    probabilities: dict[str, float]
    final_statevector: list[list[float]] | None = None
    trace: list[TraceStep] = Field(default_factory=list)
    backend: str = 'qiskit-aer'
    execution_time_ms: float | None = None
    error: str | None = None

    # Enhanced fields for frontend / demo consumers
    num_qubits: int = 1
    num_shots: int = 1024
    circuit_diagram: str = ''
    gates_applied: list[str] = Field(default_factory=list)
    concept: str = 'superposition'

class OutcomeComparison(BaseModel):
    outcome: str
    predicted: float
    simulated: float
    delta: float
    match: bool

class ComparisonResult(BaseModel):
    '''Deterministic comparison - numerical correctness never delegated to LLM.'''
    prediction: PredictionInput
    simulation: SimulationResult
    tolerance: float = 0.10
    overall_match: bool
    outcomes: list[OutcomeComparison]
    accuracy_score: float = Field(..., ge=0.0, le=1.0)
    summary: str

class MisconceptionRule(str, Enum):
    M1 = 'M1'; M2 = 'M2'; M3 = 'M3'; M4 = 'M4'

class MisconceptionResult(BaseModel):
    rule: MisconceptionRule
    triggered: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: str
    learner_explanation: str
    remediation_concept: str
    suggested_challenge: str | None = None
    manim_clip_id: str | None = None

class ExecutionContext(BaseModel):
    '''Full grounded context sent to AI tutor, mastery, Manim selector.'''
    schema_version: str = Field(SCHEMA_VERSION)
    session_id: str | None = None
    concept: str | None = None
    circuit: CanonicalCircuit
    prediction: PredictionInput | None = None
    simulation: SimulationResult
    comparison: ComparisonResult | None = None
    misconceptions: list[MisconceptionResult] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)

# -- AI Tutor Models --

class TutorMode(str, Enum):
    EXPLAIN = 'explain'
    HINT = 'hint'
    DEBUG = 'debug'

class TutorRequest(BaseModel):
    mode: TutorMode = TutorMode.EXPLAIN
    learner_question: str | None = None
    context: ExecutionContext

class TutorResponse(BaseModel):
    mode: TutorMode
    response: str
    grounded_evidence: dict[str, Any]
    provider: str
    suggested_actions: list[str] = Field(default_factory=list)

# -- Manim Media Models --

class ManimClipMetadata(BaseModel):
    clip_id: str
    title: str
    concept: str
    description: str
    duration_sec: float
    video_url: str | None = None
    misconception_ids: list[str] = Field(default_factory=list)
    key_takeaways: list[str] = Field(default_factory=list)
    fallback_explanation: str

# -- Challenge & Mastery Models --

class ChallengeType(str, Enum):
    PREDICTION = 'prediction'
    CONSTRUCTION = 'construction'
    DIAGNOSIS = 'diagnosis'

class Challenge(BaseModel):
    id: str
    title: str
    type: ChallengeType
    concept: str
    difficulty: str
    prompt: str
    initial_circuit: CanonicalCircuit | None = None
    expected_outcomes: dict[str, float] | None = None
    options: list[str] | None = None
    correct_option_index: int | None = None
    explanation: str
    points: int = 100
    improvement_tip: str | None = None

class ChallengeSubmission(BaseModel):
    challenge_id: str
    prediction: dict[str, float] | None = None
    circuit: CanonicalCircuit | None = None
    selected_option_index: int | None = None

class ChallengeResult(BaseModel):
    challenge_id: str
    passed: bool
    score: float = Field(..., ge=0.0, le=1.0)
    feedback: str
    concept: str
    misconceptions_triggered: list[str] = Field(default_factory=list)
    next_recommendation: str
    points_earned: int = 0
    improvement_advice: str | None = None

class MasteryLevel(str, Enum):
    LEARNING = 'Learning'
    PRACTICING = 'Practicing'
    MASTERED = 'Mastered'

class ConceptMastery(BaseModel):
    concept: str
    score: float = Field(..., ge=0.0, le=1.0)
    level: MasteryLevel
    attempts: int = 0
    correct: int = 0

class UserMasteryProfile(BaseModel):
    overall_progress: float = Field(..., ge=0.0, le=1.0)
    concepts: dict[str, ConceptMastery]
