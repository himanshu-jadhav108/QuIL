'''
Complete API routes.
Principle: Simulator computes. Everything else reads.
'''
from __future__ import annotations
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from ..schemas.models import (
    CanonicalCircuit, Gate, GateType,
    PredictionInput, SimulationResult, TraceStep,
    ComparisonResult, ExecutionContext,
    TutorRequest, TutorResponse, TutorMode,
    ManimClipMetadata, MisconceptionRule,
    Challenge, ChallengeSubmission, ChallengeResult, UserMasteryProfile
)
from ..services import simulator as sim_svc
from ..services import comparison as cmp_svc
from ..services import misconception as misc_svc
from ..services import tutor as tutor_svc
from ..services import manim as manim_svc
from ..services import challenges as ch_svc

router = APIRouter()

class HealthResponse(BaseModel):
    status: str = 'ok'
    simulator_ready: bool = True
    backend: str = 'qiskit-aer'
    version: str = '0.1.0'

@router.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()

class SimulateRequest(BaseModel):
    circuit: CanonicalCircuit | None = None
    concept: str | None = None
    shots: int = 1024

class CompareRequest(BaseModel):
    prediction: PredictionInput
    simulation: SimulationResult

class DiagnoseRequest(BaseModel):
    prediction: PredictionInput
    simulation: SimulationResult
    comparison: ComparisonResult

@router.post('/simulate', response_model=SimulationResult)
def simulate(req: SimulateRequest) -> SimulationResult:
    if req.shots < 1 or req.shots > 100_000:
        raise HTTPException(status_code=422, detail='shots must be between 1 and 100 000')
    
    circuit = req.circuit
    if circuit is None:
        circuit = sim_svc.get_canonical_circuit(req.concept or 'superposition')
        
    result = sim_svc.run_simulation(circuit, shots=req.shots)
    if result.error:
        raise HTTPException(status_code=500, detail=result.error)
    return result

@router.get('/trace', response_model=list[TraceStep])
def get_trace(concept: str = Query('superposition')) -> list[TraceStep]:
    circuit = sim_svc.get_canonical_circuit(concept)
    return sim_svc._build_trace(circuit)

@router.post('/compare', response_model=ComparisonResult)
def compare(req: CompareRequest) -> ComparisonResult:
    return cmp_svc.compare(req.prediction, req.simulation)

@router.post('/diagnose', response_model=list)
def diagnose(req: DiagnoseRequest) -> list:
    comparison = cmp_svc.compare(req.prediction, req.simulation)
    return misc_svc.triggered_only(comparison)

@router.post('/run-and-compare', response_model=ExecutionContext)
def run_and_compare(req: CompareRequest) -> ExecutionContext:
    simulation = sim_svc.run_simulation(req.prediction.circuit)
    if simulation.error:
        raise HTTPException(status_code=500, detail=simulation.error)
    comparison = cmp_svc.compare(req.prediction, simulation)
    misconceptions = misc_svc.triggered_only(comparison)
    return ExecutionContext(
        concept=req.prediction.concept,
        circuit=req.prediction.circuit,
        prediction=req.prediction,
        simulation=simulation,
        comparison=comparison,
        misconceptions=misconceptions,
    )

class QuickCompareRequest(BaseModel):
    concept: str = 'superposition'
    prediction_probabilities: dict[str, float]
    shots: int = 1024
    notes: str | None = None

@router.post('/evaluate')
def evaluate(req: QuickCompareRequest) -> dict[str, Any]:
    concept = req.concept or 'superposition'
    circuit = sim_svc.get_canonical_circuit(concept)
    sim = sim_svc.run_simulation(circuit, shots=req.shots)
    if sim.error:
        raise HTTPException(status_code=500, detail=sim.error)

    # Normalize prediction probabilities to strictly sum to 1.0
    total = sum(req.prediction_probabilities.values()) or 1.0
    norm_probs = {k: round(v / total, 4) for k, v in req.prediction_probabilities.items()}

    # Adjust floating point residual so sum is exact
    diff = round(1.0 - sum(norm_probs.values()), 4)
    if diff != 0 and norm_probs:
        first_k = next(iter(norm_probs))
        norm_probs[first_k] = round(norm_probs[first_k] + diff, 4)

    pred = PredictionInput(
        circuit=circuit,
        probabilities=norm_probs,
        concept=concept,
        notes=req.notes
    )
    comparison = cmp_svc.compare(pred, sim)
    misconceptions = misc_svc.triggered_only(comparison)

    return {
        'concept': concept,
        'simulation': sim.model_dump(),
        'comparison': comparison.model_dump(),
        'misconceptions': [m.model_dump() for m in misconceptions],
        'trace': [t.model_dump() for t in sim_svc._build_trace(circuit)],
    }

class FlexibleTutorRequest(BaseModel):
    mode: TutorMode | None = None
    learner_question: str | None = None
    user_question: str | None = None
    concept: str | None = None
    simulation_result: dict[str, Any] | None = None
    prediction_probabilities: dict[str, float] | None = None
    misconceptions: list[Any] | None = None
    context: ExecutionContext | None = None

