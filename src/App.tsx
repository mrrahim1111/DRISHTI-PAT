import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveTab,
  SimulationConfig,
  TelemetryPoint,
  EventLogItem,
} from './types/fsoc';
import { DEFAULT_SIMULATION_CONFIG, SCENARIO_PRESETS } from './data/presets';
import { SimulationEngine } from './engine/simulationEngine';
import { Header } from './components/Header';
import { MissionControl } from './components/MissionControl';
import { ScenarioConfig } from './components/ScenarioConfig';
import { AnalyticsView } from './components/AnalyticsView';
import { EventReview } from './components/EventReview';
import { StabilityView } from './components/StabilityView';
import { ChallengeGenerator } from './components/ChallengeGenerator';
import { ArchitectureView } from './components/ArchitectureView';
import { Globe3DView } from './components/Globe3DView';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mission');
  const [currentPresetId, setCurrentPresetId] = useState<string>('isro-ps-nominal');
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_SIMULATION_CONFIG);

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<TelemetryPoint | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [events, setEvents] = useState<EventLogItem[]>([]);

  const engineRef = useRef<SimulationEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastStateSyncTimeRef = useRef<number>(0);
  // Live telemetry ref for canvas rendering — NO React state update at 60fps
  const telemetryRef = useRef<TelemetryPoint | null>(null);

  // Initialize Engine
  useEffect(() => {
    engineRef.current = new SimulationEngine(config);
    const initialFrame = engineRef.current.step(0.033);
    setTelemetry(initialFrame);
    setHistory(engineRef.current.getHistory());
    setEvents(engineRef.current.getEvents());
  }, []);

  // Update Config on existing engine
  const handleUpdateConfig = useCallback((updated: Partial<SimulationConfig>) => {
    const newConfig = { ...config, ...updated };
    setConfig(newConfig);
    if (engineRef.current) {
      engineRef.current.reset(newConfig);
      setHistory([...engineRef.current.getHistory()]);
      setEvents([...engineRef.current.getEvents()]);
    }
  }, [config]);

  // Select Preset
  const handleSelectPreset = (presetId: string) => {
    setCurrentPresetId(presetId);
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      handleUpdateConfig(preset.config);
    }
  };

  // Reset Engine
  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      const initialFrame = engineRef.current.step(0.033);
      setTelemetry(initialFrame);
      setHistory([...engineRef.current.getHistory()]);
      setEvents([...engineRef.current.getEvents()]);
    }
  };

  // Step Single Frame
  const handleStep = () => {
    if (engineRef.current) {
      const frame = engineRef.current.step(0.033);
      setTelemetry(frame);
      setHistory([...engineRef.current.getHistory()]);
      setEvents([...engineRef.current.getEvents()]);
    }
  };

  // HIGH-PERFORMANCE ANIMATION LOOP
  // Key anti-shake principle: canvases read from telemetryRef (no state = no re-render).
  // React state (telemetry/history/events) only syncs at 10fps to drive text displays.
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (isRunning && engineRef.current) {
        const dt = Math.min(0.1, (now - lastTime) / 1000.0);
        lastTime = now;

        const frame = engineRef.current.step(dt > 0 ? dt : 0.033);
        // Always update the ref (used by all canvases at 60fps, zero React cost)
        telemetryRef.current = frame;

        // Throttle React state updates to ~10fps (100ms) — eliminates DOM thrash / shaking
        if (now - lastStateSyncTimeRef.current > 100) {
          lastStateSyncTimeRef.current = now;
          setTelemetry({ ...frame });
          setHistory([...engineRef.current.getHistory()]);
          setEvents([...engineRef.current.getEvents()]);
        }
      } else {
        lastTime = now;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const summaryMetrics = engineRef.current
    ? engineRef.current.getSummaryMetrics()
    : {
        totalTimeSec: 0,
        acquisitionTimeSec: null,
        lockRetentionRatePct: 0,
        meanPointingErrorMrad: 0,
        maxPointingErrorMrad: 0,
        reacquisitionTimeAvgSec: 0,
        falseLockCount: 0,
        motorEffortIndex: 0,
        fpsAvg: 30,
        seed: config.randomSeed,
      };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-cyan-600 selection:text-white" style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
      {/* Deep Navy Highlighted Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        presets={SCENARIO_PRESETS}
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        onStep={handleStep}
        currentTime={telemetry?.time || 0}
        lockState={telemetry?.lockState || 'SEARCHING'}
        pointingErrorMrad={telemetry?.pointingErrorMrad || 0}
        confidence={telemetry?.confidence || 0}
        config={config}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto">
        {activeTab === 'mission' && (
          <MissionControl
            telemetry={telemetry}
            telemetryRef={telemetryRef}
            history={history}
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {activeTab === 'config' && (
          <ScenarioConfig
            config={config}
            onUpdateConfig={handleUpdateConfig}
            presets={SCENARIO_PRESETS}
            currentPresetId={currentPresetId}
            onSelectPreset={handleSelectPreset}
            onResetEngine={handleReset}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            telemetry={telemetry}
            history={history}
            config={config}
            summaryMetrics={summaryMetrics}
          />
        )}

        {activeTab === 'events' && (
          <EventReview events={events} history={history} />
        )}

        {activeTab === 'stability' && (
          <StabilityView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            summaryMetrics={summaryMetrics}
          />
        )}

        {activeTab === 'challenge' && (
          <ChallengeGenerator
            onApplyChallenge={(challengeConfig) => {
              handleUpdateConfig(challengeConfig);
              setActiveTab('mission');
            }}
          />
        )}

        {activeTab === 'globe3d' && (
          <Globe3DView telemetryRef={telemetryRef} config={config} />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-2.5 px-4 text-[11px] font-mono text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800">DRISHTI-PAT v2.0 | Virtual Camera FSOC Testbed</span>
        </div>
        <div>
          Shortcuts: <kbd className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-mono">Space</kbd> Play/Pause | <kbd className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-mono">R</kbd> Reset | <kbd className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-mono">S</kbd> Step
        </div>
      </footer>
    </div>
  );
}

export default App;
