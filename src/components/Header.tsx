import React from 'react';
import {
  ActiveTab,
  LockState,
  ScenarioPreset,
  SimulationConfig,
} from '../types/fsoc';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Crosshair,
  Sliders,
  BarChart3,
  ListFilter,
  Activity,
  Award,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  presets: ScenarioPreset[];
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStep: () => void;
  currentTime: number;
  lockState: LockState;
  pointingErrorMrad: number;
  confidence: number;
  config: SimulationConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  presets,
  currentPresetId,
  onSelectPreset,
  isRunning,
  onTogglePlay,
  onReset,
  onStep,
  currentTime,
  lockState,
  pointingErrorMrad,
  confidence,
  config,
}) => {
  const getLockBadge = (state: LockState) => {
    switch (state) {
      case 'LOCKED':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded text-xs font-bold glow-emerald">
            <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> OPTICAL LOCK
          </span>
        );
      case 'ACQUIRING':
        return (
          <span className="flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2.5 py-1 rounded text-xs font-bold glow-cyan">
            <Radio className="w-3.5 h-3.5 animate-spin" /> ACQUIRING
          </span>
        );
      case 'OCCLUDED_COASTING':
        return (
          <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded text-xs font-bold glow-saffron">
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> OCCLUDED (COASTING)
          </span>
        );
      case 'SEARCHING':
      default:
        return (
          <span className="flex items-center gap-1.5 bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-xs font-semibold">
            <Crosshair className="w-3.5 h-3.5 text-slate-400" /> SEARCHING
          </span>
        );
    }
  };

  return (
    <header className="bg-[#0f172a] text-slate-100 border-b border-cyan-900/50 sticky top-0 z-50 px-4 py-3 shadow-lg">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Branding & Technical Identification */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-slate-900 border border-cyan-400/60 flex items-center justify-center shadow-md">
              <Crosshair className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white uppercase">
                  DRISHTI-PAT
                </h1>
                <span className="bg-orange-500/25 text-orange-300 border border-orange-400/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  FSOC Virtual CAM
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Software Virtual Camera PAT Testbed
              </p>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={onTogglePlay}
              className={`p-2 rounded font-semibold text-xs transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Control Panel: Presets & Simulation Controls */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Preset Selector */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded px-2.5 py-1">
            <span className="text-[11px] text-slate-300 font-mono uppercase font-semibold">Preset:</span>
            <select
              value={currentPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-slate-900 text-slate-100 text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-400 font-sans"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Time & Step Controls */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded px-3 py-1">
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white glow-saffron'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> PAUSE
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> RUN SIM
                </>
              )}
            </button>

            <button
              onClick={onStep}
              disabled={isRunning}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded transition"
              title="Step Single Frame (0.033s)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onReset}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition"
              title="Reset Simulation Engine"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            <div className="font-mono text-xs text-slate-300">
              <span className="text-slate-400 text-[10px]">TIME: </span>
              <span className="text-cyan-300 font-bold">{currentTime.toFixed(2)}s</span>
            </div>
          </div>

          {/* Telemetry Quick Badges */}
          <div className="hidden xl:flex items-center gap-2">
            {getLockBadge(lockState)}

            <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">ERROR:</span>
              <span className={pointingErrorMrad < 15 ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                {pointingErrorMrad} mrad
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">CONF:</span>
              <span className="text-cyan-300 font-bold">{Math.round(confidence * 100)}%</span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded font-mono text-xs text-slate-300">
              SEED: <span className="text-white font-bold">#{config.randomSeed}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'mission'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" /> Mission Control
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Config
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Events
          </button>

          <button
            onClick={() => setActiveTab('stability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'stability'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Stability
          </button>

          <button
            onClick={() => setActiveTab('challenge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'challenge'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Benchmarks
          </button>

          <button
            onClick={() => setActiveTab('globe3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'globe3d'
                ? 'bg-blue-700 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> 3D Dashboard
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Architecture
          </button>
        </nav>
      </div>
    </header>
  );
};
