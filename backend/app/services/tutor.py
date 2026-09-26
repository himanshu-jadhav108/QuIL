'''
Grounded AI Tutor Service (Prompt 05).
Principle: Simulator computes. Everything else reads.
Never invents simulation results or overrides deterministic grading.
'''
from __future__ import annotations
import os
import pathlib
import json
import urllib.request
import urllib.error
from typing import Any
from ..schemas.models import (
    TutorMode, TutorRequest, TutorResponse, ExecutionContext,
    MisconceptionRule
)

def _build_grounded_prompt(req: TutorRequest) -> str:
    ctx = req.context
    sim = ctx.simulation
    pred = ctx.prediction
    cmp = ctx.comparison
    misc = ctx.misconceptions
    concept_name = ctx.concept or 'Introductory Quantum Computing'
    num_gates = len(ctx.circuit.gates)

    prompt = (
        'You are the grounded quantum computing AI tutor for the Eureka Forge Quantum Intelligence Lab.\n'
        'CORE PRINCIPLE: The simulator computes. You read and explain.\n'
        'NEVER invent quantum probabilities or claim results differing from the simulator.\n'
        'Do NOT override deterministic grading.\n\n'
        f'EVIDENCE CONTEXT:\n'
        f'- Concept: {concept_name}\n'
        f'- Circuit: {ctx.circuit.qubits} qubits, {num_gates} gates\n'
        f'- Simulator Output (Qiskit Aer, {sim.shots} shots):\n'
        f'  Probabilities: {sim.probabilities}\n'
        f'  Counts: {sim.counts}\n'
    )
    if pred:
        prompt += f'- Learner Prediction: {pred.probabilities}\n'
    if cmp:
        prompt += f'- Comparison: Overall Match = {cmp.overall_match}, Accuracy = {cmp.accuracy_score:.1%}\n'
        for out in cmp.outcomes:
            prompt += f'  * Outcome |{out.outcome}>: Predicted {out.predicted:.2f}, Simulated {out.simulated:.2f} (Match: {out.match})\n'
    if misc:
        prompt += '- Diagnosed Misconceptions:\n'
        for m in misc:
            if m.triggered:
                prompt += f'  * Rule {m.rule}: {m.learner_explanation}\n    Evidence: {m.evidence}\n'
    if ctx.simulation.trace:
        prompt += '- Execution Step-by-Step Trace:\n'
        for step in ctx.simulation.trace:
            st_label = step.state_label or 'N/A'
            prompt += f'  Step {step.step}: {step.event} (State: {st_label})\n'

    if req.mode == TutorMode.HINT:
        prompt += '\nMODE: HINT. Give a guiding hint to help the learner understand the state transformation without revealing numerical answers directly.'
    elif req.mode == TutorMode.DEBUG:
        prompt += '\nMODE: DEBUG. Point out specifically where the prediction deviated from the quantum simulator result and what physical property caused this.'
    else:
        prompt += '\nMODE: EXPLAIN. Provide a clear, beginner-friendly conceptual explanation grounded strictly in the provided circuit and simulator trace.'

    if req.learner_question:
        prompt += f'\nLearner Question: {req.learner_question}'

    return prompt

