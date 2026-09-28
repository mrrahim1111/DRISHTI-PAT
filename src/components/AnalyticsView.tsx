import React from 'react';
import { TelemetryPoint, SimulationConfig } from '../types/fsoc';
import { PS4_SPECIFICATION } from '../data/problemStatement4';
import {
  BarChart3,
  Download,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Zap,
  Clock,
  Target,
  FileSpreadsheet,
} from 'lucide-react';

interface AnalyticsViewProps {
  telemetry: TelemetryPoint | null;
  history: TelemetryPoint[];
  config: SimulationConfig;
  summaryMetrics: {
    totalTimeSec: number;
    acquisitionTimeSec: number | null;
    lockRetentionRatePct: number;
    meanPointingErrorMrad: number;
    maxPointingErrorMrad: number;
    reacquisitionTimeAvgSec: number;
    falseLockCount: number;
    motorEffortIndex: number;
    fpsAvg: number;
    seed: number;
  };
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  config,
  summaryMetrics,
}) => {
  const handleDownloadCsv = () => {
    if (history.length === 0) return;

    const headers = [
      'Time_s',
      'Frame',
      'TrueAz_deg',
      'TrueEl_deg',
      'CamPan_deg',
      'CamTilt_deg',
      'DetectedAz_deg',
      'DetectedEl_deg',
      'PredictedAz_deg',
      'PredictedEl_deg',
      'PointingError_mrad',
      'Confidence',
      'LockState',
      'BeaconIdMatchScore_pct',
      'ActiveCamera',
    ];

    const rows = history.map((h) => [
      h.time,
      h.frameIndex,
      h.trueAz,
      h.trueEl,
      h.camPan,
      h.camTilt,
      h.detectedAz !== null ? h.detectedAz : '',
      h.detectedEl !== null ? h.detectedEl : '',
      h.predictedAz,
      h.predictedEl,
      h.pointingErrorMrad,
      h.confidence,
      h.lockState,
      h.beaconIdMatchScore,
      h.activeCameraId,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DRISHTI_PAT_Telemetry_Seed_${config.randomSeed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJsonReport = () => {
    const reportData = {
      testbed: 'DRISHTI-PAT Virtual FSOC Coarse PAT',
      timestamp: new Date().toISOString(),
      reference: PS4_SPECIFICATION.source,
      performanceCriteria: PS4_SPECIFICATION.performance,
      config,
      metrics: summaryMetrics,
      telemetrySample: history.filter((_, i) => i % 5 === 0),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DRISHTI_PAT_Performance_Report_Seed_${config.randomSeed}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderSparkline = (data: number[], color: string, height = 40) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const range = max - min || 1;
    const width = 300;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-10 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    );
  };

  const errorData = history.map((h) => h.pointingErrorMrad);
  const confidenceData = history.map((h) => h.confidence * 100);
  const motorData = history.map((h) => h.motorEffortDegPerSec);

  return (
    <div className="space-y-4">
      {/* Top Banner & Exporters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-600" /> Quantitative Performance & Telemetry Evaluation
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Statistical breakdown of acquisition latency, pointing accuracy, lock retention, and motor stability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </button>
          <button
            onClick={handleDownloadJsonReport}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-3.5 h-3.5" /> Performance Report (JSON)
          </button>
        </div>
      </div>

      {/* KPI Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>LOCK RETENTION</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {summaryMetrics.lockRetentionRatePct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Of total sim time</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>ACQUISITION TIME</span>
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-extrabold text-cyan-700 font-mono mt-1">
            {summaryMetrics.acquisitionTimeSec !== null ? `${summaryMetrics.acquisitionTimeSec}s` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">From search to lock</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>MEAN POINTING ERROR</span>
            <Target className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">
            {summaryMetrics.meanPointingErrorMrad} <span className="text-xs">mrad</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Max: {summaryMetrics.maxPointingErrorMrad} mrad</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>MOTOR EFFORT INDEX</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-700 font-mono mt-1">
            {summaryMetrics.motorEffortIndex} <span className="text-xs">°/s</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Avg gimbal speed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>FALSE LOCK COUNT</span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="text-xl font-extrabold text-orange-700 font-mono mt-1">
            {summaryMetrics.falseLockCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Decoy latch events</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-between font-bold">
            <span>REPRODUCIBLE SEED</span>
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">
            #{summaryMetrics.seed}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Deterministic replay</div>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              1. Angular Pointing Error (mrad)
            </h3>
            <span className="text-[10px] font-mono text-amber-700 font-bold">Target &lt; 15 mrad</span>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800 h-28 flex flex-col justify-end">
            {renderSparkline(errorData, '#f59e0b', 70)}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0.0s</span>
            <span>{summaryMetrics.totalTimeSec}s</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              2. Signal Quality & Confidence (%)
            </h3>
            <span className="text-[10px] font-mono text-cyan-700 font-bold">Rytov: {config.rytovIndex}</span>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800 h-28 flex flex-col justify-end">
            {renderSparkline(confidenceData, '#06b6d4', 70)}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0.0s</span>
            <span>{summaryMetrics.totalTimeSec}s</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              3. Gimbal Motor Velocity (°/s)
            </h3>
            <span className="text-[10px] font-mono text-purple-700 font-bold">Max: {config.maxMotorVelocityDegPerSec}°/s</span>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800 h-28 flex flex-col justify-end">
            {renderSparkline(motorData, '#c084fc', 70)}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0.0s</span>
            <span>{summaryMetrics.totalTimeSec}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
