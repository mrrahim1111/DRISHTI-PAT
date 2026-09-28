import React, { useRef, useEffect } from 'react';
import { TelemetryPoint, SimulationConfig } from '../types/fsoc';
import { computeDecoyGroundTruth } from '../engine/targetPhysics';
import {
  Eye,
  Sliders,
  Shield,
  Zap,
  Target,
  Maximize2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MissionControlProps {
  telemetry: TelemetryPoint | null;
  telemetryRef: React.RefObject<TelemetryPoint | null>;
  history: TelemetryPoint[];
  config: SimulationConfig;
  onUpdateConfig: (updated: Partial<SimulationConfig>) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  telemetry,
  telemetryRef,
  history,
  config,
  onUpdateConfig,
}) => {
  const tacticalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewfinderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tacticalRafRef = useRef<number | null>(null);
  const viewfinderRafRef = useRef<number | null>(null);

  // Canvas 1: Tactical Map — runs its own RAF loop reading from telemetryRef
  useEffect(() => {
    const drawTactical = () => {
      const canvas = tacticalCanvasRef.current;
      const tel = telemetryRef.current;
      if (!canvas || !tel) { tacticalRafRef.current = requestAnimationFrame(drawTactical); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { tacticalRafRef.current = requestAnimationFrame(drawTactical); return; }

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#070c18';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.stroke();

      const azToX = (az: number) => (width / 2) + (az / 60) * (width / 2);
      const elToY = (el: number) => (height / 2) - (el / 35) * (height / 2);

      if (history.length > 1) {
        const pts = history.slice(-50);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pts.forEach((pt, i) => {
          const x = azToX(pt.trueAz); const y = elToY(pt.trueEl);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      if (config.decoys.length > 0) {
        config.decoys.forEach((decoy, idx) => {
          const decoyPos = computeDecoyGroundTruth(tel.time, config, idx);
          const dx = azToX(decoyPos.az); const dy = elToY(decoyPos.el);
          ctx.fillStyle = '#f97316';
          ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(dx - 8, dy - 8, 16, 16);
          ctx.fillStyle = '#fdba74';
          ctx.font = '10px monospace';
          ctx.fillText(`DECOY ${idx + 1} (${decoy.pulseFreqHz}Hz)`, dx + 10, dy + 3);
        });
      }

      const tx = azToX(tel.trueAz); const ty = elToY(tel.trueEl);
      const gradient = ctx.createRadialGradient(tx, ty, 2, tx, ty, 22);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
      gradient.addColorStop(0.4, 'rgba(16, 185, 129, 0.3)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(tx, ty, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a7f3d0'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`BEACON ALPHA (${config.targetPulseFreqHz}Hz)`, tx + 10, ty - 8);

      const cx = azToX(tel.camPan); const cy = elToY(tel.camTilt);
      const fovHalfX = (tel.activeFovDeg / 120) * width;
      const fovHalfY = (tel.activeFovDeg / 70) * height;
      ctx.strokeStyle = tel.lockState === 'LOCKED' ? '#10b981' : tel.lockState === 'ACQUIRING' ? '#06b6d4' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - fovHalfX, cy - fovHalfY, fovHalfX * 2, fovHalfY * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.font = '10px monospace';
      ctx.fillText(`CAM: Pan ${tel.camPan.toFixed(1)}° / Tilt ${tel.camTilt.toFixed(1)}° [${tel.activeFovDeg.toFixed(1)}° FOV]`, cx - 50, cy + fovHalfY + 14);

      if (tel.isOccluded) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.55)';
        ctx.beginPath(); ctx.ellipse(tx, ty, 60, 35, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a'; ctx.font = 'bold 11px monospace';
        ctx.fillText('⚡ CLOUD OCCLUSION MASK', tx - 65, ty + 5);
      }

      tacticalRafRef.current = requestAnimationFrame(drawTactical);
    };
    tacticalRafRef.current = requestAnimationFrame(drawTactical);
    return () => { if (tacticalRafRef.current) cancelAnimationFrame(tacticalRafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, history, telemetryRef]);

  // Canvas 2: Sensor Viewfinder — own RAF loop
  useEffect(() => {
    const drawViewfinder = () => {
      const canvas = viewfinderCanvasRef.current;
      const tel = telemetryRef.current;
      if (!canvas || !tel) { viewfinderRafRef.current = requestAnimationFrame(drawViewfinder); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { viewfinderRafRef.current = requestAnimationFrame(drawViewfinder); return; }

      const width = canvas.width; const height = canvas.height;
      const centerX = width / 2; const centerY = height / 2;

      ctx.fillStyle = '#030712'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)'; ctx.lineWidth = 1;
      [40, 90, 160].forEach((r, idx) => {
        ctx.beginPath(); ctx.arc(centerX, centerY, r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; ctx.font = '9px monospace';
        ctx.fillText(`${(idx + 1) * 5} mrad`, centerX + r + 4, centerY - 2);
      });
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.beginPath();
      ctx.moveTo(centerX - 180, centerY); ctx.lineTo(centerX + 180, centerY);
      ctx.moveTo(centerX, centerY - 180); ctx.lineTo(centerX, centerY + 180);
      ctx.stroke();

      const size = 180;
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(centerX - size, centerY - size + 20); ctx.lineTo(centerX - size, centerY - size); ctx.lineTo(centerX - size + 20, centerY - size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(centerX + size - 20, centerY - size); ctx.lineTo(centerX + size, centerY - size); ctx.lineTo(centerX + size, centerY - size + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(centerX - size, centerY + size - 20); ctx.lineTo(centerX - size, centerY + size); ctx.lineTo(centerX - size + 20, centerY + size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(centerX + size - 20, centerY + size); ctx.lineTo(centerX + size, centerY + size); ctx.lineTo(centerX + size, centerY + size - 20); ctx.stroke();

      const degToPxX = (width / 2) / (tel.activeFovDeg / 2);
      const degToPxY = (height / 2) / (tel.activeFovDeg / 2);

      if (tel.detectedAz !== null && tel.detectedEl !== null && !tel.isOccluded) {
        const dx = centerX + (tel.detectedAz - tel.camPan) * degToPxX;
        const dy = centerY - (tel.detectedEl - tel.camTilt) * degToPxY;
        const shimmer = tel.scintillationFactor * 14;
        const spotGlow = ctx.createRadialGradient(dx, dy, 2, dx, dy, Math.max(8, shimmer * 2));
        spotGlow.addColorStop(0, 'rgba(56, 189, 248, 1)'); spotGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.5)'); spotGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = spotGlow; ctx.beginPath(); ctx.arc(dx, dy, Math.max(8, shimmer * 2), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.strokeRect(dx - 12, dy - 12, 24, 24);
        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 10px monospace';
        ctx.fillText(`DETECTED: ${tel.activeBeaconId}`, dx + 15, dy - 4);
        ctx.fillStyle = '#67e8f9'; ctx.font = '9px monospace';
        ctx.fillText(`MATCH: ${tel.beaconIdMatchScore}% (100Hz)`, dx + 15, dy + 8);
      }

      const px = centerX + (tel.predictedAz - tel.camPan) * degToPxX;
      const py = centerY - (tel.predictedEl - tel.camTilt) * degToPxY;
      ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 14, py); ctx.lineTo(px + 14, py); ctx.moveTo(px, py - 14); ctx.lineTo(px, py + 14); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fbbf24'; ctx.font = '9px monospace';
      ctx.fillText(`PREDICTED (+${config.cameraDelayMs}ms)`, px + 12, py + 14);

      const uncertPx = (tel.uncertaintyRadiusMrad / 17.45) * degToPxX;
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(px, py, Math.max(15, uncertPx), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

      if (tel.isOccluded) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; ctx.fillRect(centerX - 140, centerY - 25, 280, 50);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.strokeRect(centerX - 140, centerY - 25, 280, 50);
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('⚠️ SIGNAL OCCLUDED BY CLOUD', centerX, centerY - 5);
        ctx.fillStyle = '#fef08a'; ctx.font = '10px monospace';
        ctx.fillText('COASTING KALMAN PREDICTIVE POINTING', centerX, centerY + 14);
        ctx.textAlign = 'left';
      }

      viewfinderRafRef.current = requestAnimationFrame(drawViewfinder);
    };
    viewfinderRafRef.current = requestAnimationFrame(drawViewfinder);
    return () => { if (viewfinderRafRef.current) cancelAnimationFrame(viewfinderRafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, telemetryRef]);

  return (
    <div className="space-y-4">
      {/* Top Banner: Active Mode Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Eye className="w-4 h-4 text-cyan-600" />
          <span className="font-bold text-slate-800">Active Camera Mode:</span>
          <span className="bg-cyan-50 text-cyan-700 border border-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
            {telemetry?.activeCameraId || 'CAM_1_WIDE'} [{telemetry?.activeFovDeg || config.baseFovDeg}° FOV]
          </span>
          <span className="text-slate-400">| Steering:</span>
          <span className="bg-purple-50 text-purple-700 border border-purple-300 px-2 py-0.5 rounded font-mono font-bold">
            {config.controlMode}
          </span>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 font-semibold ${
              config.enablePredictivePointing
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Predictive Pointing
          </span>

          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 font-semibold ${
              config.enableAdaptiveFov
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <Maximize2 className="w-3 h-3" /> Adaptive FOV
          </span>

          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 font-semibold ${
              config.enableBeaconIdentityCheck
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <Shield className="w-3 h-3" /> Identity Check
          </span>
        </div>
      </div>

      {/* Main Dual Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Viewport 1 - Tactical Map (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Viewport 1: Tactical Gimbal Field Map
              </h2>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Az: <span className="text-cyan-700 font-bold">±60°</span> | El: <span className="text-cyan-700 font-bold">±35°</span>
            </div>
          </div>

          <div className="relative w-full aspect-[16/10] bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
            <canvas
              ref={tacticalCanvasRef}
              width={640}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Beacon Alpha
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Trajectory Trail
              </span>
              {config.decoys.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Decoys ({config.decoys.length})
                </span>
              )}
            </div>
            <span>Ground-Truth vs Gimbal Pan/Tilt</span>
          </div>
        </div>

        {/* Right: Viewport 2 - Viewfinder (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Viewport 2: Sensor Focal Plane Viewfinder
              </h2>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-bold">
              {telemetry?.lockState || 'SEARCHING'}
            </div>
          </div>

          <div className="relative w-full aspect-[16/10] bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
            <canvas
              ref={viewfinderCanvasRef}
              width={480}
              height={300}
              className="w-full h-full object-contain"
            />

            <div className="absolute top-2 right-2 bg-slate-950/80 border border-slate-800 rounded p-1.5 text-[10px] font-mono text-slate-300 space-y-0.5">
              <div>LATENCY: <span className="text-amber-400">{config.cameraDelayMs} ms</span></div>
              <div>ERR: <span className="text-cyan-400">{telemetry?.pointingErrorMrad || 0} mrad</span></div>
              <div>UNCERT: <span className="text-amber-300">{telemetry?.uncertaintyRadiusMrad || 0} mrad</span></div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Reticle: Concentric mrad Rings</span>
            <span>Pulse ID: <strong className="text-emerald-700">{telemetry?.beaconIdMatchScore || 0}% Match</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Controls & Feature Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Disturbance Sliders Panel (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Live Environment & Disturbance Controls
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-600">Atmospheric Scintillation (Rytov Index):</span>
                <span className="text-amber-700 font-bold">{config.rytovIndex.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1.0" step="0.05"
                value={config.rytovIndex}
                onChange={(e) => onUpdateConfig({ rytovIndex: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-600">Platform Vibration Amplitude:</span>
                <span className="text-amber-700 font-bold">{config.platformVibrationAmpDeg.toFixed(2)}°</span>
              </div>
              <input
                type="range" min="0" max="0.5" step="0.02"
                value={config.platformVibrationAmpDeg}
                onChange={(e) => onUpdateConfig({ platformVibrationAmpDeg: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 bg-slate-200 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-700 font-medium">Cloud Occlusion Cycles:</span>
              <button
                onClick={() => onUpdateConfig({ enableCloudOcclusion: !config.enableCloudOcclusion })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition ${
                  config.enableCloudOcclusion
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {config.enableCloudOcclusion ? 'OCCLUSION ACTIVE' : 'OCCLUSION OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Toggles Panel (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Prototype Algorithmic Innovations
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onUpdateConfig({ enablePredictivePointing: !config.enablePredictivePointing })}
              className={`p-2.5 rounded border text-left flex items-start gap-2 transition ${
                config.enablePredictivePointing
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">Predictive Pointing</div>
                <div className="text-[10px] text-slate-500">Kalman horizon update</div>
              </div>
            </button>

            <button
              onClick={() => onUpdateConfig({ enableAdaptiveFov: !config.enableAdaptiveFov })}
              className={`p-2.5 rounded border text-left flex items-start gap-2 transition ${
                config.enableAdaptiveFov
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Maximize2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">Adaptive FOV (AFOV)</div>
                <div className="text-[10px] text-slate-500">Dynamic 28° to 4° zoom</div>
              </div>
            </button>

            <button
              onClick={() => onUpdateConfig({ enableBeaconIdentityCheck: !config.enableBeaconIdentityCheck })}
              className={`p-2.5 rounded border text-left flex items-start gap-2 transition ${
                config.enableBeaconIdentityCheck
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Shield className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">Beacon ID Challenge</div>
                <div className="text-[10px] text-slate-500">Spectral/Pulse discriminator</div>
              </div>
            </button>

            <button
              onClick={() => onUpdateConfig({ enableConfidenceGuidedSearch: !config.enableConfidenceGuidedSearch })}
              className={`p-2.5 rounded border text-left flex items-start gap-2 transition ${
                config.enableConfidenceGuidedSearch
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Target className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">Confidence Search</div>
                <div className="text-[10px] text-slate-500">Spiral search pattern</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
