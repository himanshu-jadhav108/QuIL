import React from 'react';
import { ConceptName } from '../types/quantum';
import { Cpu, Atom, BrainCircuit, Activity, Award, PlayCircle, Layers, ChevronRight } from 'lucide-react';

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
  // Core sequential learning loop steps
  const sequentialSteps: { id: ActiveTab; stepNumber: number; label: string; icon: React.ReactNode }[] = [
    { id: 'predict', stepNumber: 1, label: 'Predict', icon: <BrainCircuit className='w-3 h-3' /> },
    { id: 'circuit', stepNumber: 2, label: 'Circuit View', icon: <Atom className='w-3 h-3' /> },
    { id: 'results', stepNumber: 3, label: 'Evidence & Compare', icon: <Cpu className='w-3 h-3' /> },
    { id: 'tutor', stepNumber: 4, label: 'Grounded Tutor', icon: <BrainCircuit className='w-3 h-3' /> },
    { id: 'manim', stepNumber: 5, label: 'Show Me Why', icon: <PlayCircle className='w-3 h-3' /> },
    { id: 'challenges', stepNumber: 6, label: 'Challenges', icon: <Award className='w-3 h-3' /> },
  ];

  const isWorkspaceActive = activeTab === 'dashboard' || activeTab === 'lesson';
  const isMasteryActive = activeTab === 'mastery';

  return (
    <header className='border-b border-slate-800 bg-[#080c14]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2'>
      <div className='max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3'>
        {/* Brand */}
        <div
          className='flex items-center gap-2.5 cursor-pointer shrink-0'
          onClick={() => setActiveTab('dashboard')}
        >
          <img
            src='/logo.png'
            alt='QuIL Logo'
            className='w-7 h-7 rounded-md object-contain border border-slate-800 bg-[#0d1424] p-0.5'
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

        {/* Navigation Bar with Step Indicator */}
        <nav className='flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0 scrollbar-none'>
          {/* Distinct Entry Point: Workspace */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
              isWorkspaceActive
                ? 'bg-[#0d1424] text-cyan-300 border border-slate-700 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1424] border border-transparent'
            }`}
          >
            <Activity className='w-3.5 h-3.5' />
            <span>Workspace</span>
          </button>

          {/* Stepper Divider */}
          <div className='h-4 w-px bg-slate-800 mx-1 shrink-0' />

          {/* Sequential 6-Step Indicator */}
          <div className='flex items-center gap-1 bg-[#0d1424]/60 p-0.5 rounded-lg border border-slate-800/80'>
            {sequentialSteps.map((step, idx) => {
              const isActive = activeTab === step.id;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveTab(step.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-800 text-cyan-300 font-medium border border-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <span className='hidden sm:inline'>{step.label}</span>
                  </button>
                  {idx < sequentialSteps.length - 1 && (
                    <ChevronRight className='w-3 h-3 text-slate-600 shrink-0 hidden md:block' />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Stepper Divider */}
          <div className='h-4 w-px bg-slate-800 mx-1 shrink-0' />

          {/* Distinct Entry Point: Mastery */}
          <button
            onClick={() => setActiveTab('mastery')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
              isMasteryActive
                ? 'bg-[#0d1424] text-cyan-300 border border-slate-700 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1424] border border-transparent'
            }`}
          >
            <Layers className='w-3.5 h-3.5' />
            <span>Mastery</span>
          </button>
        </nav>

        {/* Live Simulator Telemetry */}
        <div className='hidden xl:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-md border border-slate-800 bg-[#0d1424]'>
          <span
            className={`w-2 h-2 rounded-full ${
              simulatorReady ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className='text-slate-400'>Qiskit Aer:</span>
          <span className={simulatorReady ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
            {simulatorReady ? 'Online (1,024 Shots)' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
