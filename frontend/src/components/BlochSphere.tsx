import React, { useEffect, useRef } from 'react';
import { SimulationResult } from '../types/quantum';
import { Compass } from 'lucide-react';

interface Props {
  result: SimulationResult;
}

export const BlochSphere: React.FC<Props> = ({ result }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Derive polar angles from empirical probabilities */
  const p0 = result.probabilities['0'] ?? (result.probabilities['00'] ?? 0.5);
  // θ: [0, π], where p0 = cos²(θ/2) -> cos(θ) = 2*p0 - 1
  const theta = Math.acos(Math.max(-1, Math.min(1, 2 * p0 - 1)));
  const phi = 0; // azimuthal angle (real-valued amplitude assumption)

  /* Bloch coordinates */
  const bx = Math.sin(theta) * Math.cos(phi);
  const by = Math.sin(theta) * Math.sin(phi);
  const bz = Math.cos(theta);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.36;

    ctx.clearRect(0, 0, W, H);

    /* Sphere outline */
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    /* Equator ellipse (xy-plane) */
    ctx.beginPath();
    ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Coordinate Axes */
    const axes = [
      { dx: 0, dy: -1, label: '|0⟩ (+z)', color: '#06b6d4' },
      { dx: 0, dy: 1, label: '|1⟩ (-z)', color: '#818cf8' },
      { dx: 1, dy: 0, label: '+x', color: 'rgba(148, 163, 184, 0.6)' },
      { dx: -1, dy: 0, label: '-x', color: 'rgba(148, 163, 184, 0.3)' },
    ];

    axes.forEach(({ dx, dy, label, color }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * R * 1.12, cy + dy * R * 1.12);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.fillText(label, cx + dx * R * 1.18, cy + dy * R * 1.18);
    });

    /* State vector */
    const svX = cx + bx * R;
    const svY = cy - bz * R;

    /* Arrow line */
    ctx.beginPath();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(svX, svY);
    ctx.stroke();

    /* Precision arrowhead */
    const angle = Math.atan2(svY - cy, svX - cx);
    ctx.beginPath();
    ctx.fillStyle = '#00e5ff';
    ctx.moveTo(svX, svY);
    ctx.lineTo(svX - 9 * Math.cos(angle - 0.35), svY - 9 * Math.sin(angle - 0.35));
    ctx.lineTo(svX - 9 * Math.cos(angle + 0.35), svY - 9 * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fill();

    /* Center pivot dot */
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b';
    ctx.fill();

    /* State vector tip dot */
    ctx.beginPath();
    ctx.arc(svX, svY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }, [bx, bz]);

  return (
    <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            <Compass className='w-3.5 h-3.5' />
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              Bloch Sphere State Representation
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Equatorial Geometric Projection of Density Amplitudes
            </p>
          </div>
        </div>
        <div className='text-right text-[11px] font-mono text-slate-400'>
          <span className='text-cyan-300 font-semibold'>θ = {(theta * (180 / Math.PI)).toFixed(1)}°</span>
          <span className='text-slate-500'> · φ = 0.0°</span>
        </div>
      </div>

      {/* Canvas */}
      <div className='flex justify-center py-2'>
        <canvas
          ref={canvasRef}
          width={260}
          height={260}
          className='rounded-lg bg-slate-950/80 border border-slate-800/60'
        />
      </div>

      {/* Cartesian coordinates breakdown */}
      <div className='grid grid-cols-3 gap-2 text-xs font-mono'>
        {[
          { label: 'bx (X-axis)', val: bx, hint: 'Superposition amplitude' },
          { label: 'by (Y-axis)', val: by, hint: 'Phase imaginary component' },
          { label: 'bz (Z-axis)', val: bz, hint: '|0⟩ vs |1⟩ bias' },
        ].map(({ label, val, hint }) => (
          <div key={label} className='p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-center'>
            <div className='text-slate-500 text-[10px]'>{label}</div>
            <div className='text-slate-200 font-bold text-sm my-0.5'>{val.toFixed(3)}</div>
            <div className='text-[9px] text-slate-500 truncate'>{hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
