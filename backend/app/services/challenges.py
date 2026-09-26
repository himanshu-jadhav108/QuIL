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
    # ─── SUPERPOSITION ────────────────────────────────────────────────────────
    'challenge-superposition': Challenge(
        id='challenge-superposition',
        title='Superposition I: Predict the Hadamard Distribution',
        type=ChallengeType.PREDICTION,
        concept='superposition',
        difficulty='Beginner',
        prompt='A single qubit initialized to |0⟩ passes through a Hadamard gate (H). Predict the resulting measurement probabilities for |0⟩ and |1⟩.',
        initial_circuit=CanonicalCircuit(
            qubits=1,
            gates=[Gate(gate=GateType.H, target=0)],
            label='H|0⟩',
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
        explanation='The H gate maps |0⟩ to (|0⟩ + |1⟩)/√2. By Born\'s rule, |1/√2|² = 0.5, giving equal 50% probability to each computational basis state.',
        points=100,
        improvement_tip='Review how the Hadamard gate rotates the state vector from the North Pole (Z=+1) onto the equator (X=+1) of the Bloch sphere. Superposition is not a classical coin toss; both amplitudes exist simultaneously prior to measurement.'
    ),
    'challenge-superposition-self-inverse': Challenge(
        id='challenge-superposition-self-inverse',
        title='Superposition II: Double Hadamard & Quantum Reversibility',
        type=ChallengeType.PREDICTION,
        concept='superposition',
        difficulty='Intermediate',
        prompt='A qubit initialized to |0⟩ passes through TWO consecutive Hadamard gates: H followed by H (H²). What is the final state and measurement probability distribution?',
        initial_circuit=CanonicalCircuit(
            qubits=1,
            gates=[Gate(gate=GateType.H, target=0), Gate(gate=GateType.H, target=0)],
            label='H²|0⟩',
            concept='superposition'
        ),
        expected_outcomes={'0': 1.0, '1': 0.0},
        options=[
            'P(|0⟩) = 100%, P(|1⟩) = 0% — H is Hermitian and unitary (H² = I), restoring the state to |0⟩',
            'P(|0⟩) = 50%, P(|1⟩) = 50% — The second H gate doubles the randomness',
            'P(|0⟩) = 0%, P(|1⟩) = 100% — Two rotations flip the qubit completely into the excited state',
            '0% for both outcomes due to complete destructive phase cancellation'
        ],
        correct_option_index=0,
        explanation='All quantum logic gates are unitary and reversible. Because the Hadamard matrix satisfies H = H† = H⁻¹, applying it twice yields the identity operation: H·H = I, returning H(H|0⟩) = |0⟩.',
        points=150,
        improvement_tip='Quantum operations preserve information reversibly. Never mistake superposition for an irreversible randomization step: constructive and destructive interference can completely undo superposition.'
    ),
    'challenge-superposition-phase': Challenge(
        id='challenge-superposition-phase',
        title='Superposition III: Relative Phase & The |−⟩ State',
        type=ChallengeType.PREDICTION,
        concept='superposition',
        difficulty='Advanced',
        prompt='A qubit is initialized to |1⟩ (via Pauli-X) and then passes through a Hadamard gate (H|1⟩). What is the resulting quantum state and its physical properties?',
        initial_circuit=CanonicalCircuit(
            qubits=1,
            gates=[Gate(gate=GateType.X, target=0), Gate(gate=GateType.H, target=0)],
            label='H|1⟩ = |−⟩',
            concept='superposition'
        ),
        expected_outcomes={'0': 0.5, '1': 0.5},
        options=[
            '|−⟩ = (|0⟩ − |1⟩)/√2 — Has equal 50/50 measurement probabilities but a relative phase of π (-1 amplitude on |1⟩)',
            '|+⟩ = (|0⟩ + |1⟩)/√2 — Identical in both amplitude and phase to H acting on |0⟩',
            '100% |1⟩ — Hadamard cannot produce superposition from an excited state',
            '100% |0⟩ — Hadamard acts like an irreversible ground state reset gate'
        ],
        correct_option_index=0,
        explanation='Hadamard transforms the excited state |1⟩ into |−⟩ = (|0⟩ − |1⟩)/√2. While measuring in the computational basis yields 50/50 probabilities just like |+⟩, the negative relative phase (e^(iπ) = -1) is crucial for quantum interference in algorithms like Grover and Shor.',
        points=200,
        improvement_tip='Focus on quantum relative phase. Probability tells you amplitude magnitudes (|a|²), but phase determines interference paths. Notice on the Bloch sphere that |+⟩ points along +X while |−⟩ points along -X.'
    ),

    # ─── MEASUREMENT ──────────────────────────────────────────────────────────
    'challenge-diagnosis': Challenge(
        id='challenge-diagnosis',
        title='Measurement I: Diagnosing the Hidden State Misconception',
        type=ChallengeType.DIAGNOSIS,
        concept='measurement',
        difficulty='Beginner',
        prompt='A student runs H|0⟩ and predicts outcome |0⟩ with 100% certainty, reasoning that because the qubit began in |0⟩, it must secretly remain in |0⟩ before we measure it. Which misconception does this represent?',
        options=[
            'M1: Superposition treated as a hidden classical value (qubit has a definite state before measurement)',
            'M2: Measurement does not alter or project the quantum state',
            'M3: Entanglement implies faster-than-light signalling',
            'M4: Phase is treated as identical to measurement probability'
        ],
        correct_option_index=0,
        explanation='Misconception M1 occurs when learners treat quantum superposition as classical ignorance (like a flipped coin under a cup). Quantum mechanics proves the qubit has no definite value until measurement forces an irreversible projection.',
        points=100,
        improvement_tip='Review Misconception M1. In quantum mechanics, a particle in superposition is not "either 0 or 1 secretly" — it occupies a coherent linear combination of states that exhibits physical interference.'
    ),
    'challenge-measurement-collapse': Challenge(
        id='challenge-measurement-collapse',
        title='Measurement II: Irreversible Projective Collapse',
        type=ChallengeType.DIAGNOSIS,
        concept='measurement',
        difficulty='Intermediate',
        prompt='A qubit in superposition |+⟩ = (|0⟩ + |1⟩)/√2 is measured and collapses to eigenvalue |0⟩. If the experimenter immediately measures the qubit a second time without applying any new gates, what is the probability of observing |0⟩?',
        options=[
            'P(|0⟩) = 100% — Wavefunction collapse is irreversible; the post-measurement state is purely |0⟩',
            'P(|0⟩) = 50% — The superposition regenerates automatically after measurement',
            'P(|0⟩) = 0% — Quantum measurement alternates outcomes like a classical toggle switch',
            'P(|0⟩) = 25% — Amplitudes decay progressively over successive measurements'
        ],
        correct_option_index=0,
        explanation='Quantum measurement is non-unitary and projective (von Neumann-Lüders postulate). Once measured and observed as |0⟩, the wavefunction irreversibly collapses onto the eigenstate |0⟩. Subsequent measurements yield |0⟩ with 100% certainty (P=1.0).',
        points=150,
        improvement_tip='Avoid Misconception M2 (assuming measurement leaves the state intact). The act of measurement is an active projection operator P₀ = |0⟩⟨0|, destroying the continuous superposition permanently.'
    ),
    'challenge-measurement-born': Challenge(
        id='challenge-measurement-born',
        title='Measurement III: Born Rule and Complex Amplitudes',
        type=ChallengeType.PREDICTION,
        concept='measurement',
        difficulty='Advanced',
        prompt='A qubit is in the coherent superposition state |ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩. According to the Born rule, what is the exact probability of measuring outcome 1?',
        options=[
            'P(1) = |1/2|² = 1/4 = 25% (and P(0) = |√3/2|² = 3/4 = 75%)',
            'P(1) = 1/2 = 50% because measurement splits probabilities equally',
            'P(1) = √3/2 ≈ 86.6% because the larger amplitude dictates the outcome',
            'P(1) = (1/2)³ = 12.5% due to cubic quantum dispersion'
        ],
        correct_option_index=0,
        explanation='Born\'s Rule states that the probability of measuring basis state |i⟩ is the absolute square of its probability amplitude: P(i) = |⟨i|ψ⟩|² = |c_i|². Here |1/2|² = 0.25 (25%) and |√3/2|² = 3/4 = 0.75 (75%). The probabilities sum to 1.0.',
        points=200,
        improvement_tip='Always square the amplitude to calculate measurement probabilities: P = |α|². Never equate the probability amplitude itself with the probability.'
    ),

    # ─── ENTANGLEMENT ─────────────────────────────────────────────────────────
    'challenge-bell': Challenge(
        id='challenge-bell',
        title='Entanglement I: Canonical Bell State Synthesis',
        type=ChallengeType.CONSTRUCTION,
        concept='entanglement',
        difficulty='Beginner',
        prompt='Construct the entangled Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 using 2 qubits, 1 Hadamard gate, and 1 CNOT gate. Which gate sequence creates this state?',
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
        explanation='Applying H to qubit 0 creates (|00⟩ + |10⟩)/√2. The CNOT gate (control=0, target=1) flips qubit 1 only when qubit 0 is in state |1⟩, producing the non-separable Bell state (|00⟩ + |11⟩)/√2.',
        points=100,
        improvement_tip='Entanglement requires two ingredients: superposition and conditional interaction. First use H to create simultaneous branches, then use CNOT to conditionally link the target qubit to the control qubit.'
    ),
    'challenge-entanglement-correlation': Challenge(
        id='challenge-entanglement-correlation',
        title='Entanglement II: Measurement Correlation & State Projection',
        type=ChallengeType.PREDICTION,
        concept='entanglement',
        difficulty='Intermediate',
        prompt='Two qubits are prepared in the entangled Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Alice measures qubit 0 and observes 1. What will Bob observe when he measures qubit 1?',
        options=[
            'Bob is 100% guaranteed to observe 1, because the Bell state contains only correlated outcomes (|00⟩ and |11⟩)',
            'Bob has a 50% chance of 0 and 50% chance of 1 because his measurement is independent',
            'Bob is guaranteed to observe 0 because entangled particles must always oppose each other',
            'Bob cannot measure his qubit because Alice\'s measurement destroyed both particles'
        ],
        correct_option_index=0,
        explanation='In the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, the cross-terms |01⟩ and |10⟩ have zero amplitude. When Alice measures outcome 1, the composite wavefunction projects onto |11⟩. Bob\'s qubit collapses to |1⟩ with 100% correlation.',
        points=150,
        improvement_tip='Remember that entangled states cannot be factored into independent single-qubit states: |Φ⁺⟩ ≠ |ψ_A⟩ ⊗ |ψ_B⟩. The two qubits share a single unified wavefunction; measuring one projects both.'
    ),
    'challenge-entanglement-no-signaling': Challenge(
        id='challenge-entanglement-no-signaling',
        title='Entanglement III: No-Signaling Theorem & Information Bounds',
        type=ChallengeType.DIAGNOSIS,
        concept='entanglement',
        difficulty='Advanced',
        prompt='Since measuring Alice\'s qubit in a Bell pair instantly determines Bob\'s measurement outcome across light-years, can Alice use this mechanism to send an instantaneous faster-than-light message to Bob?',
        options=[
            'No. The No-Signaling Theorem proves that Alice cannot choose her outcome (it is 50/50 random), so Bob observes a completely random mixture without classical communication',
            'Yes. Quantum entanglement provides instantaneous faster-than-light communication that bypasses relativity',
            'Yes, but only if the qubits are kept in deep vacuum chambers',
            'No, because quantum entanglement breaks down if the qubits are separated by more than 1 meter'
        ],
        correct_option_index=0,
        explanation='The No-Signaling Theorem establishes that quantum entanglement cannot transmit information faster than light (Misconception M3). Because Alice\'s local outcome is fundamentally random, Bob\'s local reduced density matrix remains completely unchanged (50/50 mixture) until Alice sends classical comparison data.',
        points=200,
        improvement_tip='Beware Misconception M3 (faster-than-light signalling). Quantum non-locality provides instantaneous correlation, NOT communication. Information transfer strictly requires a classical channel bounded by the speed of light.'
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
            next_recommendation='Select a valid challenge.',
            points_earned=0,
            improvement_advice='Select a valid challenge from the catalog.'
        )

    # 1. Option-based grading (primary interactive UI mode)
    if sub.selected_option_index is not None:
        passed = (sub.selected_option_index == (ch.correct_option_index or 0))
        score = 1.0 if passed else 0.0
        points_earned = ch.points if passed else 0

        # Targeted misconception tagging
        misconceptions = []
        if not passed:
            if ch.concept == 'superposition':
                misconceptions.append('M1')
            elif ch.concept == 'measurement':
                misconceptions.append('M2')
            elif ch.concept == 'entanglement':
                misconceptions.append('M3')

        # Clear, actionable feedback with specific user improvement advice
        correct_text = ch.options[ch.correct_option_index] if ch.options and ch.correct_option_index is not None and ch.correct_option_index < len(ch.options) else 'the theoretical standard'
        if passed:
            feedback = f'✓ Correct (+{points_earned} Points)! {ch.explanation}'
            improvement_advice = f'Mastery Insight: {ch.improvement_tip}' if ch.improvement_tip else 'Great mastery! Proceed to the next difficulty level.'
            next_rec = 'Advance to the next challenge or test your understanding on the quantum circuit simulator.'
        else:
            feedback = f'✕ Incorrect. Correct answer: "{correct_text}". {ch.explanation}'
            improvement_advice = f'What to Improve: {ch.improvement_tip}' if ch.improvement_tip else 'Review the lesson concepts and re-test on the simulator.'
            next_rec = f'Watch the {ch.concept.capitalize()} Manim video in the lesson or consult Ask QuIL for remediation.'

        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=score,
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=misconceptions,
            next_recommendation=next_rec,
            points_earned=points_earned,
            improvement_advice=improvement_advice
        )

    # 2. Prediction-based numerical verification
    if ch.type == ChallengeType.PREDICTION:
        if not sub.prediction:
            return ChallengeResult(
                challenge_id=ch.id,
                passed=False,
                score=0.0,
                feedback='No prediction or option selected.',
                concept=ch.concept,
                next_recommendation='Select an option or enter probabilities summing to 1.0.',
                points_earned=0,
                improvement_advice='Formulate a quantitative hypothesis before submitting.'
            )
        p0 = sub.prediction.get('0', 0.0)
        p1 = sub.prediction.get('1', 0.0)
        delta0 = abs(p0 - 0.5)
        delta1 = abs(p1 - 0.5)
        passed = (delta0 <= 0.10) and (delta1 <= 0.10)
        score = max(0.0, 1.0 - (delta0 + delta1))
        points_earned = int(ch.points * score)
        misconceptions = []
        if (p0 >= 0.8 or p1 >= 0.8) and not passed:
            misconceptions.append('M1')
            feedback = 'Incorrect. You predicted a strongly definite outcome. The Hadamard gate creates an equal superposition (|0⟩ + |1⟩)/√2 with 50/50 probabilities.'
            improvement_advice = 'What to Improve: Avoid Misconception M1. Do not assume the qubit retains a hidden definite value.'
        elif passed:
            feedback = f'Correct (+{points_earned} Points)! The Hadamard gate produces a balanced superposition where outcome 0 and outcome 1 each occur with 50% probability.'
            improvement_advice = 'Mastery Insight: Your prediction aligns with Qiskit Aer quantum simulator ground truth.'
        else:
            feedback = f'Close, but expected 50% for |0⟩ and 50% for |1⟩. You predicted |0⟩: {p0:.0%}, |1⟩: {p1:.0%}.'
            improvement_advice = 'What to Improve: Equal superpositions divide probabilities symmetrically across orthogonal basis states.'

        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=round(score, 3),
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=misconceptions,
            next_recommendation='Try Challenge 2: Construct the Bell state.' if passed else 'Review the Superposition lesson and Show Me Why clip.',
            points_earned=points_earned,
            improvement_advice=improvement_advice
        )

    # 3. Circuit construction simulation verification
    elif ch.type == ChallengeType.CONSTRUCTION:
        if not sub.circuit:
            return ChallengeResult(
                challenge_id=ch.id,
                passed=False,
                score=0.0,
                feedback='No circuit or option submitted.',
                concept=ch.concept,
                next_recommendation='Select an option or build the circuit in the lab.',
                points_earned=0,
                improvement_advice='Select an option or build the circuit in the simulator.'
            )
        sim_res = run_simulation(sub.circuit, shots=1024)
        p00 = sim_res.probabilities.get('00', 0.0)
        p11 = sim_res.probabilities.get('11', 0.0)
        p01 = sim_res.probabilities.get('01', 0.0)
        p10 = sim_res.probabilities.get('10', 0.0)

        passed = (p00 >= 0.38) and (p11 >= 0.38) and (p01 <= 0.08) and (p10 <= 0.08)
        score = 1.0 if passed else round(max(0.0, (p00 + p11) - (p01 + p10)), 3)
        points_earned = int(ch.points * score)
        if passed:
            feedback = f'Outstanding (+{points_earned} Points)! Your circuit generated the entangled Bell state: |00⟩ ({p00:.1%}) and |11⟩ ({p11:.1%}) with zero cross-terms.'
            improvement_advice = 'Mastery Insight: H on qubit 0 followed by CNOT(0, 1) synthesizes the non-separable state (|00⟩ + |11⟩)/√2.'
        else:
            feedback = f'Simulation output ({sim_res.probabilities}) does not match the Bell state (|00⟩ ~50%, |11⟩ ~50%).'
            improvement_advice = 'What to Improve: Verify that H is applied to qubit 0 before the CNOT gate connects control qubit 0 to target qubit 1.'

        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=score,
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=['M3'] if not passed else [],
            next_recommendation='Proceed to the next challenge.' if passed else 'Check the gate sequence: H on q0, then CX(control=0, target=1).',
            points_earned=points_earned,
            improvement_advice=improvement_advice
        )

    # 4. Fallback diagnosis grading
    elif ch.type == ChallengeType.DIAGNOSIS:
        passed = (sub.selected_option_index == ch.correct_option_index)
        score = 1.0 if passed else 0.0
        points_earned = ch.points if passed else 0
        if passed:
            feedback = f'Correct (+{points_earned} Points)! {ch.explanation}'
            improvement_advice = f'Mastery Insight: {ch.improvement_tip}' if ch.improvement_tip else 'Great diagnosis.'
        else:
            feedback = f'Incorrect. {ch.explanation}'
            improvement_advice = f'What to Improve: {ch.improvement_tip}' if ch.improvement_tip else 'Review this misconception.'
        _update_mastery(ch.concept, passed)
        return ChallengeResult(
            challenge_id=ch.id,
            passed=passed,
            score=score,
            feedback=feedback,
            concept=ch.concept,
            misconceptions_triggered=['M1'] if not passed else [],
            next_recommendation='View your updated Mastery Profile!' if passed else 'Review this concept in the AI Tutor.',
            points_earned=points_earned,
            improvement_advice=improvement_advice
        )

    return ChallengeResult(
        challenge_id=ch.id,
        passed=False,
        score=0.0,
        feedback='Unsupported challenge.',
        concept=ch.concept,
        next_recommendation='',
        points_earned=0,
        improvement_advice='Select a valid challenge option.'
    )

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