@router.post('/tutor')
def ask_tutor(req: FlexibleTutorRequest) -> dict[str, Any]:
    # If direct execution context is provided
    if req.context is not None:
        t_req = TutorRequest(
            mode=req.mode or TutorMode.EXPLAIN,
            learner_question=req.learner_question or req.user_question,
            context=req.context,
        )
        res = tutor_svc.ask_tutor(t_req)
        return {
            'concept': req.context.concept or 'superposition',
            'explanation': res.response,
            'key_insight': 'Superposition produces balanced amplitudes; measurement collapses the state.',
            'next_step': res.suggested_actions[0] if res.suggested_actions else 'Try the challenge to test your understanding.',
            'response': res.response,
            'grounded_evidence': res.grounded_evidence,
            'suggested_actions': res.suggested_actions,
            'mode': res.mode,
            'provider': res.provider,
        }
    
    # If called from frontend with concept / prediction
    concept = req.concept or 'superposition'
    circuit = sim_svc.get_canonical_circuit(concept)
    sim = sim_svc.run_simulation(circuit, shots=1024)
    
    pred_probs = req.prediction_probabilities
    if not pred_probs:
        pred_probs = {'0': 0.5, '1': 0.5} if circuit.qubits == 1 else {'00': 0.5, '11': 0.5}
        
    pred = PredictionInput(
        circuit=circuit,
        probabilities=pred_probs,
        concept=concept
    )
    cmp = cmp_svc.compare(pred, sim)
    misconceptions = misc_svc.triggered_only(cmp)

    # If client passed pre-diagnosed misconceptions, include them
    if req.misconceptions:
        parsed_misc = []
        for m in req.misconceptions:
            if isinstance(m, dict):
                try:
                    parsed_misc.append(MisconceptionResult(**m))
                except Exception:
                    pass
            elif isinstance(m, MisconceptionResult):
                parsed_misc.append(m)
        if parsed_misc:
            misconceptions = parsed_misc

    ctx = ExecutionContext(
        concept=concept,
        circuit=circuit,
        prediction=pred,
        simulation=sim,
        comparison=cmp,
        misconceptions=misconceptions
    )
    t_req = TutorRequest(
        mode=req.mode or TutorMode.EXPLAIN,
        learner_question=req.user_question or req.learner_question,
        context=ctx
    )
    res = tutor_svc.ask_tutor(t_req)
    return {
        'concept': concept,
        'explanation': res.response,
        'key_insight': 'The quantum state vector evolves deterministically under unitary gates and projects probabilistically upon measurement.',
        'next_step': res.suggested_actions[0] if res.suggested_actions else 'Proceed to the challenge stage to test your mastery.',
        'response': res.response,
        'grounded_evidence': res.grounded_evidence,
        'suggested_actions': res.suggested_actions,
        'mode': res.mode,
        'provider': res.provider,
    }

@router.get('/manim/clips', response_model=list[ManimClipMetadata])
def list_manim_clips() -> list[ManimClipMetadata]:
    return manim_svc.list_clips()

@router.get('/manim/select', response_model=ManimClipMetadata)
def select_manim_clip(
    concept: str | None = None,
    rule: MisconceptionRule | None = None
) -> ManimClipMetadata:
    return manim_svc.select_clip_for_context(concept=concept, rule=rule)

@router.get('/challenges', response_model=list[Challenge])
def list_challenges(concept: str | None = None) -> list[Challenge]:
    ch_list = ch_svc.list_challenges()
    if concept:
        filtered = [c for c in ch_list if c.concept.lower() == concept.lower()]
        return filtered or ch_list
    return ch_list

@router.get('/challenges/{challenge_id}', response_model=Challenge)
def get_challenge(challenge_id: str) -> Challenge:
    ch = ch_svc.get_challenge(challenge_id)
    if not ch:
        raise HTTPException(status_code=404, detail='Challenge not found')
    return ch

class FlexibleChallengeSubmission(BaseModel):
    challenge_id: str
    selected_option_id: str | None = None
    selected_option_index: int | None = None
    prediction: dict[str, float] | None = None
    circuit: CanonicalCircuit | None = None
    concept: str | None = None
    simulation_result: dict[str, Any] | None = None

@router.post('/challenges/submit')
def submit_challenge(sub: FlexibleChallengeSubmission) -> dict[str, Any]:
    opt_idx = sub.selected_option_index
    if opt_idx is None and sub.selected_option_id is not None:
        try:
            opt_idx = int(sub.selected_option_id)
        except ValueError:
            opt_idx = 0
            
    internal_sub = ChallengeSubmission(
        challenge_id=sub.challenge_id,
        prediction=sub.prediction,
        circuit=sub.circuit,
        selected_option_index=opt_idx
    )
    result = ch_svc.grade_challenge(internal_sub)
    ch = ch_svc.get_challenge(sub.challenge_id)
    correct_id = str(ch.correct_option_index if ch and ch.correct_option_index is not None else 0)
    return {
        'challenge_id': result.challenge_id,
        'passed': result.passed,
        'correct': result.passed,
        'score': result.score,
        'points_earned': result.points_earned,
        'feedback': result.feedback,
        'improvement_advice': result.improvement_advice,
        'concept': result.concept,
        'correct_option_id': correct_id,
        'mastery_delta': 0.15 if result.passed else 0.0,
        'misconceptions_triggered': result.misconceptions_triggered,
        'next_recommendation': result.next_recommendation,
    }

@router.get('/mastery')
def get_mastery() -> dict[str, Any]:
    prof = ch_svc.get_mastery_profile()
    # Return profile with both structure formats for compatibility
    res = prof.model_dump()
    # Add top-level concept shortcuts
    for c_name, c_data in prof.concepts.items():
        res[c_name] = c_data.model_dump()
    return res

@router.get('/circuits/golden')
def golden_circuits() -> dict:
    h_circuit = sim_svc.get_canonical_circuit('superposition')
    bell_circuit = sim_svc.get_canonical_circuit('entanglement')
    return {
        'h_circuit': h_circuit.model_dump(),
        'bell_circuit': bell_circuit.model_dump(),
    }
