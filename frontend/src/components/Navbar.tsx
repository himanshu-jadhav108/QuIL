import React from 'react';
import Image from 'next/image';
import { ConceptName } from '../types/quantum';
import { BookOpen, BrainCircuit, Cpu, Award, Layers, ChevronRight, Zap } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'lesson'
  | 'predict'
  | 'circuit'
  | 'results'
  | 'trace'
  | 'tutor'
  | 'manim'
  | 'challenges'
  | 'mastery';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  simulatorReady: boolean;
  selectedConcept?: ConceptName;
  onSelectConcept?: (c: ConceptName) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  simulatorReady,
}) => {
  // Simple, unified learning-path indicator: Lesson → Predict → Simulate → Understand
  const learningPath: {
    id: ActiveTab;
    label: string;
    isActive: boolean;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'dashboard',
      label: 'Lesson',
      isActive: activeTab === 'dashboard' || activeTab === 'lesson',
      icon: <BookOpen className='w-3 h-3' />,
    },
    {
      id: 'predict',
      label: 'Predict',
      isActive: activeTab === 'predict',
      icon: <BrainCircuit className='w-3 h-3' />,
    },
    {
      id: 'circuit',
      label: 'Simulate',
      isActive: activeTab === 'circuit',
      icon: <Zap className='w-3 h-3' />,
    },
    {
      id: 'results',
      label: 'Understand',
      isActive: activeTab === 'results' || activeTab === 'tutor' || activeTab === 'manim' || activeTab === 'trace',
      icon: <Cpu className='w-3 h-3' />,
    },
  ];

  const isChallengesActive = activeTab === 'challenges';
  const isMasteryActive = activeTab === 'mastery';

  return (
    <header className='border-b border-slate-800 bg-[#080c14]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3'>
        {/* Brand */}
        <div
          className='flex items-center gap-2.5 cursor-pointer shrink-0'
          onClick={() => setActiveTab('dashboard')}
        >
          <Image
            src='/logo.png'
            alt='QuIL Logo'
            width={28}
            height={28}
            className='w-7 h-7 rounded-md object-contain border border-slate-800 bg-[#0d1424] p-0.5'
            priority
          />
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-sm tracking-wide text-white'>QuIL</span>
              <span className='text-[10px] px-1.5 py-0.2 rounded bg-[#0d1424] text-slate-400 border border-slate-800 font-mono'>
                SIH26140
              </span>
            </div>
            <p className='text-[11px] text-slate-400 leading-none'>Quantum Intelligence Learning Lab</p>
          </div>
        </div>

        {/* Simplified Learning-Path Stepper: Lesson → Predict → Simulate → Understand */}
        <nav className='flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none'>
          <div className='flex items-center gap-1 bg-[#0d1424] px-2 py-1 rounded-lg border border-slate-800'>
            {learningPath.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveTab(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    step.isActive
                      ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center shrink-0 ${
                      step.isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
                {idx < learningPath.length - 1 && (
                  <ChevronRight className='w-3 h-3 text-slate-600 shrink-0' />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className='h-4 w-px bg-slate-800 mx-1 shrink-0 hidden sm:block' />

          {/* Secondary practice entries */}
          <div className='hidden sm:flex items-center gap-1'>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                isChallengesActive
                  ? 'bg-[#0d1424] text-cyan-300 border border-slate-700 font-medium'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Award className='w-3 h-3 text-slate-400' />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => setActiveTab('mastery')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                isMasteryActive
                  ? 'bg-[#0d1424] text-cyan-300 border border-slate-700 font-medium'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Layers className='w-3 h-3 text-slate-400' />
              <span>Mastery</span>
            </button>
          </div>
        </nav>

        {/* Live Simulator Telemetry */}
        <div className='hidden xl:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-md border border-slate-800 bg-[#0d1424]'>
          <span
            className={`w-2 h-2 rounded-full ${
              simulatorReady ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className='text-slate-400'>Aer Simulator:</span>
          <span className={simulatorReady ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
            {simulatorReady ? 'Online (1,024 Shots)' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
