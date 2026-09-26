import React, { useState, useEffect } from 'react';
import { ManimClip, ConceptName } from '../types/quantum';
import { PlayCircle, RefreshCw, Film, BookOpen } from 'lucide-react';

interface Props {
  clip: ManimClip | null;
  loading: boolean;
  concept: ConceptName;
  onFetch: () => void;
}

export const ManimPlayer: React.FC<Props> = ({ clip, loading, concept, onFetch }) => {
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setVideoError(false);
  }, [clip?.clip_id]);
  return (
    <div className='bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between pb-4 border-b border-slate-800'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center'>
            <PlayCircle className='w-4 h-4 text-violet-400' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-white'>Show Me Why — Manim Visualisation</h3>
            <p className='text-xs text-slate-400 font-mono capitalize'>
              Concept: {concept}
            </p>
          </div>
        </div>
        <button
          onClick={onFetch}
          disabled={loading}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50'
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Fetching...' : 'Fetch Clip'}
        </button>
      </div>

      {loading && (
        <div className='flex items-center justify-center h-48 text-violet-300 gap-3 font-mono text-sm'>
          <Film className='w-5 h-5 animate-pulse' />
          Selecting Manim clip for {concept}...
        </div>
      )}

      {!loading && !clip && (
        <div className='flex flex-col items-center justify-center h-48 gap-3 text-slate-500'>
          <Film className='w-8 h-8 text-slate-700' />
          <p className='text-sm font-mono'>No clip loaded yet.</p>
          <button
            onClick={onFetch}
            className='px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all'
          >
            Load Visualisation
          </button>
        </div>
      )}

      {!loading && clip && (
        <div className='space-y-4'>
          <div className='p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2'>
            <h4 className='text-sm font-bold text-white'>{clip.title}</h4>
            <p className='text-xs text-slate-400'>{clip.description}</p>
            <div className='flex items-center gap-3 text-[11px] font-mono text-slate-500'>
              <span>Duration: {clip.duration_sec}s</span>
              <span>ID: {clip.clip_id}</span>
            </div>
          </div>

          {clip.video_url && !videoError ? (
            <video
              src={clip.video_url}
              controls
              onError={() => setVideoError(true)}
              className='w-full rounded-xl border border-slate-800 bg-black'
            />
          ) : (
            <div className='p-5 bg-slate-950/70 border border-violet-900/40 rounded-xl space-y-3'>
              <div className='flex items-center gap-2 text-xs font-mono text-violet-400'>
                <BookOpen className='w-4 h-4' />
                Visual Explanation
              </div>
              <p className='text-sm text-slate-200 leading-relaxed'>{clip.fallback_explanation}</p>
            </div>
          )}

          {clip.key_takeaways.length > 0 && (
            <div className='space-y-2'>
              <h5 className='text-xs font-mono text-slate-500 uppercase tracking-widest'>Key Takeaways</h5>
              <ul className='space-y-1.5'>
                {clip.key_takeaways.map((t, i) => (
                  <li key={i} className='flex items-start gap-2 text-sm text-slate-300'>
                    <span className='text-violet-400 font-bold mt-0.5'>→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
