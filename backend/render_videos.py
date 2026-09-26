"""
Generate pre-rendered Manim-style instructional educational videos for QuIL.
Outputs web-ready MP4 files to frontend/public/videos/:
  - manim_superposition.mp4
  - manim_measurement.mp4
  - manim_bell.mp4
"""
from __future__ import annotations
import math
import os
import pathlib
import subprocess
import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle

OUTPUT_DIR = pathlib.Path(__file__).parent.parent / "frontend" / "public" / "videos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 1280, 720
DPI = 100
FPS = 30
BG_COLOR = "#080c16"
CARD_BG = "#0f172a"
CYAN = "#38bdf8"
EMERALD = "#34d399"
PURPLE = "#a855f7"
AMBER = "#fbbf24"
TEXT_WHITE = "#f8fafc"
TEXT_MUTED = "#94a3b8"
TEXT_DIM = "#64748b"


def fig_to_bgr(fig):
    """Convert Matplotlib figure to BGR numpy array for OpenCV."""
    fig.canvas.draw()
    rgba = np.asarray(fig.canvas.buffer_rgba())
    rgb = rgba[:, :, :3]
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def finalize_video(raw_path: pathlib.Path, final_path: pathlib.Path):
    """Use ffmpeg to ensure standard H.264 yuv420p web-ready playback."""
    cmd = [
        "ffmpeg", "-y", "-i", str(raw_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(final_path)
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if raw_path.exists():
            raw_path.unlink()
        print(f"-> Successfully finalized {final_path.name}")
    except Exception as e:
        print(f"FFmpeg transcode error: {e}. Renaming raw video.")
        if raw_path.exists() and not final_path.exists():
            raw_path.rename(final_path)


# =============================================================================
# 1. SUPERPOSITION VIDEO
# =============================================================================
def render_superposition_video():
    filepath = OUTPUT_DIR / "manim_superposition.mp4"
    raw_path = OUTPUT_DIR / "temp_superposition.avi"
    print(f"Rendering Superposition video to {filepath}...")
    
    total_frames = 150  # 5.0 seconds @ 30 fps
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    writer = cv2.VideoWriter(str(raw_path), fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(total_frames):
        t = frame_idx / FPS
        
        if t < 1.2:
            theta = 0.0
            p0 = 1.0
            p1 = 0.0
            gate_active = False
            state_label = "|0⟩"
            stage_desc = "Initial Ground State: Pure basis state |0⟩ along Z-axis"
        elif t < 3.2:
            rot_prog = (t - 1.2) / 2.0
            s = 0.5 - 0.5 * math.cos(math.pi * rot_prog)
            theta = s * (math.pi / 2)
            p0 = 1.0 - 0.5 * s
            p1 = 0.5 * s
            gate_active = True
            state_label = "cos(θ)|0⟩ + sin(θ)|1⟩"
            stage_desc = "Hadamard Transformation: Rotating 90° onto the equatorial plane"
        else:
            theta = math.pi / 2
            p0 = 0.50
            p1 = 0.50
            gate_active = False
            state_label = "(|0⟩ + |1⟩) / √2"
            stage_desc = "Equal Superposition (|+⟩): Coherent balanced state before measurement"

        fig = plt.figure(figsize=(WIDTH / DPI, HEIGHT / DPI), dpi=DPI, facecolor=BG_COLOR)
        ax = fig.add_axes([0, 0, 1, 1], facecolor=BG_COLOR)
        ax.set_xlim(0, 16)
        ax.set_ylim(0, 9)
        ax.axis('off')

        # Header Banner
        ax.text(1.0, 8.3, "QUIL QUANTUM INTELLIGENCE LEARNING LAB", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')
        ax.text(1.0, 7.8, "Concept: Quantum Superposition & The Hadamard Gate", fontsize=18, color=TEXT_WHITE, weight='bold')
        ax.text(1.0, 7.35, stage_desc, fontsize=12, color=AMBER if gate_active else TEXT_MUTED)

        # Left Panel: Bloch Sphere
        box_bloch = FancyBboxPatch((0.8, 1.2), 6.8, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_bloch)
        ax.text(1.2, 6.4, "BLOCH SPHERE STATE EVOLUTION", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')

        center_x, center_y, radius = 4.2, 3.7, 2.0
        sphere_bg = Circle((center_x, center_y), radius, fc="#090d16", ec="#334155", lw=1.8)
        ax.add_patch(sphere_bg)

        # Equator
        equator_y_r = radius * 0.32
        eq_x = center_x + radius * np.cos(np.linspace(0, 2*np.pi, 100))
        eq_y = center_y + equator_y_r * np.sin(np.linspace(0, 2*np.pi, 100))
        ax.plot(eq_x, eq_y, color="#334155", linestyle="--", lw=1.2)

        # Z axis
        ax.plot([center_x, center_x], [center_y - radius*1.15, center_y + radius*1.15], color="#475569", lw=1.2)
        ax.text(center_x, center_y + radius*1.22, "|0⟩ (Z=+1)", color=TEXT_WHITE, fontsize=11, weight='bold', ha='center')
        ax.text(center_x, center_y - radius*1.32, "|1⟩ (Z=-1)", color=TEXT_MUTED, fontsize=10, ha='center')

        # X axis
        ax.plot([center_x - radius*1.05, center_x + radius*1.05], [center_y, center_y], color="#475569", lw=1.0, linestyle=":")
        ax.text(center_x + radius*1.12, center_y, "|+⟩ (X=+1)", color=CYAN, fontsize=10, va='center')

        # State vector
        vec_x = center_x + radius * math.sin(theta)
        vec_y = center_y + radius * math.cos(theta) * 0.85 + (radius * math.sin(theta) * 0.15)
        ax.annotate("", xy=(vec_x, vec_y), xytext=(center_x, center_y),
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=CYAN, lw=3.0))
        ax.plot([vec_x], [vec_y], marker="o", markersize=8, color=CYAN, markeredgecolor="white", markeredgewidth=1.5)

        badge = FancyBboxPatch((center_x - 1.8, 1.45), 3.6, 0.6, boxstyle="round,pad=0.1", fc="#1e293b", ec=CYAN if gate_active else "#334155", lw=1.2)
        ax.add_patch(badge)
        ax.text(center_x, 1.75, f"|ψ⟩ = {state_label}", color=CYAN, fontsize=11, weight='bold', ha='center', va='center')

        # Right Panel: Probabilities
        box_right = FancyBboxPatch((8.2, 1.2), 7.0, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_right)
        ax.text(8.6, 6.4, "QUANTUM STATE TRANSFORMATION", fontsize=11, color=EMERALD, weight='bold', fontfamily='monospace')

        ax.text(8.6, 5.8, "1. Input Basis State:", fontsize=10, color=TEXT_DIM, fontfamily='monospace')
        ax.text(9.0, 5.4, "|0⟩  =  [ 1 ,  0 ]ᵀ", fontsize=12, color=TEXT_WHITE, fontfamily='monospace', weight='bold')

        ax.text(8.6, 4.85, "2. Hadamard Unitary Matrix (H):", fontsize=10, color=TEXT_DIM, fontfamily='monospace')
        h_color = AMBER if gate_active else CYAN
        ax.text(9.0, 4.45, "H = (1/√2) · [  1    1  ]", fontsize=11, color=h_color, fontfamily='monospace', weight='bold')
        ax.text(9.0, 4.15, "            [  1   -1  ]", fontsize=11, color=h_color, fontfamily='monospace', weight='bold')

        ax.text(8.6, 3.65, "3. Measurement Probabilities P(k) = |⟨k|ψ⟩|²:", fontsize=10, color=TEXT_DIM, fontfamily='monospace')

        bar_y_0, bar_y_1 = 3.0, 2.3
        bar_max_w = 4.2

        ax.text(8.6, bar_y_0 + 0.15, f"|0⟩ Outcome:  {p0*100:4.1f}%", fontsize=11, color=TEXT_WHITE, fontfamily='monospace', weight='bold')
        bar_bg_0 = FancyBboxPatch((8.6, bar_y_0 - 0.2), bar_max_w, 0.22, boxstyle="square,pad=0", fc="#1e293b", ec="none")
        ax.add_patch(bar_bg_0)
        bar_fill_0 = FancyBboxPatch((8.6, bar_y_0 - 0.2), max(bar_max_w * p0, 0.05), 0.22, boxstyle="square,pad=0", fc=CYAN, ec="none")
        ax.add_patch(bar_fill_0)

        ax.text(8.6, bar_y_1 + 0.15, f"|1⟩ Outcome:  {p1*100:4.1f}%", fontsize=11, color=TEXT_WHITE, fontfamily='monospace', weight='bold')
        bar_bg_1 = FancyBboxPatch((8.6, bar_y_1 - 0.2), bar_max_w, 0.22, boxstyle="square,pad=0", fc="#1e293b", ec="none")
        ax.add_patch(bar_bg_1)
        bar_fill_1 = FancyBboxPatch((8.6, bar_y_1 - 0.2), max(bar_max_w * p1, 0.05), 0.22, boxstyle="square,pad=0", fc=EMERALD, ec="none")
        ax.add_patch(bar_fill_1)

        ax.plot([8.6, 14.8], [1.7, 1.7], color="#334155", lw=1.0)
        ax.text(8.6, 1.45, "Key Takeaway: The H gate creates an equal 50/50 superposition.", fontsize=10, color=AMBER, weight='bold')

        ax.text(15.2, 0.4, "QuIL Pedagogical Video Engine · SIH26140", fontsize=9, color=TEXT_DIM, fontfamily='monospace', ha='right')

        bgr = fig_to_bgr(fig)
        writer.write(bgr)
        plt.close(fig)

    writer.release()
    finalize_video(raw_path, filepath)


# =============================================================================
# 2. MEASUREMENT VIDEO
# =============================================================================
def render_measurement_video():
    filepath = OUTPUT_DIR / "manim_measurement.mp4"
    raw_path = OUTPUT_DIR / "temp_measurement.avi"
    print(f"Rendering Measurement video to {filepath}...")
    
    total_frames = 150  # 5.0 seconds @ 30 fps
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    writer = cv2.VideoWriter(str(raw_path), fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(total_frames):
        t = frame_idx / FPS
        
        if t < 1.5:
            stage = "PRE-MEASUREMENT"
            stage_desc = "Superposition: Qubit exists simultaneously in |0⟩ and |1⟩ with equal amplitudes"
            p0, p1 = 0.5, 0.5
            collapsed = False
            flash = 0.0
        elif t < 2.3:
            stage = "MEASUREMENT INTERACTION"
            stage_desc = "Detector Coupling: Projective measurement operator M forces collapse"
            p0, p1 = 0.5, 0.5
            collapsed = False
            flash = (t - 1.5) / 0.8
        elif t < 3.5:
            stage = "STATE COLLAPSE"
            stage_desc = "Wavefunction Collapse: Indeterminate superposition collapses to |0⟩"
            p0_prog = (t - 2.3) / 1.2
            p0 = 0.5 + 0.5 * (1.0 - math.exp(-4 * p0_prog))
            p1 = 1.0 - p0
            collapsed = True
            flash = max(0.0, 1.0 - (t - 2.3) * 1.5)
        else:
            stage = "POST-MEASUREMENT STATE"
            stage_desc = "State Update: Collapsed state is now permanently |0⟩ (100% repeatable)"
            p0, p1 = 1.0, 0.0
            collapsed = True
            flash = 0.0

        fig = plt.figure(figsize=(WIDTH / DPI, HEIGHT / DPI), dpi=DPI, facecolor=BG_COLOR)
        ax = fig.add_axes([0, 0, 1, 1], facecolor=BG_COLOR)
        ax.set_xlim(0, 16)
        ax.set_ylim(0, 9)
        ax.axis('off')

        # Header Banner
        ax.text(1.0, 8.3, "QUIL QUANTUM INTELLIGENCE LEARNING LAB", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')
        ax.text(1.0, 7.8, "Concept: Quantum Measurement & Wavefunction Collapse", fontsize=18, color=TEXT_WHITE, weight='bold')
        ax.text(1.0, 7.35, stage_desc, fontsize=12, color=AMBER if stage == "MEASUREMENT INTERACTION" else (EMERALD if collapsed else TEXT_MUTED))

        # Left Panel: Amplitudes
        box_left = FancyBboxPatch((0.8, 1.2), 6.8, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_left)
        ax.text(1.2, 6.4, "COHERENT AMPLITUDE DYNAMICS", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')

        amp0_x, amp1_x = 2.4, 4.8
        base_y, max_h = 2.2, 3.2
        h0 = max_h * math.sqrt(p0)
        h1 = max_h * math.sqrt(p1)

        if not collapsed:
            osc = 0.08 * math.sin(2 * math.pi * 2.5 * t)
            h0 += osc
            h1 -= osc

        bar0 = FancyBboxPatch((amp0_x - 0.6, base_y), 1.2, max(h0, 0.08), boxstyle="round,pad=0.05",
                              fc="#0284c7" if not collapsed else EMERALD, ec=TEXT_WHITE if collapsed else "none", lw=1.5)
        ax.add_patch(bar0)
        ax.text(amp0_x, base_y - 0.45, "|0⟩ Basis", color=TEXT_WHITE, fontsize=12, weight='bold', ha='center')
        ax.text(amp0_x, base_y + max(h0, 0.08) + 0.25, f"α={math.sqrt(p0):.2f}", color=CYAN, fontsize=11, weight='bold', ha='center')

        bar1 = FancyBboxPatch((amp1_x - 0.6, base_y), 1.2, max(h1, 0.08), boxstyle="round,pad=0.05",
                              fc="#8b5cf6" if not collapsed else "#334155", ec="none")
        ax.add_patch(bar1)
        ax.text(amp1_x, base_y - 0.45, "|1⟩ Basis", color=TEXT_MUTED, fontsize=12, ha='center')
        ax.text(amp1_x, base_y + max(h1, 0.08) + 0.25, f"β={math.sqrt(p1):.2f}", color="#c084fc" if not collapsed else TEXT_DIM, fontsize=11, weight='bold', ha='center')

        det_box = FancyBboxPatch((6.0, 4.5), 1.2, 1.2, boxstyle="round,pad=0.1",
                                fc="#f59e0b" if flash > 0.1 else "#1e293b",
                                ec=AMBER, lw=1.5)
        ax.add_patch(det_box)
        ax.text(6.6, 5.1, "DETECTOR", color="#0f172a" if flash > 0.1 else AMBER, fontsize=8, weight='bold', ha='center', va='center', fontfamily='monospace')
        ax.text(6.6, 4.75, "M̂ [Z]", color="#0f172a" if flash > 0.1 else TEXT_WHITE, fontsize=11, weight='bold', ha='center', va='center')

        # Right Panel: Mechanics
        box_right = FancyBboxPatch((8.2, 1.2), 7.0, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_right)
        ax.text(8.6, 6.4, "WAVEFUNCTION COLLAPSE MECHANICS", fontsize=11, color=EMERALD, weight='bold', fontfamily='monospace')

        ax.text(8.6, 5.8, "1. State Before Measurement:", fontsize=10, color=TEXT_DIM, fontfamily='monospace')
        ax.text(9.0, 5.4, "|ψ⟩  =  (1/√2)|0⟩  +  (1/√2)|1⟩", fontsize=12, color=CYAN, fontfamily='monospace', weight='bold')

        ax.text(8.6, 4.85, "2. Born Rule Projection Operator:", fontsize=10, color=TEXT_DIM, fontfamily='monospace')
        ax.text(9.0, 4.45, "P(0) = |⟨0|ψ⟩|² = 50%    P(1) = |⟨1|ψ⟩|² = 50%", fontsize=11, color=TEXT_WHITE, fontfamily='monospace')

        ax.text(8.6, 3.85, "3. Observed Single Measurement Event:", fontsize=10, color=TEXT_DIM, fontfamily='monospace')
        if collapsed:
            ax.text(9.0, 3.45, "Result:  PROJECTION TO |0⟩  (Detected)", fontsize=12, color=EMERALD, fontfamily='monospace', weight='bold')
            ax.text(9.0, 3.10, "Post-collapse state:  |ψ'⟩ = |0⟩  (Irreversible)", fontsize=11, color=AMBER, fontfamily='monospace')
        else:
            ax.text(9.0, 3.45, "Pending detector readout...", fontsize=12, color=TEXT_MUTED, fontfamily='monospace')
            ax.text(9.0, 3.10, "State is coherent; not yet projected.", fontsize=11, color=TEXT_DIM, fontfamily='monospace')

        m2_box = FancyBboxPatch((8.6, 1.45), 6.2, 1.35, boxstyle="round,pad=0.1", fc="#1e293b", ec=AMBER if collapsed else "#334155", lw=1.2)
        ax.add_patch(m2_box)
        ax.text(8.8, 2.55, "Misconception M2 Alert:", fontsize=10, color=AMBER, weight='bold', fontfamily='monospace')
        ax.text(8.8, 2.20, "Measurement is NOT a passive camera snapshot.", fontsize=10, color=TEXT_WHITE)
        ax.text(8.8, 1.85, "It actively destroys the superposition. Repeating measurement yields the same outcome.", fontsize=9, color=TEXT_MUTED)

        ax.text(15.2, 0.4, "QuIL Pedagogical Video Engine · SIH26140", fontsize=9, color=TEXT_DIM, fontfamily='monospace', ha='right')

        bgr = fig_to_bgr(fig)
        writer.write(bgr)
        plt.close(fig)

    writer.release()
    finalize_video(raw_path, filepath)


# =============================================================================
# 3. BELL STATE / ENTANGLEMENT VIDEO
# =============================================================================
def render_bell_video():
    filepath = OUTPUT_DIR / "manim_bell.mp4"
    raw_path = OUTPUT_DIR / "temp_bell.avi"
    print(f"Rendering Bell Entanglement video to {filepath}...")
    
    total_frames = 150  # 5.0 seconds @ 30 fps
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    writer = cv2.VideoWriter(str(raw_path), fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(total_frames):
        t = frame_idx / FPS
        
        if t < 1.2:
            stage_desc = "Step 1: Two independent qubits initialized to ground state |00⟩"
            p00, p01, p10, p11 = 1.0, 0.0, 0.0, 0.0
            h_active, cx_active = False, False
            state_str = "|00⟩"
        elif t < 2.6:
            prog = (t - 1.2) / 1.4
            s = 0.5 - 0.5 * math.cos(math.pi * prog)
            stage_desc = "Step 2: Hadamard on q₀ creates superposition (|00⟩ + |10⟩)/√2"
            p00 = 1.0 - 0.5 * s
            p10 = 0.5 * s
            p01, p11 = 0.0, 0.0
            h_active, cx_active = True, False
            state_str = f"√{p00:.2f}|00⟩ + √{p10:.2f}|10⟩"
        elif t < 3.8:
            prog = (t - 2.6) / 1.2
            s = 0.5 - 0.5 * math.cos(math.pi * prog)
            stage_desc = "Step 3: CNOT flips target q₁ ONLY when control q₀ is |1⟩ -> Entangled |Φ⁺⟩"
            p00 = 0.50
            p10 = 0.50 * (1.0 - s)
            p11 = 0.50 * s
            p01 = 0.0
            h_active, cx_active = False, True
            state_str = "(|00⟩ + |11⟩) / √2"
        else:
            stage_desc = "Step 4: Non-separable Bell State: 100% correlated outcomes |00⟩ and |11⟩"
            p00, p01, p10, p11 = 0.50, 0.0, 0.0, 0.50
            h_active, cx_active = False, False
            state_str = "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2"

        fig = plt.figure(figsize=(WIDTH / DPI, HEIGHT / DPI), dpi=DPI, facecolor=BG_COLOR)
        ax = fig.add_axes([0, 0, 1, 1], facecolor=BG_COLOR)
        ax.set_xlim(0, 16)
        ax.set_ylim(0, 9)
        ax.axis('off')

        # Header Banner
        ax.text(1.0, 8.3, "QUIL QUANTUM INTELLIGENCE LEARNING LAB", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')
        ax.text(1.0, 7.8, "Concept: Quantum Entanglement & The Canonical Bell State", fontsize=18, color=TEXT_WHITE, weight='bold')
        ax.text(1.0, 7.35, stage_desc, fontsize=12, color=AMBER if cx_active else (CYAN if h_active else EMERALD))

        # Left Panel: Circuit
        box_left = FancyBboxPatch((0.8, 1.2), 6.8, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_left)
        ax.text(1.2, 6.4, "BELL STATE CIRCUIT EVOLUTION", fontsize=11, color=CYAN, weight='bold', fontfamily='monospace')

        wire_y0, wire_y1 = 4.8, 3.2
        ax.plot([1.6, 7.0], [wire_y0, wire_y0], color="#64748b", lw=2.0)
        ax.text(1.3, wire_y0, "q₀: |0⟩", color=TEXT_WHITE, fontsize=11, weight='bold', va='center')
        ax.plot([1.6, 7.0], [wire_y1, wire_y1], color="#64748b", lw=2.0)
        ax.text(1.3, wire_y1, "q₁: |0⟩", color=TEXT_WHITE, fontsize=11, weight='bold', va='center')

        h_x = 3.2
        h_gate = FancyBboxPatch((h_x - 0.45, wire_y0 - 0.45), 0.9, 0.9, boxstyle="round,pad=0.05",
                                fc=AMBER if h_active else "#1e293b", ec=AMBER if h_active else CYAN, lw=1.8)
        ax.add_patch(h_gate)
        ax.text(h_x, wire_y0, "H", color="#0f172a" if h_active else CYAN, fontsize=13, weight='bold', ha='center', va='center')

        cx_x = 5.2
        c_dot = Circle((cx_x, wire_y0), 0.22, fc=AMBER if cx_active else PURPLE, ec=TEXT_WHITE, lw=1.2)
        ax.add_patch(c_dot)
        ax.plot([cx_x, cx_x], [wire_y0, wire_y1], color=AMBER if cx_active else PURPLE, lw=2.2)
        t_target = Circle((cx_x, wire_y1), 0.38, fc="#0f172a", ec=AMBER if cx_active else PURPLE, lw=2.2)
        ax.add_patch(t_target)
        ax.plot([cx_x - 0.25, cx_x + 0.25], [wire_y1, wire_y1], color=AMBER if cx_active else PURPLE, lw=2.0)
        ax.plot([cx_x, cx_x], [wire_y1 - 0.25, wire_y1 + 0.25], color=AMBER if cx_active else PURPLE, lw=2.0)

        badge = FancyBboxPatch((1.6, 1.6), 5.2, 0.8, boxstyle="round,pad=0.1", fc="#1e293b", ec=EMERALD if t >= 3.8 else CYAN, lw=1.5)
        ax.add_patch(badge)
        ax.text(4.2, 2.0, f"State:  {state_str}", color=EMERALD if t >= 3.8 else CYAN, fontsize=11, weight='bold', ha='center', va='center', fontfamily='monospace')

        # Right Panel: Outcomes
        box_right = FancyBboxPatch((8.2, 1.2), 7.0, 5.7, boxstyle="round,pad=0.2", fc=CARD_BG, ec="#1e293b", lw=1.5)
        ax.add_patch(box_right)
        ax.text(8.6, 6.4, "2-QUBIT COMPOSITE MEASUREMENT OUTCOMES", fontsize=11, color=EMERALD, weight='bold', fontfamily='monospace')

        outcomes = [
            ("|00⟩", p00, CYAN, "Correlated (q₀=0, q₁=0)"),
            ("|01⟩", p01, "#64748b", "Mismatched (Impossible in Φ⁺)"),
            ("|10⟩", p10, "#64748b", "Transient intermediate state"),
            ("|11⟩", p11, EMERALD, "Correlated (q₀=1, q₁=1)"),
        ]

        bar_start_y, bar_step, bar_max_w = 5.6, 1.0, 4.2

        for i, (label, prob, color, note) in enumerate(outcomes):
            y = bar_start_y - i * bar_step
            ax.text(8.6, y + 0.15, f"{label} Outcome:  {prob*100:4.1f}%", fontsize=10, color=TEXT_WHITE, fontfamily='monospace', weight='bold')
            ax.text(11.8, y + 0.15, note, fontsize=8, color=TEXT_MUTED)

            b_bg = FancyBboxPatch((8.6, y - 0.2), bar_max_w, 0.22, boxstyle="square,pad=0", fc="#1e293b", ec="none")
            ax.add_patch(b_bg)
            b_fill = FancyBboxPatch((8.6, y - 0.2), max(bar_max_w * prob, 0.04), 0.22, boxstyle="square,pad=0", fc=color, ec="none")
            ax.add_patch(b_fill)

        ax.plot([8.6, 14.8], [1.85, 1.85], color="#334155", lw=1.0)
        ax.text(8.6, 1.55, "Key Takeaway: Outcomes |01⟩ and |10⟩ have ZERO probability.", fontsize=10, color=AMBER, weight='bold')
        ax.text(8.6, 1.30, "Measuring q₀ instantly determines q₁: perfect quantum correlation.", fontsize=9, color=TEXT_MUTED)

        ax.text(15.2, 0.4, "QuIL Pedagogical Video Engine · SIH26140", fontsize=9, color=TEXT_DIM, fontfamily='monospace', ha='right')

        bgr = fig_to_bgr(fig)
        writer.write(bgr)
        plt.close(fig)

    writer.release()
    finalize_video(raw_path, filepath)


if __name__ == "__main__":
    render_superposition_video()
    render_measurement_video()
    render_bell_video()
    print("All 3 Manim videos rendered successfully into frontend/public/videos/!")
