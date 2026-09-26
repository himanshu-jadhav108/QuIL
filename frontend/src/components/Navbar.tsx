import React from 'react';
import { ConceptName } from '../types/quantum';
import { Cpu, Atom, BookOpen, BrainCircuit, Activity, Award, PlayCircle, Layers } from 'lucide-react';

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
  selectedConcept = 'superposition',
  onSelectConcept,
}) => {
  const primaryNav: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Workspace', icon: <Activity className='w-3.5 h-3.5' /> },
    { id: 'predict', label: '1. Predict', icon: <BrainCircuit className='w-3.5 h-3.5' /> },
    { id: 'circuit', label: '2. Circuit Lab', icon: <Atom className='w-3.5 h-3.5' /> },
    { id: 'results', label: '3. Evidence & Compare', icon: <Cpu className='w-3.5 h-3.5' /> },
    { id: 'tutor', label: '4. Grounded Tutor', icon: <BrainCircuit className='w-3.5 h-3.5' /> },
    { id: 'manim', label: '5. Show Me Why', icon: <PlayCircle className='w-3.5 h-3.5' /> },
    { id: 'challenges', label: '6. Challenges', icon: <Award className='w-3.5 h-3.5' /> },
    { id: 'mastery', label: 'Mastery', icon: <Layers className='w-3.5 h-3.5' /> },
  ];

  return (
    <header className='border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3'>
        {/* Brand */}
        <div
          className='flex items-center gap-3 cursor-pointer shrink-0'
          onClick={() => setActiveTab('dashboard')}
        >
          <img
            src='/logo.png'
            alt='QuIL Logo'
            className='w-8 h-8 rounded-lg object-contain border border-slate-800 bg-slate-900 p-0.5'
          />
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-sm tracking-wide text-white'>QuIL</span>
              <span className='text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono'>
                SIH26140
              </span>
            </div>
            <p className='text-[11px] text-slate-400'>Quantum Intelligence Learning Lab</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className='flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none'>
          {primaryNav.map((item) => {
            const isActive = activeTab === item.id || (activeTab === 'lesson' && item.id === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Simulator Status Indicator */}
        <div className='hidden xl:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-md border border-slate-800/80 bg-slate-900/40'>
          <span
            className={`w-2 h-2 rounded-full ${
              simulatorReady ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-amber-400'
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
