import React from 'react';
import { SimulationConfig } from '../types/fsoc';
import { Award, Zap } from 'lucide-react';

interface ChallengeGeneratorProps {
  onApplyChallenge: (challengeConfig: Partial<SimulationConfig>, name: string) => void;
}

export const ChallengeGenerator: React.FC<ChallengeGeneratorProps> = ({ onApplyChallenge }) => {
  const challenges = [
    {
      level: 1,
      title: 'Level 1: Calibrated Beam',
      desc: 'Low turbulence, smooth target motion, zero decoys.',
      difficulty: 'EASY',
      color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      config: {
        trajectoryType: 'sine_weave' as const,
        targetSpeedDegPerSec: 1.5,
        initialAzimuthDeg: -10,
        initialElevationDeg: 5,
        beaconPowerMw: 50,
        beaconWavelengthNm: 1550,
        targetPulseFreqHz: 100,
        panRangeDeg: 60,
        tiltRangeDeg: 35,
        maxMotorVelocityDegPerSec: 25,
        maxMotorAccelDegPerSec2: 50,
        cameraDelayMs: 40,
        baseFovDeg: 12,
        minFovDeg: 4,
        maxFovDeg: 28,
        controlMode: 'KalmanPredictive' as const,
        pidKp: 2.5,
        pidKi: 0.1,
        pidKd: 0.8,
        enableConfidenceGuidedSearch: true,
        enablePredictivePointing: true,
        enableAdaptiveFov: true,
        enableBeaconIdentityCheck: true,
        enableLockHandoffRecovery: true,
        rytovIndex: 0.1,
        platformVibrationAmpDeg: 0.05,
        platformVibrationFreqHz: 5,
        sensorNoiseDb: -30,
        enableCloudOcclusion: false,
        occlusionIntervalSec: 10,
        occlusionDurationSec: 2,
        decoys: [],
        randomSeed: 2001,
      },
    },
    {
      level: 2,
      title: 'Level 2: Scintillation Storm',
      desc: 'Heavy atmospheric fading (Rytov 0.65) + thermal noise.',
      difficulty: 'MODERATE',
      color: 'border-cyan-300 bg-cyan-50 text-cyan-900',
      btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      config: {
        trajectoryType: 'figure_eight' as const,
        targetSpeedDegPerSec: 2.5,
        initialAzimuthDeg: -15,
        initialElevationDeg: 8,
        beaconPowerMw: 40,
        beaconWavelengthNm: 1550,
        targetPulseFreqHz: 100,
        panRangeDeg: 60,
        tiltRangeDeg: 35,
        maxMotorVelocityDegPerSec: 30,
        maxMotorAccelDegPerSec2: 60,
        cameraDelayMs: 60,
        baseFovDeg: 12,
        minFovDeg: 4,
        maxFovDeg: 28,
        controlMode: 'KalmanPredictive' as const,
        pidKp: 2.5,
        pidKi: 0.1,
        pidKd: 0.8,
        enableConfidenceGuidedSearch: true,
        enablePredictivePointing: true,
        enableAdaptiveFov: true,
        enableBeaconIdentityCheck: true,
        enableLockHandoffRecovery: true,
        rytovIndex: 0.65,
        platformVibrationAmpDeg: 0.2,
        platformVibrationFreqHz: 10,
        sensorNoiseDb: -18,
        enableCloudOcclusion: false,
        occlusionIntervalSec: 10,
        occlusionDurationSec: 2,
        decoys: [],
        randomSeed: 2002,
      },
    },
    {
      level: 3,
      title: 'Level 3: Decoy Ambush Swarm',
      desc: '3 bright distractor decoys crossing beam path.',
      difficulty: 'HARD',
      color: 'border-amber-300 bg-amber-50 text-amber-900',
      btnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
      config: {
        trajectoryType: 'sine_weave' as const,
        targetSpeedDegPerSec: 3.0,
        initialAzimuthDeg: -12,
        initialElevationDeg: 6,
        beaconPowerMw: 50,
        beaconWavelengthNm: 1550,
        targetPulseFreqHz: 100,
        panRangeDeg: 60,
        tiltRangeDeg: 35,
        maxMotorVelocityDegPerSec: 30,
        maxMotorAccelDegPerSec2: 60,
        cameraDelayMs: 60,
        baseFovDeg: 12,
        minFovDeg: 4,
        maxFovDeg: 28,
        controlMode: 'KalmanPredictive' as const,
        pidKp: 2.5,
        pidKi: 0.1,
        pidKd: 0.8,
        enableConfidenceGuidedSearch: true,
        enablePredictivePointing: true,
        enableAdaptiveFov: true,
        enableBeaconIdentityCheck: true,
        enableLockHandoffRecovery: true,
        rytovIndex: 0.25,
        platformVibrationAmpDeg: 0.15,
        platformVibrationFreqHz: 8,
        sensorNoiseDb: -22,
        enableCloudOcclusion: false,
        occlusionIntervalSec: 10,
        occlusionDurationSec: 2,
        decoys: [
          { id: 'd1', name: 'Decoy 1', pulseFreqHz: 120, wavelengthNm: 850, brightnessRatio: 1.3, trajectoryOffsetDeg: { az: 3, el: -2 }, speedMultiplier: 1.1 },
          { id: 'd2', name: 'Decoy 2', pulseFreqHz: 80, wavelengthNm: 1550, brightnessRatio: 1.0, trajectoryOffsetDeg: { az: -4, el: 3 }, speedMultiplier: 0.9 },
        ],
        randomSeed: 2003,
      },
    },
    {
      level: 4,
      title: 'Level 4: Blackout Cloud Handoff',
      desc: 'Periodic 3.0s cloud occlusions testing dead-reckoning.',
      difficulty: 'VERY HARD',
      color: 'border-orange-300 bg-orange-50 text-orange-900',
      btnBg: 'bg-orange-600 hover:bg-orange-500 text-white',
      config: {
        trajectoryType: 'orbital_arc' as const,
        targetSpeedDegPerSec: 3.5,
        initialAzimuthDeg: -15,
        initialElevationDeg: 10,
        beaconPowerMw: 50,
        beaconWavelengthNm: 1550,
        targetPulseFreqHz: 100,
        panRangeDeg: 60,
        tiltRangeDeg: 35,
        maxMotorVelocityDegPerSec: 35,
        maxMotorAccelDegPerSec2: 70,
        cameraDelayMs: 70,
        baseFovDeg: 12,
        minFovDeg: 4,
        maxFovDeg: 28,
        controlMode: 'KalmanPredictive' as const,
        pidKp: 2.5,
        pidKi: 0.1,
        pidKd: 0.8,
        enableConfidenceGuidedSearch: true,
        enablePredictivePointing: true,
        enableAdaptiveFov: true,
        enableBeaconIdentityCheck: true,
        enableLockHandoffRecovery: true,
        rytovIndex: 0.4,
        platformVibrationAmpDeg: 0.25,
        platformVibrationFreqHz: 12,
        sensorNoiseDb: -20,
        enableCloudOcclusion: true,
        occlusionIntervalSec: 8,
        occlusionDurationSec: 3.0,
        decoys: [],
        randomSeed: 2004,
      },
    },
    {
      level: 5,
      title: 'Level 5: Extreme Evasion & Vibration',
      desc: 'Chaotic path (4.8°/s), 0.4° vibration jitter, Rytov 0.70.',
      difficulty: 'EXTREME',
      color: 'border-red-300 bg-red-50 text-red-900',
      btnBg: 'bg-red-600 hover:bg-red-500 text-white',
      config: {
        trajectoryType: 'chaotic_maneuver' as const,
        targetSpeedDegPerSec: 4.8,
        initialAzimuthDeg: -18,
        initialElevationDeg: 12,
        beaconPowerMw: 35,
        beaconWavelengthNm: 1550,
        targetPulseFreqHz: 100,
        panRangeDeg: 60,
        tiltRangeDeg: 35,
        maxMotorVelocityDegPerSec: 40,
        maxMotorAccelDegPerSec2: 80,
        cameraDelayMs: 80,
        baseFovDeg: 12,
        minFovDeg: 4,
        maxFovDeg: 28,
        controlMode: 'KalmanPredictive' as const,
        pidKp: 2.5,
        pidKi: 0.1,
        pidKd: 0.8,
        enableConfidenceGuidedSearch: true,
        enablePredictivePointing: true,
        enableAdaptiveFov: true,
        enableBeaconIdentityCheck: true,
        enableLockHandoffRecovery: true,
        rytovIndex: 0.70,
        platformVibrationAmpDeg: 0.40,
        platformVibrationFreqHz: 15,
        sensorNoiseDb: -15,
        enableCloudOcclusion: true,
        occlusionIntervalSec: 7,
        occlusionDurationSec: 2.5,
        decoys: [
          { id: 'd1', name: 'Decoy 1', pulseFreqHz: 120, wavelengthNm: 850, brightnessRatio: 1.5, trajectoryOffsetDeg: { az: 2, el: -2 }, speedMultiplier: 1.2 },
        ],
        randomSeed: 2005,
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Automatic Challenge Generator & Benchmark Matrix
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Launch standardized benchmark challenges to rigorously test algorithm resilience across progressive disturbance tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((item) => (
          <div key={item.level} className={`p-4 rounded-lg border ${item.color} shadow-sm flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs uppercase tracking-wider">{item.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-current font-bold">
                  {item.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium mb-4">{item.desc}</p>
            </div>

            <button
              onClick={() => onApplyChallenge(item.config, item.title)}
              className={`w-full py-2 ${item.btnBg} font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5`}
            >
              <Zap className="w-3.5 h-3.5" /> Load Benchmark Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
