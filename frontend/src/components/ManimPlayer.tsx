import React, { useState } from 'react';
import { ManimClip, ConceptName } from '../types/quantum';
import { PlayCircle, RefreshCw, BookOpen, CheckCircle2, Film, Sparkles } from 'lucide-react';

interface Props {
  clip: ManimClip | null;
  loading: boolean;
  concept: ConceptName;
  onFetch: () => void;
  mode?: 'lesson' | 'remediation';
  titleOverride?: string;
}

export const ManimPlayer: React.FC<Props> = ({
  clip,
  loading,
  concept,
  onFetch,
  mode = 'remediation',
  titleOverride,
}) => {
  const [videoError, setVideoError] = useState(false);

  // Map concept directly to static video asset if clip.video_url is not set
  const videoUrl =
    clip?.video_url ||
    (concept === 'superposition'
      ? '/videos/manim_superposition.mp4'
      : concept === 'measurement'
      ? '/videos/manim_measurement.mp4'
      : '/videos/manim_bell.mp4');

  const isLesson = mode === 'lesson';

  return (
    <div className='bg-[#0d1424] border border-slate-800 rounded-xl p-5 space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between pb-3 border-b border-slate-800/80'>
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400'>
            {isLesson ? <Film className='w-3.5 h-3.5' /> : <PlayCircle className='w-3.5 h-3.5' />}
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-200'>
              {titleOverride || (isLesson ? 'Visual Concept Demonstration' : 'Show Me Why — Visual Remediation')}
            </h3>
            <p className='text-[11px] text-slate-400 font-mono'>
              Pre-rendered Manim Instruction · Concept: <span className='capitalize text-cyan-300'>{concept}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setVideoError(false);
            onFetch();
          }}
          disabled={loading}
          className='flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors disabled:opacity-50'
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Reload'}</span>
        </button>
      </div>

      {loading && (
        <div className='flex items-center justify-center h-52 text-slate-400 gap-3 font-mono text-xs bg-slate-950/80 rounded-lg border border-slate-800'>
          <div className='w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin' />
          <span>Loading visual demonstration for {concept}...</span>
        </div>
      )}

      {!loading && !clip && (
        <div className='flex flex-col items-center justify-center h-52 gap-3 text-slate-400 bg-slate-950/80 rounded-lg border border-slate-800'>
          <BookOpen className='w-7 h-7 text-slate-600' />
          <p className='text-xs font-mono text-slate-400'>No visualization loaded for current context.</p>
          <button
            onClick={onFetch}
            className='px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors'
          >
            Load Visual Demonstration
          </button>
        </div>
      )}

      {!loading && clip && (
        <div className='space-y-4'>
          {/* Concept Header */}
          <div className='p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1'>
            <div className='flex items-center justify-between'>
              <h4 className='text-xs font-semibold text-white font-mono'>{clip.title}</h4>
              <span className='text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 uppercase'>
                {isLesson ? 'Core Lecture Video' : 'Misconception Remediation'}
              </span>
            </div>
            <p className='text-[11px] text-slate-300 leading-relaxed font-sans'>{clip.description}</p>
          </div>

          {/* HTML5 Video Player Container */}
          <div className='relative rounded-lg overflow-hidden border border-slate-800 bg-black/90 shadow-xl'>
            {!videoError && videoUrl ? (
              <div className='relative w-full aspect-video bg-black'>
                <video
                  key={videoUrl}
                  controls
                  playsInline
                  preload='metadata'
                  className='w-full h-full object-contain'
                  onError={() => setVideoError(true)}
                >
                  <source src={videoUrl} type='video/mp4' />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              /* Fallback Derivation Display if Video Fails */
              <div className='p-5 bg-slate-950/90 space-y-3'>
                <div className='flex items-center gap-2 text-xs font-mono text-cyan-400 font-medium pb-2 border-b border-slate-800/80'>
                  <BookOpen className='w-3.5 h-3.5' />
                  <span>Analytical State Evolution (Static Fallback)</span>
                </div>
                <p className='text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line'>
                  {clip.fallback_explanation}
                </p>
              </div>
            )}
          </div>

          {/* Key Conceptual Takeaways */}
          {clip.key_takeaways && clip.key_takeaways.length > 0 && (
            <div className='p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2'>
              <div className='text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5'>
                <Sparkles className='w-3 h-3 text-cyan-400' />
                <span>Key Takeaways for this Transformation:</span>
              </div>
              <ul className='space-y-1.5'>
                {clip.key_takeaways.map((takeaway, i) => (
                  <li key={i} className='flex items-start gap-2 text-xs text-slate-200 leading-relaxed'>
                    <CheckCircle2 className='w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5' />
                    <span>{takeaway}</span>
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
