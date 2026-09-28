import React from 'react';
import { Cpu, Layers, BookOpen } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-cyan-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Technical Architecture & Requirements Attribution Matrix
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          System modularity breakdown and explicit audit table mapping problem statement parameters versus prototype assumptions.
        </p>
      </div>

      {/* Section 1: Modular Architecture Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Layers className="w-4 h-4 text-cyan-600" /> System Module Decomposition (Replaceable Pipelines)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-cyan-700 font-mono">1. Detection Module</div>
            <p className="text-slate-600 text-[11px]">
              Extracts target centroid from simulated optical focal plane. Includes pulse frequency FFT matching and wavelength spectral check to reject decoys.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-amber-700 font-mono">2. Estimation Module</div>
            <p className="text-slate-600 text-[11px]">
              2D Kalman Filter state estimation (Azimuth, Elevation, Velocity). Predicts target location at latency horizon (Δt) and computes uncertainty covariance.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-purple-700 font-mono">3. Control Module</div>
            <p className="text-slate-600 text-[11px]">
              Gimbal motor dynamics solver with velocity & acceleration saturations. Controls Pan/Tilt angles and Adaptive Field of View (AFOV) optical zoom.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-red-700 font-mono">4. Disturbance Engine</div>
            <p className="text-slate-600 text-[11px]">
              Rytov scintillation turbulence, platform harmonic vibration, sensor thermal noise, cloud occlusions, and Mulberry32 seeded random number generator.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-emerald-700 font-mono">5. Reporting Engine</div>
            <p className="text-slate-600 text-[11px]">
              Real-time telemetry logger, state machine event monitor, CSV telemetry exporter, and JSON performance report generator.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Assumptions and Data Sources Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <BookOpen className="w-4 h-4 text-emerald-600" /> Assumptions & Data Sources (Audit Trail)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2.5 font-bold">Parameter / Constraint</th>
                <th className="p-2.5 font-bold">Value Range / Setting</th>
                <th className="p-2.5 font-bold">Classification Source</th>
                <th className="p-2.5 font-bold">Technical Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Coarse PAT Virtual Camera</td>
                <td className="p-2.5">Software-only simulator</td>
                <td className="p-2.5"><span className="bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">PS Requirement</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Enables rapid testbed evaluation without physical optics hardware.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Optical Laser Wavelength</td>
                <td className="p-2.5">1550 nm (Eye-Safe IR)</td>
                <td className="p-2.5"><span className="bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">PS Reference</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Standard eye-safe telecommunications band for atmospheric FSOC.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Camera Latency Horizon</td>
                <td className="p-2.5">40 ms – 120 ms (Default 60ms)</td>
                <td className="p-2.5"><span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Configurable Proposal</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Simulates frame exposure, readout, and processing delay.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Adaptive FOV Zoom Range</td>
                <td className="p-2.5">28° (Search) to 4° (Lock)</td>
                <td className="p-2.5"><span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Configurable Proposal</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Wide FOV speeds up acquisition; narrow FOV maximizes angular resolution.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Target Pulse Frequency</td>
                <td className="p-2.5">100 Hz signal pattern</td>
                <td className="p-2.5"><span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Configurable Proposal</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Enables spectral and temporal pulse discrimination to reject decoy flares.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">Rytov Scintillation Index</td>
                <td className="p-2.5">0.1 to 0.7 log-normal index</td>
                <td className="p-2.5"><span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Configurable Proposal</span></td>
                <td className="p-2.5 font-sans text-slate-600 text-[11px]">Models atmospheric turbulence beam wander and intensity fading.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