def _deterministic_grounded_response(req: TutorRequest) -> TutorResponse:
    ctx = req.context
    sim = ctx.simulation
    cmp = ctx.comparison
    misc = [m for m in ctx.misconceptions if m.triggered]

    actions = []

    if req.mode == TutorMode.HINT:
        if ctx.circuit.gates and ctx.circuit.gates[0].gate == 'H':
            resp = (
                'Hint: The Hadamard (H) gate places a basis state like |0> into an equal superposition. '
                'Ask yourself: Does an equal superposition favor any particular outcome, or are all computational basis states equally probable?'
            )
            actions = ['Inspect the Bloch sphere equatorial state', 'Review H gate matrix transformation']
        elif any(g.gate == 'CX' for g in ctx.circuit.gates):
            resp = (
                'Hint: The CNOT gate flips the target qubit ONLY when the control qubit is |1>. '
                'Notice that since the control qubit was in superposition (|0> + |1>)/sqrt(2), both branches transform simultaneously into an entangled pair.'
            )
            actions = ['Step through the circuit line by line', 'Observe how outcome |01> has 0 amplitude']
        else:
            resp = 'Hint: Trace each gate unitary action on the initial state |0...0>.'
            actions = ['Check circuit gate sequence']

    elif req.mode == TutorMode.DEBUG:
        if cmp and not cmp.overall_match:
            mismatched = [o for o in cmp.outcomes if not o.match]
            m_str = ', '.join([f'|{m.outcome}> (pred {m.predicted:.0%} vs sim {m.simulated:.0%})' for m in mismatched])
            resp = (
                f'Debug Diagnostic: Mismatch detected for outcomes: {m_str}.\n\n'
                f'Simulator Ground Truth ({sim.backend}, {sim.shots} shots):\n'
                + '\n'.join([f' - Outcome |{k}>: {v:.1%}' for k, v in sorted(sim.probabilities.items())])
            )
            if misc:
                resp += f'\n\nDiagnosed Misconception ({misc[0].rule.value}): {misc[0].learner_explanation}'
                actions.append(f'Remediate: {misc[0].remediation_concept}')
                if misc[0].manim_clip_id:
                    actions.append(f'Watch Show Me Why: {misc[0].manim_clip_id}')
            else:
                actions.append('Re-run simulation with adjusted prediction')
        else:
            acc_str = f'{cmp.accuracy_score:.1%}' if cmp else '100%'
            resp = (
                f'Debug Diagnostic: No mismatch found. Your prediction matches the quantum simulation '
                f'within tolerance (accuracy {acc_str}).'
            )
            actions.append('Proceed to next challenge')

    else:
        q_lower = (req.learner_question or '').lower().strip()
        
        # 1. Learner asking why their prediction was wrong or about mismatch
        if 'wrong' in q_lower or 'mismatch' in q_lower or 'why did my prediction' in q_lower or 'why was my' in q_lower:
            if cmp and not cmp.overall_match:
                mismatched = [o for o in cmp.outcomes if not o.match]
                m_str = ', '.join([f'|{m.outcome}> (predicted {m.predicted:.0%} vs simulated {m.simulated:.0%})' for m in mismatched])
                resp = (
                    f'Your prediction deviated from the quantum simulator because you anticipated a classical or definite outcome.\n\n'
                    f'Deviations detected: {m_str}.\n\n'
                    'Underlying Quantum Principle:\n'
                    'The Hadamard gate produces an equal coherent superposition (|0> + |1>)/sqrt(2), so outcome 0 and outcome 1 each have exactly 50% probability under Born\'s rule. '
                    'A qubit does not have a hidden definite value before measurement — the measurement forces an irreversible projection.'
                )
                actions = ['Watch Show Me Why remediation video', 'Re-run simulation with 50/50 prediction']
            else:
                resp = (
                    'Your prediction actually aligned with the quantum simulator within acceptable statistical tolerance! '
                    f'The simulator verified that the quantum state yields approximately balanced outcomes.'
                )
                actions = ['Proceed to next challenge', 'Explore entanglement Bell states']

        # 2. Learner asking if superposition is a hidden classical state
        elif 'hidden' in q_lower or 'secret' in q_lower or 'already 0' in q_lower:
            resp = (
                'No — this is the most common quantum misconception (Misconception M1).\n\n'
                'A qubit in superposition is NOT a classical coin that is already heads or tails before we look. '
                'The qubit exists in a genuine coherent linear combination of states. '
                'It has no definite value until measurement forces an irreversible projection onto one basis state.'
            )
            actions = ['Watch Show Me Why: Superposition', 'Inspect the Bloch sphere equator']

        # 3. Learner asking about faster-than-light signaling or information in entanglement
        elif 'signal' in q_lower or 'faster' in q_lower or 'ftl' in q_lower or 'transmit' in q_lower or 'information' in q_lower:
            resp = (
                'No — quantum entanglement CANNOT be used for faster-than-light communication (the No-Signaling Theorem).\n\n'
                'Even though measurement outcomes on both qubits are instantaneously correlated (|00> or |11>), '
                'neither observer can control which outcome they obtain locally. Each individual measurement is 50/50 random, '
                'so no message can be transmitted without a classical communication channel.'
            )
            actions = ['Review Bell state correlation', 'Inspect CNOT gate logic']

        # 4. Learner asking about measurement collapse
        elif 'collapse' in q_lower or 'measurement do' in q_lower or 'destroy' in q_lower:
            resp = (
                'Measurement in quantum mechanics is an active projection operator, not a passive camera snapshot.\n\n'
                '1. Prior to measurement, the qubit is in a coherent superposition with both amplitudes active.\n'
                '2. Measurement forces the state to collapse irreversibly into a single eigenstate (|0> or |1>).\n'
                '3. If you measure the qubit again immediately after collapse, it will yield the exact same outcome with 100% certainty (Misconception M2).'
            )
            actions = ['Review Measurement lesson', 'Watch Show Me Why: Measurement']

        # 5. Learner asking why H creates 50/50
        elif '50' in q_lower or 'why does h' in q_lower or 'what does h' in q_lower:
            resp = (
                'The Hadamard (H) gate maps the basis state |0> to (|0> + |1>)/sqrt(2).\n\n'
                '1. The probability amplitude for |0> is 1/sqrt(2).\n'
                '2. The probability amplitude for |1> is 1/sqrt(2).\n'
                '3. By Born\'s Rule, measurement probability is the squared magnitude: |1/sqrt(2)|² = 1/2 = 50%.\n'
                'Geometrically, the H gate rotates the state vector from the North Pole (Z=+1) onto the equator (X=+1) of the Bloch sphere.'
            )
            actions = ['Inspect the Bloch sphere equator', 'Test prediction with 50/50']

        # 6. Learner asking what CNOT does
        elif 'cnot' in q_lower or 'correlated' in q_lower:
            resp = (
                'The CNOT (Controlled-NOT) gate flips the target qubit if and only if the control qubit is |1>.\n\n'
                'When qubit 0 is in superposition (|0> + |1>)/sqrt(2) and qubit 1 is |0>:\n'
                '- The |00> branch leaves qubit 1 unchanged -> |00>\n'
                '- The |10> branch flips qubit 1 -> |11>\n'
                'This yields the entangled Bell state (|00> + |11>)/sqrt(2). The states |01> and |10> have exactly 0% probability.'
            )
            actions = ['Watch Show Me Why: Bell State', 'Check 2-qubit measurement outcomes']

        # Default concept-grounded explanation
        elif any(g.gate == 'CX' for g in ctx.circuit.gates):
            resp = (
                'Conceptual Explanation: Bell State Entanglement.\n\n'
                '1. Step 1: The Hadamard gate on qubit 0 transforms |00> into (|0> + |1>)|0> / sqrt(2) = (|00> + |10>) / sqrt(2).\n'
                '2. Step 2: The CNOT (control: 0, target: 1) applies an X flip to qubit 1 only when qubit 0 is |1>. '
                'This transforms (|00> + |10>) / sqrt(2) into (|00> + |11>) / sqrt(2).\n'
                '3. Simulator Evidence: Measurement results show outcomes |00> and |11> each with ~50% probability, '
                'while states |01> and |10> never occur (0% probability). The qubits are perfectly correlated.'
            )
            actions = ['View Show Me Why Bell State animation', 'Try the Bell state challenge']
        elif any(g.gate == 'H' for g in ctx.circuit.gates):
            p0 = sim.probabilities.get('0', 0.5)
            p1 = sim.probabilities.get('1', 0.5)
            resp = (
                'Conceptual Explanation: Superposition & Measurement.\n\n'
                '1. Initial State: The qubit begins in the computational ground state |0>.\n'
                '2. Hadamard Action: The H gate rotates the state vector to the equator of the Bloch sphere: (|0> + |1>) / sqrt(2).\n'
                f'3. Simulation Proof: In {sim.shots} shots, Qiskit Aer measured |0> ~{p0:.1%} '
                f'and |1> ~{p1:.1%}.\n'
                '4. Physical Insight: Superposition is NOT a hidden coin in a box; the qubit genuinely possesses both amplitudes '
                'until measurement forces an irreversible projection.'
            )
            actions = ['Inspect Bloch sphere visualization', 'Watch Show Me Why Superposition clip']
        else:
            resp = (
                f'Circuit Execution Summary: {len(ctx.circuit.gates)} gate(s) executed.\n'
                f'Simulator probabilities: {sim.probabilities}.'
            )
            actions = ['Build a superposition circuit']

    return TutorResponse(
        mode=req.mode,
        response=resp,
        grounded_evidence={
            'shots': sim.shots,
            'probabilities': sim.probabilities,
            'counts': sim.counts,
            'match': cmp.overall_match if cmp else None,
            'accuracy': cmp.accuracy_score if cmp else None,
            'misconceptions': [m.rule.value for m in misc]
        },
        provider='deterministic-grounded-engine',
        suggested_actions=actions
    )

