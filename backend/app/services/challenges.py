'''
Challenges and Deterministic Mastery Engine (Prompt 09).
Principle: Numerical grading is deterministic; LLM does not assign scores or mastery.
'''
from __future__ import annotations
from ..schemas.models import (
    Challenge, ChallengeType, ChallengeSubmission, ChallengeResult,
    CanonicalCircuit, Gate, GateType, MasteryLevel, ConceptMastery, UserMasteryProfile
)
from .simulator import run_simulation

CHALLENGES: dict[str, Challenge] = {
    'challenge-superposition': Challenge(
        id='challenge-superposition',
        title='Challenge 1: Predict the Hadamard Distribution',
        type=ChallengeType.PREDICTION,
        concept='superposition',
        difficulty='Beginner',
        prompt='A single qubit initialized to |0> passes through a Hadamard gate (H). Predict the resulting measurement probabilities for |0> and |1>.',
        initial_circuit=CanonicalCircuit(
            qubits=1,
            gates=[Gate(gate=GateType.H, target=0)],
            label='H|0>',
            concept='superposition'
        ),
        expected_outcomes={'0': 0.5, '1': 0.5},
        options=[
            'P(|0⟩) = 50%, P(|1⟩) = 50% — Balanced equal superposition',
            'P(|0⟩) = 100%, P(|1⟩) = 0% — Deterministic outcome |0⟩',
            'P(|0⟩) = 0%, P(|1⟩) = 100% — Deterministic outcome |1⟩',
            'P(|0⟩) = 75%, P(|1⟩) = 25% — Biased toward ground state'
        ],
        correct_option_index=0,
        explanation='The H gate maps |0> to (|0> + |1>)/sqrt(2), which gives equal 50% probability to outcome 0 and outcome 1.'
    ),
    'challenge-bell': Challenge(
        id='challenge-bell',
        title='Challenge 2: Construct the Canonical Bell State',
        type=ChallengeType.CONSTRUCTION,
        concept='entanglement',
        difficulty='Intermediate',
        prompt='Construct the entangled Bell state |Phi+> = (|00> + |11>)/sqrt(2) using 2 qubits, 1 Hadamard gate, and 1 CNOT gate. Which gate sequence creates this state?',
        initial_circuit=CanonicalCircuit(
            qubits=2,
            gates=[],
            label='Empty 2-Qubit Circuit',
            concept='entanglement'
        ),
        expected_outcomes={'00': 0.5, '11': 0.5},
        options=[
            'Hadamard on qubit 0, followed by CNOT(control=q0, target=q1)',
            'Pauli-X on qubit 0, followed by CNOT(control=q0, target=q1)',
            'Hadamard on both qubit 0 and qubit 1 independently',
            'CNOT(control=q1, target=q0) without prior superposition'
        ],
        correct_option_index=0,
        explanation='Applying H to qubit 0 creates a superposition, then CX(control=0, target=1) entangles them into (|00> + |11>)/sqrt(2).'
    ),
    'challenge-diagnosis': Challenge(
        id='challenge-diagnosis',
        title='Challenge 3: Diagnose the Superposition Misconception',
        type=ChallengeType.DIAGNOSIS,
        concept='measurement',
        difficulty='Intermediate',
        prompt='A student runs H|0> and predicts outcome |0> with 100% certainty, reasoning that because the qubit began in |0>, it must secretly remain in |0>. Which misconception does this represent?',
        options=[
            'M1: Superposition treated as a hidden classical value (qubit has a definite state before measurement).',
            'M2: Measurement does not alter the quantum state.',
            'M3: Entanglement implies faster-than-light signalling.',
            'M4: Phase is treated as identical to measurement probability.'
        ],
        correct_option_index=0,
        explanation='M1 occurs when learners think quantum superposition is merely classical ignorance of a pre-existing hidden value.'
    )
}

