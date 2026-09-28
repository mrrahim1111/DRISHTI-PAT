import React, { useRef, useEffect, useCallback } from 'react';
import { TelemetryPoint, SimulationConfig } from '../types/fsoc';
import { Globe, Radio, Crosshair, Activity } from 'lucide-react';

interface Globe3DViewProps {
  telemetryRef: React.RefObject<TelemetryPoint | null>;
  config: SimulationConfig;
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number,
  t: number, pan: number, tilt: number, lockState: string
) {
  const rotY = (t * 0.18) % (Math.PI * 2);

  const grad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
  grad.addColorStop(0, 'rgba(30, 58, 138, 0.95)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 1)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  const glowColor = lockState === 'LOCKED'
    ? 'rgba(16, 185, 129, 0.4)'
    : lockState === 'ACQUIRING'
    ? 'rgba(6, 182, 212, 0.35)'
    : 'rgba(245, 158, 11, 0.3)';
  const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.18);
  glowGrad.addColorStop(0, glowColor);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 0.6;
  for (let lat = -75; lat <= 75; lat += 15) {
    const latRad = (lat * Math.PI) / 180;
    const ry = R * Math.sin(latRad);
    const rx = R * Math.cos(latRad);
    if (rx <= 0) continue;
    ctx.strokeStyle = 'rgba(99, 179, 237, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry, rx, rx * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const numMeridians = 12;
  for (let i = 0; i < numMeridians; i++) {
    const lon = rotY + (i / numMeridians) * Math.PI * 2;
    const xScale = Math.cos(lon);
    if (xScale < -0.1) continue;
    ctx.strokeStyle = `rgba(99, 179, 237, ${0.08 + 0.12 * Math.max(0, xScale)})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 5) {
      const latRad = (lat * Math.PI) / 180;
      const px3 = R * Math.cos(latRad) * Math.cos(lon);
      const py3 = R * Math.sin(latRad);
      const px2 = cx + px3;
      const py2 = cy - py3;
      if (lat === -90) ctx.moveTo(px2, py2);
      else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();

  const panRad = (pan * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const beamX = cx + R * 0.9 * Math.cos(tiltRad) * Math.sin(panRad);
  const beamY = cy - R * 0.9 * Math.sin(tiltRad);

  const beamGrad = ctx.createLinearGradient(cx, cy, beamX, beamY);
  beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
  beamGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.7)');
  beamGrad.addColorStop(1, 'rgba(16, 185, 129, 1)');
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(beamX, beamY);
  ctx.stroke();

  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  const spotGrad = ctx.createRadialGradient(beamX, beamY, 0, beamX, beamY, 18 + pulse * 8);
  spotGrad.addColorStop(0, 'rgba(255,255,255,1)');
  spotGrad.addColorStop(0.3, 'rgba(16, 185, 129, 0.9)');
  spotGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.arc(beamX, beamY, 18 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();

  const chColor = lockState === 'LOCKED' ? '#10b981' : lockState === 'ACQUIRING' ? '#06b6d4' : '#f59e0b';
  ctx.strokeStyle = chColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(beamX - 12, beamY); ctx.lineTo(beamX + 12, beamY);
  ctx.moveTo(beamX, beamY - 12); ctx.lineTo(beamX, beamY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(beamX, beamY, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.beginPath();
  ctx.arc(cx, cy - R + 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - R - 8);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAttitudeIndicator(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  pan: number, tilt: number
) {
  const r = size / 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(x, y);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.fillStyle = 'rgba(30, 58, 138, 0.75)';
  ctx.fillRect(-r, -r, r * 2, r);
  ctx.fillStyle = 'rgba(120, 53, 15, 0.75)';
  ctx.fillRect(-r, 0, r * 2, r);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const yy = (i / 2) * r * 0.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, yy); ctx.lineTo(r * 0.35, yy);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x - r * 0.2, y);
  ctx.moveTo(x + r * 0.2, y); ctx.lineTo(x + r * 0.6, y);
  ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
  ctx.stroke();

  const panNorm = (pan / 60) * r * 0.85;
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + panNorm, y - r + 2);
  ctx.lineTo(x + panNorm, y - r - 9);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

export const Globe3DView: React.FC<Globe3DViewProps> = ({ telemetryRef, config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number>(performance.now());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

    const tel = telemetryRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const t = (performance.now() - t0Ref.current) / 1000;
    const pan = tel?.camPan ?? 0;
    const tilt = tel?.camTilt ?? 0;
    const lockState = tel?.lockState ?? 'SEARCHING';

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, W, H);

    const globeCX = W * 0.32;
    const globeCY = H * 0.52;
    const globeR = Math.min(W * 0.23, H * 0.38);
    drawGlobe(ctx, globeCX, globeCY, globeR, t, pan, tilt, lockState);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ATTITUDE SPHERE — DRISHTI-PAT', globeCX, globeCY + globeR + 22);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Az: ${pan.toFixed(1)}°  El: ${tilt.toFixed(1)}°`, globeCX, globeCY + globeR + 38);

    const attX = W * 0.72;
    const attY = H * 0.38;
    const attSize = Math.min(W * 0.18, H * 0.30);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(attX, attY, attSize / 2 + 6, 0, Math.PI * 2);
    ctx.fill();
    drawAttitudeIndicator(ctx, attX, attY, attSize, pan, tilt);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ATTITUDE INDICATOR', attX, attY + attSize / 2 + 20);

    // Live metric bars
    const mx = W * 0.72;
    const my = H * 0.70;
    const mW = W * 0.23;
    const err = tel?.pointingErrorMrad ?? 0;
    const conf = tel?.confidence ?? 0;
    const uncert = tel?.uncertaintyRadiusMrad ?? 0;

    const drawBar = (label: string, value: string, fill: number, color: string, by: number) => {
      ctx.fillStyle = '#334155';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, mx - mW / 2, by - 5);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      (ctx as any).roundRect(mx - mW / 2, by, mW, 10, 5);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      (ctx as any).roundRect(mx - mW / 2, by, Math.max(4, mW * Math.min(1, fill)), 10, 5);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(value, mx + mW / 2, by - 5);
    };

    const errColor = err < 5 ? '#10b981' : err < 12 ? '#f59e0b' : '#ef4444';
    drawBar('Pointing Error', `${err.toFixed(1)} mrad`, err / 20, errColor, my);
    drawBar('Confidence', `${(conf * 100).toFixed(0)}%`, conf, '#06b6d4', my + 26);
    drawBar('Uncertainty', `${uncert.toFixed(1)} mrad`, uncert / 25, '#f59e0b', my + 52);

    // Lock badge top-right
    const lsColor = lockState === 'LOCKED' ? '#10b981' : lockState === 'ACQUIRING' ? '#06b6d4' : '#f59e0b';
    ctx.fillStyle = lsColor;
    (ctx as any).roundRect(W * 0.61, H * 0.05, W * 0.35, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`●  ${lockState}`, W * 0.61 + W * 0.175, H * 0.05 + 24);

    // Searching sweep
    if (lockState === 'SEARCHING') {
      const sweepAngle = ((t * 1.5) % (Math.PI * 2));
      ctx.save();
      ctx.translate(globeCX, globeCY);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, globeR * 0.65, sweepAngle, sweepAngle + Math.PI * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`T+${(tel?.time ?? 0).toFixed(1)}s`, 16, H - 12);

    rafRef.current = requestAnimationFrame(draw);
  }, [telemetryRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    };
    setSize();
    const obs = new ResizeObserver(setSize);
    if (canvas.parentElement) obs.observe(canvas.parentElement);
    return () => obs.disconnect();
  }, []);

  const tel = telemetryRef.current;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-700" />
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3D Attitude Dashboard — Live Gimbal Sphere Visualizer
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Real-time 3D projection of camera azimuth / elevation on geo-referenced attitude sphere
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-2 py-1">
            <Radio className="w-3 h-3 text-cyan-600" />
            <span className="text-slate-700">Pan: <strong className="text-blue-700">{(tel?.camPan ?? 0).toFixed(1)}°</strong></span>
          </span>
          <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-2 py-1">
            <Crosshair className="w-3 h-3 text-emerald-600" />
            <span className="text-slate-700">Tilt: <strong className="text-emerald-700">{(tel?.camTilt ?? 0).toFixed(1)}°</strong></span>
          </span>
          <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-2 py-1">
            <Activity className="w-3 h-3 text-amber-600" />
            <span className="text-slate-700">Err: <strong className="text-amber-700">{(tel?.pointingErrorMrad ?? 0).toFixed(1)} mrad</strong></span>
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden" style={{ height: '480px' }}>
        <canvas ref={canvasRef} width={1200} height={480} className="w-full h-full" style={{ display: 'block' }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Beacon ID Match', value: `${tel?.beaconIdMatchScore ?? 0}%`, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
          { label: 'Scintillation σ', value: (tel?.scintillationFactor ?? 1).toFixed(2), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Active FOV', value: `${(tel?.activeFovDeg ?? config.baseFovDeg).toFixed(1)}°`, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
          {
            label: 'Lock State', value: tel?.lockState ?? 'SEARCHING',
            color: tel?.lockState === 'LOCKED' ? 'text-emerald-700' : tel?.lockState === 'ACQUIRING' ? 'text-cyan-700' : 'text-amber-700',
            bg: 'bg-slate-50 border-slate-200',
          },
        ].map((m) => (
          <div key={m.label} className={`${m.bg} border rounded-lg p-3 shadow-sm text-center`}>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
            <div className={`text-base font-bold font-mono ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