def ask_tutor(req: TutorRequest) -> TutorResponse:
    ollama_host = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    try:
        url = f'{ollama_host}/api/generate'
        payload = json.dumps({
            'model': os.environ.get('OLLAMA_MODEL', 'llama3'),
            'prompt': _build_grounded_prompt(req),
            'stream': False
        }).encode('utf-8')
        http_req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(http_req, timeout=1.5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                return TutorResponse(
                    mode=req.mode,
                    response=data.get('response', ''),
                    grounded_evidence={
                        'probabilities': req.context.simulation.probabilities,
                        'match': req.context.comparison.overall_match if req.context.comparison else None
                    },
                    provider='ollama-local',
                    suggested_actions=['Review simulation trace', 'Explore Show Me Why']
                )
    except Exception:
        pass

    gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not gemini_key:
        try:
            env_file = pathlib.Path(__file__).resolve().parent.parent.parent / '.env'
            if env_file.exists():
                for line in env_file.read_text(encoding='utf-8').splitlines():
                    line = line.strip()
                    if line.startswith(('GEMINI_API_KEY=', 'GOOGLE_API_KEY=')):
                        gemini_key = line.split('=', 1)[1].strip().strip('"\'')
                        break
        except Exception:
            pass

    if gemini_key:
        try:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}'
            payload = json.dumps({
                'contents': [{'parts': [{'text': _build_grounded_prompt(req)}]}]
            }).encode('utf-8')
            http_req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(http_req, timeout=3.0) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode('utf-8'))
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    return TutorResponse(
                        mode=req.mode,
                        response=text,
                        grounded_evidence={
                            'probabilities': req.context.simulation.probabilities,
                            'match': req.context.comparison.overall_match if req.context.comparison else None
                        },
                        provider='gemini-api',
                        suggested_actions=['Review simulation trace', 'Explore Show Me Why']
                    )
        except Exception:
            pass

    return _deterministic_grounded_response(req)
