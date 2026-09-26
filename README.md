# Quantum Intelligence Learning Lab (Eureka Forge)

## 🚀 Deployment & Production Hosting

📖 **Looking to deploy your own instance? Read the complete [Step-by-Step Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md).**

| Service | Architecture | Recommended Host |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, Tailwind CSS, Lucide) | [Vercel](https://vercel.com) |
| **Backend** | Python 3.11, FastAPI, Qiskit Aer | [Render](https://render.com) |

> **SIH26140 â€” AI-Based Interactive Quantum Algorithm Learning Platform**  
> *Core Principle: "Simulator computes. Everything else reads."*

---

## Overview

**Eureka Forge** is an interactive, scientifically grounded quantum learning platform designed to help undergraduate and graduate learners master quantum computing. Instead of passive lecture videos or ungrounded chatbots that hallucinate physics calculations, Eureka Forge enforces an active, simulation-driven learning cycle:

$$\text{Predict} \longrightarrow \text{Build} \longrightarrow \text{Simulate} \longrightarrow \text{Compare} \longrightarrow \text{Diagnose} \longrightarrow \text{Explain} \longrightarrow \text{Show Me Why} \longrightarrow \text{Challenge} \longrightarrow \text{Mastery}$$

---

## Key Architecture & Core Rules

1. **Simulator is the Source of Quantum Truth:** All statevectors, unitary transformations, and measurement probabilities are computed strictly by **Qiskit Aer** (`qiskit-aer`). The LLM **never** calculates or overrides quantum numbers.
2. **Deterministic Misconception Detection:** Discrepancies between predictions and simulation results trigger mathematical rules (M1â€“M4), not probabilistic AI guesses.
3. **Grounded AI Tutoring:** The conversational tutor is strictly grounded on the exact Aer shot counts, comparison deltas, and detected misconception IDs.
4. **Visual Remediation ("Show Me Why"):** Contextual animations and Bloch sphere diagrams provide instant geometric clarification when numerical mismatches occur.
5. **Measurable Mastery:** Mastery advancement (*Learning* $\to$ *Practicing* $\to$ *Mastered*) is derived mathematically from challenge submissions and prediction accuracy.

---

## Tech Stack

- **Frontend:** Next.js (App Router, Turbopack), React, TypeScript, Tailwind CSS, Lucide Icons
- **Visualizations:** Interactive SVG 3D Bloch Sphere, Canvas Quantum Gate Rails, Probability Histograms
- **Backend:** Python 3.14+, FastAPI, Pydantic v2
- **Simulation Engine:** Qiskit 1.x & Qiskit Aer (`AerSimulator`)
- **Animation & Visual Media:** Manim CE ("Show Me Why" clips & SVG fallbacks)
- **AI Tutoring Layer:** Local-first Ollama / Gemini API with deterministic offline fallback

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create & activate a virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
python run.py
```
- **Backend API:** `http://127.0.0.1:8000`
- **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/v1/health`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- **Web Application:** `http://localhost:3000`

### 3. Run Verification Tests

The platform includes a 29-test verification suite covering golden circuits, the learning loop, and end-to-end demo rehearsals:

```bash
cd backend
python -m pytest -v
```
*(All 29 tests execute in ~11 seconds with 100% pass rate).*

To test the frontend production build:
```bash
cd frontend
npm run build
```

---

## Supported Test Circuits

### 1. Quantum Superposition ($H|0\rangle$)
- **Circuit:** `q0: â”€â”€Hâ”€â”€â”€â”€M`
- **Theoretical State:** $|\psi\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$
- **Bloch Coordinates:** Equatorial rotation $(\theta = \pi/2, \phi = 0)$ along $+X$.
- **Ideal Probabilities:** $P(0) \approx 50\%, P(1) \approx 50\%$ (verified with $\pm 15\%$ stochastic tolerance).

### 2. Quantum Entanglement (Bell State $|\Phi^+\rangle$)
- **Circuit:**
  ```text
  q0: â”€â”€Hâ”€â”€â”€â”€â—â”€â”€â”€â”€M
             â”‚
  q1: â”€â”€â”€â”€â”€â”€â”€âŠ•â”€â”€â”€â”€M
  ```
- **Theoretical State:** $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$
- **Ideal Probabilities:** $P(00) \approx 50\%, P(11) \approx 50\%, P(01) = 0\%, P(10) = 0\%$.

---

## Misconception Engine (Rules M1â€“M4)

| Rule ID | Misconception Trigger | Pedagogical Explanation | Remediation |
| :---: | :--- | :--- | :--- |
| **M1** | Superposition treated as hidden classical value ($P(0) = 1.0$) | The qubit does not hold a secret predetermined bit; it exists in a coherent amplitude distribution until measurement collapses it. | `clip_superposition` |
| **M2** | Measurement expected not to alter state | Measurement is an active projection operator, not a passive camera snapshot. | `clip_measurement` |
| **M3** | Entanglement interpreted as FTL communication | Quantum entanglement produces correlated outcomes without transmitting any classical signal faster than light. | `clip_bell` |
| **M4** | Phase treated as identical to probability | Relative phase ($e^{i\phi}$) alters interference patterns even when basis probabilities appear identical. | Phase interference walkthrough |

---

## API Endpoints Reference

All endpoints are served under `/api/v1`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns simulator status, engine version, and backend readiness. |
| `POST` | `/simulate` | Runs a canonical circuit or concept preset through Qiskit Aer (1â€“100,000 shots). |
| `POST` | `/compare` | Deterministically compares learner prediction against simulator output with tolerance matching. |
| `POST` | `/diagnose` | Evaluates comparison results against Misconception Rules M1â€“M4. |
| `GET` | `/trace` | Returns step-by-step gate execution events and state labels. |
| `POST` | `/tutor` | Generates a grounded conceptual explanation using execution evidence. |
| `GET` | `/manim/select` | Returns the appropriate "Show Me Why" video clip and fallback diagram. |
| `GET` | `/challenges` | Lists adaptive challenges for a given quantum concept. |
| `POST` | `/challenges/submit` | Deterministically grades challenge submissions and calculates score delta. |
| `GET` | `/mastery` | Returns overall learner progress and concept-level mastery profiles. |
| `GET` | `/circuits/golden` | Retrieves pre-configured benchmark circuits for $H|0\rangle$ and Bell State. |

---

## Demonstration Script Summary

1. **Dashboard:** Verify live simulator connectivity (`Qiskit Aer: ONLINE`).
2. **Superposition Lesson:** Review the $H|0\rangle$ circuit wire.
3. **Prediction:** Learner submits expected measurement probabilities prior to simulation.
4. **Simulation:** Qiskit Aer computes 1,024 shots in $\approx 3\text{ ms}$.
5. **Comparison & Diagnosis:** Mathematical comparison highlights any delta; M1 rule triggers on classical predictions.
6. **AI Tutor:** Grounded explanation cites exact shot counts and statevector geometry.
7. **Manim "Show Me Why":** Visual animation demonstrates Bloch sphere equatorial rotation.
8. **Bell State:** Learner constructs and runs the 2-qubit entanglement circuit.
9. **Adaptive Challenge:** Learner answers conceptual challenge with deterministic grading.
10. **Mastery:** Competency metrics update in real-time (*Learning* $\to$ *Practicing* $\to$ *Mastered*).

---

## Evidence & Honesty Contract

- **Built (Working in Submitted Prototype):**
  - Qiskit Aer shot-based simulation engine.
  - Interactive Next.js circuit canvas & 3D SVG Bloch sphere.
  - Deterministic prediction comparison & misconception engine (M1â€“M4).
  - Simulator-grounded AI tutor layer with offline fallback.
  - Pre-rendered Manim "Show Me Why" selector & visual diagram fallbacks.
  - Quantitative mastery tracking and adaptive challenges.
- **Architected (Data Model / Schema in Place):**
  - Canonical circuit schema supporting multi-backend adapters.
- **Future Scope (Phase 2 & 3 Roadmap):**
  - PennyLane & Cirq execution adapters.
  - Real cloud QPU execution (IBM Quantum / AWS Braket).
  - Noise-aware learning ($T_1/T_2$ relaxation).
  - Multi-tenant classroom dashboards & cohort analytics.

---

## License

Developed for the Smart India Hackathon (SIH 2026) â€” Problem Statement **SIH26140**.