_USER_MASTERY = UserMasteryProfile(
    overall_progress=0.45,
    concepts={
        'qubit': ConceptMastery(concept='qubit', score=0.85, level=MasteryLevel.MASTERED, attempts=4, correct=4),
        'superposition': ConceptMastery(concept='superposition', score=0.70, level=MasteryLevel.PRACTICING, attempts=3, correct=2),
        'measurement': ConceptMastery(concept='measurement', score=0.50, level=MasteryLevel.LEARNING, attempts=2, correct=1),
        'entanglement': ConceptMastery(concept='entanglement', score=0.35, level=MasteryLevel.LEARNING, attempts=1, correct=0),
    }
)

def list_challenges() -> list[Challenge]:
    return list(CHALLENGES.values())

def get_challenge(challenge_id: str) -> Challenge | None:
    return CHALLENGES.get(challenge_id)

def grade_challenge(sub: ChallengeSubmission) -> ChallengeResult:
    ch = CHALLENGES.get(sub.challenge_id)
    if not ch:
        return ChallengeResult(
            challenge_id=sub.challenge_id,
            passed=False,
            score=0.0,
            feedback=f'Unknown challenge ID: {sub.challenge_id}',
            concept='unknown',
            next_recommendation='Select a valid challenge.'
        )

    if ch.type == ChallengeType.PREDICTION:
        if sub.selected_option_index is not None:
            passed = (sub.selected_option_index == (ch.correct_option_index or 0))
            score = 1.0 if passed else (0.5 if sub.selected_option_index == 3 else 0.0)
            misconceptions = ['M1'] if (sub.selected_option_index in [1, 2] and not passed) else []
            feedback = (
                'Correct! The Hadamard gate produces a balanced superposition where outcome 0 and outcome 1 each occur with 50% probability.'
                if passed else
                'Incorrect. Selecting a definite outcome represents Misconception M1 (treating superposition as hidden classical certainty).'
            )
            _update_mastery(ch.concept, passed)
            return ChallengeResult(
                challenge_id=ch.id,
                passed=passed,
                score=score,
                feedback=feedback,
                concept=ch.concept,
                misconceptions_triggered=misconceptions,
                next_recommendation='Try Challenge 2: Construct the Bell state.' if passed else 'Review the Superposition lesson and Show Me Why clip.'
            )

        if not sub.prediction:
            return ChallengeResult(challenge_id=ch.id, passed=False, score=0.0, feedback='No prediction or option selected.', concept=ch.concept, next_recommendation='Select an option or enter probabilities summing to 1.0.')
        p0 = sub.prediction.get('0', 0.0)
        p1 = sub.prediction.get('1', 0.0)
        delta0 = abs(p0 - 0.5)
        delta1 = abs(p1 - 0.5)
        passed = (delta0 <= 0.10) and (delta1 <= 0.10)
        score = max(0.0, 1.0 - (delta0 + delta1))
        misconceptions = []
        if (p0 >= 0.8 or p1 >= 0.8) and not passed:
            misconceptions.append('M1')
            feedback = 'Incorrect. You predicted a strongly definite outcome. Remember: the H gate creates an equal superposition (|0> + |1>)/sqrt(2), so both outcomes are equally likely (50/50).'
        elif passed:
            feedback = 'Correct! The Hadamard gate produces a balanced superposition where outcome 0 and outcome 1 each occur with 50% probability.'
        else:
            feedback = f'Close, but expected 50% for |0> and 50% for |1>. You predicted |0>: {p0:.0%}, |1>: {p1:.0%}.'

        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=round(score, 3),
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=misconceptions,
            next_recommendation='Try Challenge 2: Construct the Bell state.' if passed else 'Review the Superposition lesson and Show Me Why clip.'
        )

    elif ch.type == ChallengeType.CONSTRUCTION:
        if sub.selected_option_index is not None:
            passed = (sub.selected_option_index == (ch.correct_option_index or 0))
            score = 1.0 if passed else 0.0
            misconceptions = ['M3'] if not passed else []
            feedback = (
                'Outstanding! Applying H on qubit 0 creates a superposition, then CX(control=0, target=1) creates the entangled Bell state (|00> + |11>)/sqrt(2).'
                if passed else
                'Incorrect. To generate the entangled Bell state, you must first create a superposition with H on q0, then entangle via CX(control=0, target=1).'
            )
            _update_mastery(ch.concept, passed)
            return ChallengeResult(
                challenge_id=ch.id,
                passed=passed,
                score=score,
                feedback=feedback,
                concept=ch.concept,
                misconceptions_triggered=misconceptions,
                next_recommendation='Proceed to Challenge 3: Misconception Diagnosis.' if passed else 'Check the gate sequence: H on q0, then CX(control=0, target=1).'
            )

        if not sub.circuit:
            return ChallengeResult(challenge_id=ch.id, passed=False, score=0.0, feedback='No circuit or option submitted.', concept=ch.concept, next_recommendation='Select an option or build the circuit in the lab.')
        sim_res = run_simulation(sub.circuit, shots=1024)
        p00 = sim_res.probabilities.get('00', 0.0)
        p11 = sim_res.probabilities.get('11', 0.0)
        p01 = sim_res.probabilities.get('01', 0.0)
        p10 = sim_res.probabilities.get('10', 0.0)

        passed = (p00 >= 0.38) and (p11 >= 0.38) and (p01 <= 0.08) and (p10 <= 0.08)
        score = 1.0 if passed else round(max(0.0, (p00 + p11) - (p01 + p10)), 3)
        if passed:
            feedback = f'Outstanding! Your circuit generated the entangled Bell state: |00> ({p00:.1%}) and |11> ({p11:.1%}) with zero cross-terms.'
        else:
            feedback = f'Simulation output ({sim_res.probabilities}) does not match the Bell state (|00> ~50%, |11> ~50%). Ensure H is on qubit 0 and CNOT connects qubit 0 to qubit 1.'

        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=score,
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=['M3'] if not passed else [],
            next_recommendation='Proceed to Challenge 3: Misconception Diagnosis.' if passed else 'Check the gate sequence: H on q0, then CX(control=0, target=1).'
        )

    elif ch.type == ChallengeType.DIAGNOSIS:
        passed = (sub.selected_option_index == ch.correct_option_index)
        score = 1.0 if passed else 0.0
        if passed:
            feedback = 'Correct! Assuming a qubit secretly has a definite value before measurement is classic Misconception M1.'
        else:
            feedback = 'Incorrect. The student treated superposition as hidden classical information (Misconception M1).'
        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=score,
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=['M1'] if not passed else [],
            next_recommendation='View your updated Mastery Profile!' if passed else 'Review Misconception M1 in the AI Tutor.'
        )

    return ChallengeResult(challenge_id=ch.id, passed=False, score=0.0, feedback='Unsupported challenge.', concept=ch.concept, next_recommendation='')

def _update_mastery(concept: str, passed: bool):
    if concept in _USER_MASTERY.concepts:
        cm = _USER_MASTERY.concepts[concept]
        cm.attempts += 1
        if passed:
            cm.correct += 1
            cm.score = min(1.0, round(cm.score + 0.15, 2))
        else:
            cm.score = max(0.1, round(cm.score - 0.05, 2))
        if cm.score >= 0.80:
            cm.level = MasteryLevel.MASTERED
        elif cm.score >= 0.50:
            cm.level = MasteryLevel.PRACTICING
        else:
            cm.level = MasteryLevel.LEARNING

        total = sum(c.score for c in _USER_MASTERY.concepts.values())
        _USER_MASTERY.overall_progress = round(total / len(_USER_MASTERY.concepts), 2)

def get_mastery_profile() -> UserMasteryProfile:
    return _USER_MASTERY
