import React from 'react';
import { Cpu, Atom, BookOpen, BrainCircuit, Activity, Award, PlayCircle } from 'lucide-react';

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
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, simulatorReady }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className='w-4 h-4' /> },
    { id: 'lesson', label: '1. Lesson', icon: <BookOpen className='w-4 h-4' /> },
    { id: 'predict', label: '2. Predict', icon: <BrainCircuit className='w-4 h-4' /> },
    { id: 'circuit', label: '3. Circuit Lab', icon: <Atom className='w-4 h-4' /> },
    { id: 'results', label: '4. Compare', icon: <Cpu className='w-4 h-4' /> },
    { id: 'trace', label: '5. Trace', icon: <Activity className='w-4 h-4' /> },
    { id: 'tutor', label: '6. AI Tutor', icon: <BrainCircuit className='w-4 h-4' /> },
    { id: 'manim', label: '7. Show Me Why', icon: <PlayCircle className='w-4 h-4' /> },
    { id: 'challenges', label: '8. Challenge', icon: <Award className='w-4 h-4' /> },
    { id: 'mastery', label: 'Mastery', icon: <Award className='w-4 h-4' /> },
  ];

  return (
    <header className='border-b border-cyan-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3'>
        <div className='flex items-center gap-3 cursor-pointer' onClick={() => setActiveTab('dashboard')}>
          <img
            src='/logo.png'
            alt='QuIL Logo'
            className='w-9 h-9 rounded-lg object-contain shadow-lg shadow-cyan-500/20 border border-cyan-500/30 bg-slate-900 p-0.5'
          />
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-base tracking-wide text-white'>QuIL</span>
              <span className='text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono'>
                SIH26140
              </span>
            </div>
            <p className='text-xs text-slate-400'>Quantum Intelligence Learning Lab</p>
          </div>
        </div>

        <nav className='flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none'>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className='hidden lg:flex items-center gap-2 text-xs font-mono'>
          <div className={`w-2 h-2 rounded-full ${simulatorReady ? 'bg-emerald-400 animate-pulse-glow' : 'bg-amber-400'}`} />
          <span className='text-slate-400'>Aer Simulator:</span>
          <span className={simulatorReady ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
            {simulatorReady ? 'Online (v1.0)' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
