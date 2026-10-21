import React from 'react';
import { 
  BarChart3, 
  Database, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Layers,
  Activity
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'schema' | 'sandbox' | 'dashboard';
  setActiveTab: (tab: 'chat' | 'schema' | 'sandbox' | 'dashboard') => void;
  onResetChat: () => void;
  isProcessing: boolean;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetChat,
  isProcessing,
  totalRecordsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Retail<span className="text-amber-400">IQ</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                Agentic BI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block font-medium">
              Autonomous Retail SQL Data Analyst &amp; BI Consultant
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Consultant Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'schema'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retail Schema</span>
            <span className="sm:hidden">Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sandbox'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SQL Sandbox</span>
            <span className="sm:hidden">SQL</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BI Overview</span>
            <span className="sm:hidden">BI</span>
          </button>
        </nav>

        {/* Right side status / controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Retail DB:</span>
            <span className="text-slate-200 font-mono font-medium">{totalRecordsCount} records</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Guardrail Active</span>
          </div>

          {activeTab === 'chat' && (
            <button
              onClick={onResetChat}
              disabled={isProcessing}
              title="Reset conversation context"
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
