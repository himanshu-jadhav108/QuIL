# ⚛️ QuIL — Quantum Intelligence Learning Lab

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Qiskit Aer](https://img.shields.io/badge/Qiskit_Aer-0.17+-6929C4?style=for-the-badge&logo=qiskit&logoColor=white)](https://qiskit.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)

**SIH 2026 — Problem Statement SIH26140: AI-Based Interactive Quantum Algorithm Learning Platform**  
*Eureka Forge Prototype — Level 3 Complete Learning Loop*

> **"Students predict. The simulator proves. AI explains why."**  
> *Core Architectural Rule: The simulator computes. Everything else reads.*

[🚀 Live Hosting Guide](./DEPLOYMENT.md) • [📖 Architecture](#-architecture--active-learning-loop) • [✨ Key Features](#-key-features) • [⚡ Quick Start](#-quick-start) • [📡 API Reference](#-api-endpoints-reference)

</div>

---

## 🌟 Overview

**QuIL (Quantum Intelligence Learning Lab)** is an interactive, scientifically grounded learning platform engineered to help learners master gate-model quantum computing. 

Traditional quantum tutorials suffer from two major flaws:
1. **Passive learning:** Students watch lectures or read static equations without developing intuition for state transformations.
2. **Ungrounded AI chatbots:** Standard LLMs frequently hallucinate quantum calculations, invent impossible probabilities, and violate unitarity.

**QuIL solves this by enforcing a closed-loop, simulator-grounded active learning pedagogy:**

$$\text{Predict} \longrightarrow \text{Build} \longrightarrow \text{Simulate} \longrightarrow \text{Compare} \longrightarrow \text{Diagnose} \longrightarrow \text{Explain} \longrightarrow \text{Show Me Why} \longrightarrow \text{Challenge} \longrightarrow \text{Mastery}$$

Every quantum state, unitary evolution, and shot-based distribution is computed **strictly by Qiskit Aer**. The AI tutor and diagnostic engine operate exclusively as evidence-grounded observers that never invent or override physics calculations.

---

## 🏛️ Architecture & Active Learning Loop

```
Learner Action (Circuit / Prediction)
     │
     ▼
Canonical Circuit Schema (qubits, gates, parameters)
     │
     ▼
Qiskit Aer Simulator (1,024 shots / Statevector)
     │
     ▼
Structured Execution Trace (delays, unitary transformations, counts)
     │
 ┌───┴───────────────┬───────────────────┬───────────────────┐
 │                   │                   │                   │
 ▼                   ▼                   ▼                   ▼
Bloch Sphere &      Deterministic       Grounded AI         Visual Remediation
Probability Rails   Diagnostic Engine   Tutor Service       ("Show Me Why")
(Real-Time Visual)  (Rules M1–M4)       (Ollama / Gemini)   (Manim Geometric Clips)
 │                   │                   │                   │
 └───────────────────┼───────────────────┼───────────────────┘
                     │
                     ▼
          Quantified Mastery Matrix
       (Learning → Practicing → Mastered)
```

---

## ✨ Key Features

### ⚛️ 1. True Quantum Simulation (Qiskit Aer)
- Real shot-based stochastic simulation ($1$ to $100,000$ shots) and exact statevector derivation.
- No mocked probabilities or pre-baked answers: every run triggers genuine quantum circuit compilation and execution.

### 🎯 2. Predict-Before-Simulate Pedagogy
- Learners must commit to their expected probability distributions prior to running circuits.
- Active prediction forces cognitive engagement and exposes underlying conceptual gaps.

### 🧠 3. Deterministic Misconception Diagnostics (Rules M1–M4)
- Mismatches between predictions and simulation outputs trigger **deterministic pedagogical rules**, avoiding AI guesswork:
  - **M1 (Hidden Variable):** Learner assumes a qubit secretly possesses a definite classical value before measurement ($P(0) = 1.0$ on $H|0\rangle$).
  - **M2 (Passive Measurement):** Learner expects measurement does not alter the state vector or collapse superposition.
  - **M3 (FTL Signaling):** Learner interprets Bell-state entanglement as instantaneous classical communication.
  - **M4 (Phase Blindness):** Learner treats relative phase ($e^{i\phi}$) as identical to measurement probabilities.

### 🤖 4. Zero-Hallucination Grounded AI Tutor
- Backed by local **Ollama (Llama 3)** or **Google Gemini API**, with an instant offline deterministic pedagogical engine.
- Every prompt is injected with hard simulation evidence: exact shot counts, comparison deltas, gate sequence, and triggered rule IDs.
- Modes: **Explain** (conceptual clarity), **Hint** (guiding questions), and **Debug** (pinpointing mathematical deviations).

### 🌐 5. Interactive 3D Bloch Sphere & Gate Rails
- Real-time 2D/3D canvas rendering of the Bloch sphere state vector $(\theta, \phi)$ with equatorial projection.
- Visual quantum circuit wire displays with real-time gate sequence highlighting.

### 🎬 6. "Show Me Why" Geometric Remediation
- Integrated **Manim CE** animation selector mapping diagnosed misconceptions to precise geometric transformations.
- Instant, rich visual diagram fallbacks for environments without video streaming.

### 🏆 7. Quantitative Mastery Matrix
- Tracks student competency mathematically across introductory quantum concepts (*Superposition*, *Measurement*, *Entanglement*).
- Progression (*Learning* $\to$ *Practicing* $\to$ *Mastered*) is driven strictly by challenge scores and prediction accuracy.

---

## 🚀 Deployment & Production Hosting

QuIL is architected as a decoupled full-stack platform:
- **Backend:** Python 3.11 + FastAPI on **[Render](https://render.com)** (configured via [`render.yaml`](./render.yaml)).
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS on **[Vercel](https://vercel.com)**.

> 📖 **For complete step-by-step instructions, view the [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md).**

### Quick Hosting Overview

| Component | Platform | Configuration |
|---|---|---|
| **Backend API** | Render | Blueprint via `render.yaml` or Web Service with root `backend`, Python 3.11.9, start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Frontend Web** | Vercel | Import repo, set **Root Directory** to `frontend`, add `NEXT_PUBLIC_API_URL` pointing to your Render backend |

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** 20.x or higher
- **Docker & Docker Compose** (Optional, for containerized run)

---

### Option A: Running with Docker Compose (Recommended)

Run both the frontend and backend with a single command:

```bash
docker compose up --build
```
- **Frontend Web UI:** `http://localhost:3000`
- **Backend API & Swagger Docs:** `http://localhost:8000/docs`

---

### Option B: Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Create & activate a virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
python run.py
```
- **API Server:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
- **Web App:** `http://localhost:3000`

---

## 🧪 Verification & Test Suite

The backend includes a comprehensive 29-test test suite covering golden circuits, the active learning loop, and end-to-end demo rehearsals:

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

## 🔬 Benchmark Golden Circuits

### 1. Quantum Superposition ($H|0\rangle$)
```
q₀: ───[ H ]───[ M ]───
```
- **State Vector:** $|\psi\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$
- **Bloch Sphere Coordinates:** Equatorial rotation $(\theta = \pi/2, \phi = 0)$ along $+X$.
- **Simulated Outcomes:** $P(0) \approx 50\%, P(1) \approx 50\%$ (stochastic verification with $\pm 15\%$ tolerance across 1,024 shots).

### 2. Quantum Entanglement (Bell State $|\Phi^+\rangle$)
```
q₀: ───[ H ]───●───[ M ]───
               │
q₁: ───────────⊕───[ M ]───
```
- **State Vector:** $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$
- **Simulated Outcomes:** $P(00) \approx 50\%, P(11) \approx 50\%$, with $P(01) = 0\%, P(10) = 0\%$.

---

## 📡 API Endpoints Reference

All application endpoints are served under `/api/v1` (with root health checks at `/health`):

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/health` | Root health check for Render/Uptime monitoring (returns `200 OK`). |
| `GET` | `/api/v1/health` | Diagnostic check returning simulator engine readiness and version. |
| `POST` | `/api/v1/simulate` | Executes circuit or concept preset via Qiskit Aer ($1$–$100,000$ shots). |
| `POST` | `/api/v1/compare` | Compares student prediction against Aer simulation results. |
| `POST` | `/api/v1/diagnose` | Evaluates comparison results against Misconception Rules M1–M4. |
| `POST` | `/api/v1/run-and-compare` | Unified pipeline: simulates, compares, and diagnoses in one call. |
| `GET` | `/api/v1/trace` | Returns step-by-step gate execution sequence and state labels. |
| `POST` | `/api/v1/tutor` | Generates a grounded conceptual response using simulator evidence. |
| `GET` | `/api/v1/manim/clips` | Lists all available Manim visual animation clips. |
| `GET` | `/api/v1/manim/select` | Contextually selects visual remediation clip for a diagnosed misconception. |
| `GET` | `/api/v1/challenges` | Lists interactive concept challenges and quiz prompts. |
| `POST` | `/api/v1/challenges/submit` | Deterministically grades challenge answers and updates score deltas. |
| `GET` | `/api/v1/mastery` | Returns the learner's overall and concept-level mastery profile. |
| `GET` | `/api/v1/circuits/golden` | Retrieves canonical benchmark circuits for Hadamard and Bell State. |

---

## 📂 Project Structure

```
QuIL/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py         # 14 REST endpoints under /api/v1
│   │   ├── schemas/
│   │   │   └── models.py         # Pydantic schemas (circuits, predictions, mastery)
│   │   ├── services/
│   │   │   ├── simulator.py      # Qiskit Aer simulation engine
│   │   │   ├── comparison.py     # Deterministic prediction comparator
│   │   │   ├── misconception.py  # Mathematical diagnostic rules (M1–M4)
│   │   │   ├── tutor.py          # Grounded AI Tutor (Ollama / Gemini / Offline)
│   │   │   ├── manim.py          # "Show Me Why" visual clip selector
│   │   │   └── challenges.py     # Deterministic challenge grader & mastery tracker
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── tests/                    # 29 Pytest verification test suite
│   ├── Dockerfile                # Production Python 3.11 container
│   ├── requirements.txt          # Python dependencies (Qiskit, Aer, FastAPI)
│   └── run.py                    # Local development server launcher
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Next.js root layout & typography
│   │   │   └── page.tsx          # Main interactive Quantum Learning Lab UI
│   │   ├── components/
│   │   │   ├── AITutorPanel.tsx  # Evidence-grounded tutor chat interface
│   │   │   ├── BlochSphere.tsx   # Interactive HTML5 3D Bloch sphere
│   │   │   ├── CircuitCanvas.tsx # Visual gate rails & qubit wire viewer
│   │   │   ├── Histogram.tsx     # Shot count & probability bar charts
│   │   │   ├── ManimPlayer.tsx   # "Show Me Why" visual explanation player
│   │   │   ├── ChallengeView.tsx # Interactive graded mastery challenge card
│   │   │   ├── MasteryView.tsx   # Visual competency breakdown
│   │   │   ├── Navbar.tsx        # Status header with live simulator badge
│   │   │   └── TraceViewer.tsx   # Step-by-step gate execution trace
│   │   ├── lib/
│   │   │   └── api.ts            # Typed client with auto-normalizing API URL
│   │   └── types/
│   │       └── quantum.ts        # TypeScript interfaces matching backend models
│   ├── Dockerfile                # Standalone Next.js multi-stage container
│   ├── package.json              # Next.js 16, React 19, Lucide dependencies
│   ├── vercel.json               # Vercel deployment configuration
│   └── next.config.ts            # Next.js build configuration
├── DEPLOYMENT.md                 # Complete Step-by-Step Render & Vercel hosting guide
├── docker-compose.yml            # Multi-container orchestration
├── render.yaml                   # 1-Click Render Blueprint configuration
└── README.md                     # Project documentation
```

---

## 📋 Evidence & Honesty Contract

| Layer | Implementation Status | Ground Truth Source |
|---|---|---|
| **Quantum Simulator** | ✅ Fully Functional (100% Built) | Qiskit Aer (`AerSimulator`) executes real circuits |
| **Diagnostic Rules (M1–M4)** | ✅ Fully Functional (100% Built) | Mathematical delta comparison against simulation ground truth |
| **Grounded AI Tutor** | ✅ Fully Functional (100% Built) | Prompt context strictly limited to simulator output + offline fallback |
| **Interactive UI & Visuals** | ✅ Fully Functional (100% Built) | Next.js 16 + Canvas Bloch Sphere + Tailwind CSS |
| **Mastery Tracking** | ✅ Fully Functional (100% Built) | Deterministic score deltas updated on challenge completion |
| **Cloud QPU Integration** | 🔮 Roadmap (Phase 2 & 3) | Target: IBM Quantum runtime & AWS Braket provider adapters |
| **Noise-Aware Simulation** | 🔮 Roadmap (Phase 2 & 3) | Target: Thermal relaxation ($T_1/T_2$) & depolarizing error channels |

---

## 📜 License & Acknowledgments

- **Developed for:** Smart India Hackathon (SIH 2026) — Problem Statement **SIH26140**.
- **Team:** Eureka Forge
- **Core Technology:** Built on [IBM Qiskit](https://qiskit.org), [FastAPI](https://fastapi.tiangolo.com), and [Next.js](https://nextjs.org).
