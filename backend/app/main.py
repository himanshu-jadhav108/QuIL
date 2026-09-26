"""FastAPI application entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="Quantum Intelligence Learning Lab",
    description="SIH26140 — AI-Based Interactive Quantum Algorithm Learning Platform",
    version="0.1.0",
)

# Robust CORS configuration for hosting on Render and Vercel
cors_origins_env = os.environ.get("CORS_ORIGINS", "").strip()

if cors_origins_env and cors_origins_env != "*":
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Allow local development and any cloud deployment (e.g. Vercel, Render)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return {
        "service": "Quantum Intelligence Learning Lab API (Eureka Forge)",
        "status": "online",
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_url": "/api/v1/health",
        "frontend_url": frontend_url,
        "message": f"Backend API is active. Connect your frontend ({frontend_url}) or view /docs for API documentation."
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "quantum-intelligence-lab", "simulator_ready": True}
