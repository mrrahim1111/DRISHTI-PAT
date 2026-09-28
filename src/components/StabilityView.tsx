import React from 'react';
import { SimulationConfig } from '../types/fsoc';
import { Activity, Zap, Sparkles } from 'lucide-react';

interface StabilityViewProps {
  config: SimulationConfig;
  onUpdateConfig: (updated: Partial<SimulationConfig>) => void;
  summaryMetrics: {
    meanPointingErrorMrad: number;
    motorEffortIndex: number;
    lockRetentionRatePct: number;
  };
}

export const StabilityView: React.FC<StabilityViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-cyan-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Performance-versus-Stability Trade-Off Evaluator
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Compare aggressive fast steering response against smooth predictive control. High gains lower pointing error but dramatically increase gimbal motor jitter and mechanical wear.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode A: Aggressive High-Gain PID */}
        <div className={`p-4 rounded-lg border transition ${
          config.controlMode === 'PID'
            ? 'bg-amber-50 border-amber-400 shadow'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" /> Mode A: Aggressive PID Steering
            </h3>
            {config.controlMode === 'PID' && (
              <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                ACTIVE
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-4">
            High proportional feedback gain (Kp = 5.0). Maximizes responsiveness during sudden target maneuvers, but introduces high-frequency motor oscillation and acceleration spikes under noise.
          </p>

          <button
            onClick={() => onUpdateConfig({ controlMode: 'PID', pidKp: 5.0, enablePredictivePointing: false })}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded shadow transition mb-3"
          >
            Switch to Aggressive PID Mode
          </button>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono space-y-1 text-slate-700">
            <div className="flex justify-between"><span>Pointing Error:</span> <span className="text-amber-700 font-bold">Low (1.8 mrad)</span></div>
            <div className="flex justify-between"><span>Motor Jitter/Effort:</span> <span className="text-red-600 font-bold">HIGH (42 °/s)</span></div>
            <div className="flex justify-between"><span>Mechanical Strain:</span> <span className="text-red-600 font-bold">Heavy</span></div>
          </div>
        </div>

        {/* Mode B: Smooth Kalman Predictive Control */}
        <div className={`p-4 rounded-lg border transition ${
          config.controlMode === 'KalmanPredictive'
            ? 'bg-emerald-50 border-emerald-400 shadow'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Mode B: Smooth Kalman Predictive Steering
            </h3>
            {config.controlMode === 'KalmanPredictive' && (
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                ACTIVE (RECOMMENDED)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-4">
            Combines 2D Kalman state estimation with latency feed-forward prediction horizon (Δt = 60ms). Eliminates overshoot, smooths motor commands, and preserves pointing accuracy.
          </p>

          <button
            onClick={() => onUpdateConfig({ controlMode: 'KalmanPredictive', enablePredictivePointing: true })}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow transition mb-3"
          >
            Switch to Smooth Kalman Predictive Mode
          </button>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono space-y-1 text-slate-700">
            <div className="flex justify-between"><span>Pointing Error:</span> <span className="text-emerald-700 font-bold">Optimal (2.1 mrad)</span></div>
            <div className="flex justify-between"><span>Motor Jitter/Effort:</span> <span className="text-emerald-700 font-bold">LOW (14 °/s)</span></div>
            <div className="flex justify-between"><span>Mechanical Strain:</span> <span className="text-emerald-700 font-bold">Minimal</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
