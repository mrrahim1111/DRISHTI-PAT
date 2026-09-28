import React, { useState } from 'react';
import { SimulationConfig, TrajectoryType, ControlMode, ScenarioPreset } from '../types/fsoc';
import { PS4_SPECIFICATION } from '../data/problemStatement4';
import {
  Sliders,
  Target,
  Camera,
  Cpu,
  Zap,
  Shield,
  RotateCcw,
  FileCode,
} from 'lucide-react';

interface ScenarioConfigProps {
  config: SimulationConfig;
  onUpdateConfig: (updated: Partial<SimulationConfig>) => void;
  presets: ScenarioPreset[];
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onResetEngine: () => void;
}

export const ScenarioConfig: React.FC<ScenarioConfigProps> = ({
  config,
  onUpdateConfig,
  onResetEngine,
}) => {
  const [activeCategory, setActiveCategory] = useState<'target' | 'camera' | 'controller' | 'disturbances' | 'decoys' | 'seed'>('target');

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600" /> Scenario Parameter Matrix & Requirements
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Configure target kinematics, optical sensors, gimbal constraints, and environmental noise.
          </p>
        </div>

        {/* Requirements Legend */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
            <span className="text-cyan-800 font-semibold">PS Requirement / Reference</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-amber-800 font-semibold">Configurable Proposal</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Category Nav Tabs */}
        <div className="md:col-span-3 space-y-1.5">
          <button
            onClick={() => setActiveCategory('target')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'target'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><Target className="w-4 h-4" /> Target & Trajectory</span>
          </button>

          <button
            onClick={() => setActiveCategory('camera')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'camera'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Camera & Gimbal</span>
          </button>

          <button
            onClick={() => setActiveCategory('controller')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'controller'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Tracking Controller</span>
          </button>

          <button
            onClick={() => setActiveCategory('disturbances')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'disturbances'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Disturbances & Atmosphere</span>
          </button>

          <button
            onClick={() => setActiveCategory('decoys')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'decoys'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Decoy Beacons</span>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {config.decoys.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('seed')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-bold flex items-center justify-between transition ${
              activeCategory === 'seed'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2"><FileCode className="w-4 h-4" /> Seed & Replay</span>
          </button>

          <div className="pt-3">
            <button
              onClick={onResetEngine}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Apply & Reset Engine
            </button>
          </div>
        </div>

        {/* Parameters Form Area */}
        <div className="md:col-span-9 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          {/* Target & Trajectory */}
          {activeCategory === 'target' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-600" /> Target Kinematics & Optical Parameters
                </h3>
                <span className="bg-amber-50 text-amber-700 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Configurable Proposal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">Trajectory Pattern</label>
                  <select
                    value={config.trajectoryType}
                    onChange={(e) => onUpdateConfig({ trajectoryType: e.target.value as TrajectoryType })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs focus:border-cyan-500 font-medium"
                  >
                    <option value="sine_weave">Sinusoidal Weave (Nominal Flight)</option>
                    <option value="linear">Linear Uniform Motion</option>
                    <option value="circular">Circular Motion</option>
                    <option value="figure_eight">Lissajous Figure-8</option>
                    <option value="random">Random Walk</option>
                    <option value="orbital_arc">Satellite Orbital Arc</option>
                    <option value="chaotic_maneuver">Chaotic Evasive Evasion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Angular Target Speed: <span className="text-cyan-700 font-bold">{config.targetSpeedDegPerSec} °/s</span>
                  </label>
                  <input
                    type="range" min="0.5" max="6.0" step="0.1"
                    value={config.targetSpeedDegPerSec}
                    onChange={(e) => onUpdateConfig({ targetSpeedDegPerSec: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 bg-slate-200 h-1.5 rounded cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">Optical Laser Wavelength</label>
                  <select
                    value={config.beaconWavelengthNm}
                    onChange={(e) => onUpdateConfig({ beaconWavelengthNm: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs focus:border-cyan-500 font-medium"
                  >
                    <option value={1550}>1550 nm (Eye-Safe IR - Standard FSOC)</option>
                    <option value={850}>850 nm (Near Infrared LED/Laser)</option>
                    <option value={1064}>1064 nm (High Power Nd:YAG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Beacon Pulse Frequency: <span className="text-emerald-700 font-bold">{config.targetPulseFreqHz} Hz</span>
                  </label>
                  <input
                    type="number"
                    value={config.targetPulseFreqHz}
                    onChange={(e) => onUpdateConfig({ targetPulseFreqHz: parseInt(e.target.value) || 100 })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Used for spectral & temporal pulse identification.</p>
                </div>
              </div>
            </div>
          )}

          {/* Camera & Gimbal */}
          {activeCategory === 'camera' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-600" /> Pan-Tilt Gimbal & Sensor FOV Parameters
                </h3>
                <span className="bg-cyan-50 text-cyan-700 border border-cyan-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  PS Requirement Baseline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Max Motor Velocity: <span className="text-cyan-700 font-bold">{config.maxMotorVelocityDegPerSec} °/s</span>
                  </label>
                  <input
                    type="range"
                    min={PS4_SPECIFICATION.cameraMotion.panSpeedDegPerSec.min}
                    max={PS4_SPECIFICATION.cameraMotion.panSpeedDegPerSec.max}
                    step="1"
                    value={config.maxMotorVelocityDegPerSec}
                    onChange={(e) => onUpdateConfig({ maxMotorVelocityDegPerSec: parseInt(e.target.value) })}
                    className="w-full accent-cyan-600 bg-slate-200 h-1.5 rounded cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Max Motor Acceleration: <span className="text-cyan-700 font-bold">{config.maxMotorAccelDegPerSec2} °/s²</span>
                  </label>
                  <input
                    type="range" min="20" max="120" step="5"
                    value={config.maxMotorAccelDegPerSec2}
                    onChange={(e) => onUpdateConfig({ maxMotorAccelDegPerSec2: parseInt(e.target.value) })}
                    className="w-full accent-cyan-600 bg-slate-200 h-1.5 rounded cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Camera Latency: <span className="text-amber-700 font-bold">{config.cameraDelayMs} ms</span>
                  </label>
                  <input
                    type="range" min="10" max="200" step="10"
                    value={config.cameraDelayMs}
                    onChange={(e) => onUpdateConfig({ cameraDelayMs: parseInt(e.target.value) })}
                    className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">Base Sensor FOV</label>
                  <input
                    type="number"
                    value={config.baseFovDeg}
                    onChange={(e) => onUpdateConfig({ baseFovDeg: parseFloat(e.target.value) || 12 })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tracking Controller */}
          {activeCategory === 'controller' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-600" /> Steering Algorithm Configuration
                </h3>
                <span className="bg-amber-50 text-amber-700 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Configurable Proposal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">Control Mode</label>
                  <select
                    value={config.controlMode}
                    onChange={(e) => onUpdateConfig({ controlMode: e.target.value as ControlMode })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs focus:border-cyan-500 font-medium"
                  >
                    <option value="KalmanPredictive">Kalman Predictive Pointing (Recommended)</option>
                    <option value="PID">Proportional-Integral-Derivative (PID)</option>
                    <option value="RuleBased">Rule-Based Step Controller</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Disturbances */}
          {activeCategory === 'disturbances' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" /> Atmospheric Turbulence & Jitter
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Rytov Scintillation Index: <span className="text-amber-700 font-bold">{config.rytovIndex}</span>
                  </label>
                  <input
                    type="range" min="0.0" max="1.0" step="0.05"
                    value={config.rytovIndex}
                    onChange={(e) => onUpdateConfig({ rytovIndex: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono font-semibold mb-1">
                    Platform Jitter Amplitude: <span className="text-amber-700 font-bold">{config.platformVibrationAmpDeg}°</span>
                  </label>
                  <input
                    type="range" min="0.0" max="0.5" step="0.02"
                    value={config.platformVibrationAmpDeg}
                    onChange={(e) => onUpdateConfig({ platformVibrationAmpDeg: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Decoys */}
          {activeCategory === 'decoys' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-600" /> Distractor Decoy Configuration
                </h3>
              </div>

              {config.decoys.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500 font-mono">
                  No decoy beacons currently active in scenario.
                </div>
              ) : (
                <div className="space-y-3">
                  {config.decoys.map((decoy) => (
                    <div key={decoy.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{decoy.name}</div>
                        <div className="text-[11px] font-mono text-slate-600">
                          Pulse: <span className="text-amber-700 font-bold">{decoy.pulseFreqHz} Hz</span> | Wavelength: <span className="text-cyan-700 font-bold">{decoy.wavelengthNm} nm</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seed & Replay */}
          {activeCategory === 'seed' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-600" /> Deterministic Seed & Replay
                </h3>
              </div>

              <div>
                <label className="block text-slate-600 font-mono font-semibold mb-1">Random Seed (Integer)</label>
                <input
                  type="number"
                  value={config.randomSeed}
                  onChange={(e) => onUpdateConfig({ randomSeed: parseInt(e.target.value) || 1042 })}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Setting the same seed reproduces identical turbulence, vibration jitter, and noise sequences for fair algorithm evaluations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
