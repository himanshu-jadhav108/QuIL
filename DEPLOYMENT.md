# 🚀 Deployment Guide: Hosting Eureka Forge on Render & Vercel

This repository is fully configured and ready for production hosting with a decoupled architecture:
- **Backend (Python / FastAPI / Qiskit Aer):** Hosted on **[Render](https://render.com)** as a Web Service.
- **Frontend (Next.js / React / TypeScript / Tailwind CSS):** Hosted on **[Vercel](https://vercel.com)**.

---

## 📋 Architecture Overview

```
 ┌──────────────────────────────────────────────────┐
 │  Learner's Browser                               │
 └─────────────┬────────────────────────┬───────────┘
               │ (Web App / UI)         │ (Direct REST API / JSON)
               ▼                        ▼
 ┌──────────────────────────┐    ┌──────────────────────────┐
 │      Vercel Hosting      │    │      Render Hosting      │
 │  (Next.js 16 Frontend)   │    │ (FastAPI + Qiskit Aer)   │
 │                          │    │                          │
 │  https://your-app.       │    │  https://your-api.       │
 │        vercel.app        │    │        onrender.com      │
 └──────────────────────────┘    └─────────────┬────────────┘
                                               │
                                               ▼
                                 ┌──────────────────────────┐
                                 │ Local Simulator / Qiskit │
                                 │ (Deterministic Engine)   │
                                 └──────────────────────────┘
```

---

## 🟢 Part 1: Deploy Backend on Render (Step-by-Step)

The backend provides the Qiskit Aer quantum simulation engine, deterministic misconception grading, and grounded tutor endpoints.

### Option A: 1-Click Deployment via `render.yaml` Blueprint (Recommended)

1. **Push your code** to your GitHub repository (e.g. `https://github.com/your-username/eureka-forge`).
2. Log in to your **[Render Dashboard](https://dashboard.render.com/)**.
3. In the top bar, click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect the [`render.yaml`](file:///d:/Projects/eureka-forge-quantum/render.yaml) file in the root.
6. Click **Apply**. Render will:
   - Create a Web Service with Python 3.11.9
   - Set the root directory to `backend`
   - Run `pip install -r requirements.txt`
   - Bind to dynamic `$PORT` with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Configure health checks against `/health`
7. Once deployed, note down your Render Web Service URL (e.g., `https://quantum-intelligence-backend.onrender.com`).

---

### Option B: Manual Web Service Deployment on Render

If you prefer setting up the web service manually:

1. Log in to **[Render](https://dashboard.render.com/)**.
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your repo.
4. Fill in the following fields:
   - **Name:** `quantum-intelligence-backend` (or your choice)
   - **Region:** Choose closest to your target audience (e.g., Oregon, Frankfurt, Singapore)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **Advanced** and configure:
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`
   - **Environment Variables:**
     - `PYTHON_VERSION` = `3.11.9`
     - `CORS_ORIGINS` = `*` (or your Vercel URL once known)
     - *(Optional)* `GEMINI_API_KEY` = `your_gemini_api_key_here` (for live Gemini tutor answers)
6. Click **Create Web Service**.
7. Wait 2–3 minutes for the build to finish. Once live, test it in your browser:
   - `https://<your-service>.onrender.com/` (Should display JSON API welcome message)
   - `https://<your-service>.onrender.com/health` (Should return `{"status": "ok", "simulator_ready": true}`)
   - `https://<your-service>.onrender.com/docs` (Should open interactive Swagger UI)

> [!NOTE]
> **Render Free Tier Cold Starts:** Render free services spin down after 15 minutes of inactivity. The first request after sleep takes ~30–45 seconds to spin up. The frontend includes automatic polling and an informative wake-up notification while the simulator starts up.

---

## 🔵 Part 2: Deploy Frontend on Vercel (Step-by-Step)

The frontend is a modern Next.js App Router application built with React and Tailwind CSS.

### Step 1: Import Project to Vercel
1. Log in to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`eureka-forge-quantum`).

### Step 2: Configure Project Settings
In the **Configure Project** screen:

1. **Framework Preset:** `Next.js`
2. **Root Directory:**
   - Click **Edit** next to **Root Directory**.
   - Select or type `frontend` and click **Continue**.
3. **Build and Output Settings:**
   - Leave default (`npm run build` and Next.js default output).
4. **Environment Variables:**
   - Add a new variable:
     - **Key:** `NEXT_PUBLIC_API_URL`
     - **Value:** `https://<your-render-service>.onrender.com` (Your Render backend URL from Part 1)
     *(Note: The frontend code automatically normalizes trailing slashes and ensures `/api/v1` is cleanly routed).*

### Step 3: Deploy
1. Click **Deploy**.
2. Vercel will install dependencies and compile the Next.js production bundle in ~1 minute.
3. Once finished, click **Go to Dashboard** or **Visit** to see your live platform (e.g. `https://eureka-forge-quantum.vercel.app`)!

---

## 🔗 Part 3: Connecting & Verifying the Fullstack Integration

1. Open your live Vercel frontend URL in your browser.
2. Look at the top navigation bar:
   - `Qiskit Aer: ONLINE` (green badge) indicates full end-to-end communication with your Render backend.
3. Test the core loop:
   - Click **Run Simulation**: Qiskit Aer executes 1,024 shots in real-time.
   - Switch to **Misconception Diagnosis**: Adjust prediction sliders and click **Compare & Diagnose**.
   - Switch to **AI Tutor**: Ask a question or click **Explain** to receive evidence-grounded feedback.
   - Switch to **Show Me Why**: Inspect the visual state explanation and Bloch sphere projection.
   - Switch to **Challenges**: Answer a question to verify deterministic grading and mastery score updates.

---

## 🛠️ Troubleshooting & Frequently Asked Questions

### 1. CORS Errors (Cross-Origin Resource Sharing)
- **Symptom:** Browser console shows `Access to fetch has been blocked by CORS policy`.
- **Solution:** In [`backend/app/main.py`](file:///d:/Projects/eureka-forge-quantum/backend/app/main.py), CORS is configured with `allow_origin_regex=r"^https?://.*"` by default, allowing all Vercel domains and preview URLs. If you prefer strict domain whitelisting, set `CORS_ORIGINS` in your Render environment variables:
  ```env
  CORS_ORIGINS=https://eureka-forge-quantum.vercel.app,https://your-custom-domain.com
  ```

### 2. Backend Spinning Up / Cold Start Warning
- **Symptom:** Yellow banner appears on first load: *"Connecting to Quantum Engine... (Render free tier takes ~30-45s to wake up if sleeping)"*.
- **Explanation:** This is standard behavior on Render's free tier. The frontend will automatically poll every 4 seconds until the backend wakes up, after which the banner disappears and `Qiskit Aer: ONLINE` turns green.
- **Optional Fix:** Upgrade Render to the Starter tier ($7/mo) or use a free uptime monitoring service (like UptimeRobot) to ping `https://<your-service>.onrender.com/health` every 10 minutes to keep it warm.

### 3. Missing `NEXT_PUBLIC_API_URL`
- If you deploy the frontend before setting `NEXT_PUBLIC_API_URL`, you can add it at any time:
  1. Go to Vercel Project > **Settings** > **Environment Variables**.
  2. Add `NEXT_PUBLIC_API_URL`.
  3. Go to **Deployments** > click the three dots on the latest deployment > **Redeploy**.

---

## 🐳 Alternative: Running with Docker Locally

To test both frontend and backend locally in containerized environments identical to cloud hosts:

```bash
# Build and start all services
docker compose up --build

# Backend will run on http://localhost:8000
# Frontend will run on http://localhost:3000
```
