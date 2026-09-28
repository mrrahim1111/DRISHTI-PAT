import { ScenarioPreset, SimulationConfig } from '../types/fsoc';
import { PS4_SPECIFICATION } from './problemStatement4';

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  // --- OFFICIAL PS: Camera Parameters (Sr. No. 1–6) ---
  screenSizePx: { w: PS4_SPECIFICATION.camera.screenSizeMinPx.width, h: PS4_SPECIFICATION.camera.screenSizeMinPx.height },
  cameraResolutionPx: { w: PS4_SPECIFICATION.camera.resolutionPx.width, h: PS4_SPECIFICATION.camera.resolutionPx.height },
  cameraFovDeg: { h: PS4_SPECIFICATION.camera.fovDefaultDeg.horizontal, v: PS4_SPECIFICATION.camera.fovDefaultDeg.vertical },
  cameraUpdateRateHz: PS4_SPECIFICATION.camera.updateRateMinHz,

  // --- OFFICIAL PS: Target Parameters (Sr. No. 7–12) ---
  trajectoryType: 'figure_eight',              // Sr.12: Straight Line, Circular, Figure of 8, Random
  targetSizePx: PS4_SPECIFICATION.target.sizePx.default,
  initialTargetLocation: 'random',             // Sr.11: default random
  targetSpeedDegPerSec: 1.5,
  initialAzimuthDeg: -1.5,
  initialElevationDeg: 1.0,
  beaconPowerMw: 50,
  beaconWavelengthNm: 1550,
  targetPulseFreqHz: 100,

  // --- OFFICIAL PS: Camera Motion Constraints (Sr. No. 13–15) ---
  panRangeDeg: 60,
  tiltRangeDeg: 35,
  maxMotorVelocityDegPerSec: PS4_SPECIFICATION.cameraMotion.panSpeedDegPerSec.default,
  maxMotorAccelDegPerSec2: 25,
  cameraDelayMs: 40,
  baseFovDeg: 4,                               // Sr.4: 4°
  minFovDeg: 2,
  maxFovDeg: 10,

  // --- OFFICIAL PS: Disturbances & Noise (Sr. No. 21) ---
  noiseType: 'none',
  noiseSaltPepperPct: PS4_SPECIFICATION.disturbances.saltPepperImagePct,
  noiseGaussianSd: 5,
  cameraJitterPx: 0,
  atmosphericCondition: 'clear',               // Sr.21.4: Clear, Haze, Fog, Rain, Low light
  platformMotionAmpPx: 0,

  // --- Tracking Controller Logic ---
  controlMode: 'KalmanPredictive',
  pidKp: 2.5,
  pidKi: 0.1,
  pidKd: 0.8,
  enableConfidenceGuidedSearch: true,
  enablePredictivePointing: true,
  enableAdaptiveFov: true,
  enableBeaconIdentityCheck: true,
  enableLockHandoffRecovery: true,

  // --- Extended Physical Sim Params ---
  rytovIndex: 0,
  platformVibrationAmpDeg: 0,
  platformVibrationFreqHz: 8.0,
  sensorNoiseDb: -25,
  enableCloudOcclusion: false,
  occlusionIntervalSec: 10,
  occlusionDurationSec: 2.0,

  // Distractors
  decoys: [],

  // Reproducibility
  randomSeed: 1042,
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'isro-ps-nominal',
    name: '1. ISRO Benchmark: Nominal Coarse Alignment (PS Sr. 1–20)',
    category: 'Benchmark',
    description: 'Department of Space PS-4 baseline: 2000x2000 scene, 640x480 FPA camera (4x3 degree FOV), default pan/tilt speed 5 degrees/s, and 10x10 px beacon. Performance thresholds are reported against the supplied specification.',
    isOfficialParameter: true,
    sourceNote: 'ISRO / DOS Problem Statement 4 — Mandatory Specifications',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'figure_eight',
      targetSpeedDegPerSec: 1.5,
      atmosphericCondition: 'clear',
      noiseType: 'none',
      cameraJitterPx: 0,
      platformMotionAmpPx: 0,
      decoys: [],
    }
  },
  {
    id: 'isro-ps-salt-pepper',
    name: '2. ISRO Benchmark: 10% Salt & Pepper Noise (PS Sr. 21.1)',
    category: 'Disturbance Test',
    description: '10% impulse Salt & Pepper noise across the 640x480 focal plane array with centroiding and morphological filtering active.',
    isOfficialParameter: true,
    sourceNote: 'ISRO PS-4 Sr. No. 21.1 — Image Noise (Salt & Pepper ~10%)',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'linear',
      targetSpeedDegPerSec: 1.8,
      noiseType: 'salt_pepper',
      noiseSaltPepperPct: 10,
      atmosphericCondition: 'clear',
      decoys: [],
    }
  },
  {
    id: 'isro-ps-atmospheric',
    name: '3. ISRO Benchmark: Fog & Low-Light Attenuation (PS Sr. 21.4)',
    category: 'Disturbance Test',
    description: 'Heavy atmospheric fog and low ambient illumination causing strong reduction in contrast and SNR, testing adaptive gain and Kalman recovery.',
    isOfficialParameter: true,
    sourceNote: 'ISRO PS-4 Sr. No. 21.4 — Atmospheric Disturbance (Fog / Low Light)',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'circular',
      targetSpeedDegPerSec: 1.2,
      atmosphericCondition: 'fog',
      noiseType: 'gaussian',
      noiseGaussianSd: 8,
      rytovIndex: 0.45,
      decoys: [],
    }
  },
  {
    id: 'isro-ps-vibration-jitter',
    name: '4. ISRO Benchmark: Max Jitter ±20 px & Platform Motion (PS Sr. 21.3/5)',
    category: 'Disturbance Test',
    description: 'Maximum camera jitter (±20 px/frame) and linear platform motion (±20 px/frame) testing feedforward motor stabilization and PID dampening.',
    isOfficialParameter: true,
    sourceNote: 'ISRO PS-4 Sr. No. 21.3 & 21.5 — Camera Jitter & Platform Motion',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'figure_eight',
      targetSpeedDegPerSec: 2.2,
      cameraJitterPx: 18,
      platformMotionAmpPx: 18,
      platformVibrationAmpDeg: 0.25,
      platformVibrationFreqHz: 12.0,
      decoys: [],
    }
  },
  {
    id: 'isro-ps-multi-decoy',
    name: '5. ISRO Benchmark: Multi-Decoy Optical Discrimination (PS Sr. 8, 12)',
    category: 'Decoy Challenge',
    description: 'Multiple optical distractors crossing the field of view with asynchronous pulse repetition frequencies to evaluate autonomous beacon identity verification.',
    isOfficialParameter: true,
    sourceNote: 'ISRO PS-4 Sr. No. 8 — Multiple Targets & Modulation Discrimination',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'sine_weave',
      targetSpeedDegPerSec: 2.0,
      enableBeaconIdentityCheck: true,
      decoys: [
        {
          id: 'decoy-1',
          name: 'Decoy 1 (120 Hz, 850nm)',
          pulseFreqHz: 120,
          wavelengthNm: 850,
          brightnessRatio: 1.3,
          trajectoryOffsetDeg: { az: 1.5, el: -1.0 },
          speedMultiplier: 0.9,
        },
        {
          id: 'decoy-2',
          name: 'Decoy 2 (80 Hz, 1550nm)',
          pulseFreqHz: 80,
          wavelengthNm: 1550,
          brightnessRatio: 1.0,
          trajectoryOffsetDeg: { az: -2.0, el: 1.5 },
          speedMultiplier: 1.1,
        }
      ]
    }
  },
  {
    id: 'preset-extreme-evasion',
    name: '6. High-Dynamics Evasive Maneuvers',
    category: 'Extreme Dynamics',
    description: 'High angular rate chaotic motion testing pan/tilt motor velocity saturations and predictive Kalman state updates.',
    isOfficialParameter: false,
    sourceNote: 'Configurable Proposal (Target Speed 3.5°/s, Chaotic Lissajous Curves)',
    config: {
      ...DEFAULT_SIMULATION_CONFIG,
      trajectoryType: 'chaotic_maneuver',
      targetSpeedDegPerSec: 3.5,
      maxMotorVelocityDegPerSec: 10,
      maxMotorAccelDegPerSec2: 30,
      controlMode: 'KalmanPredictive',
      enablePredictivePointing: true,
      enableAdaptiveFov: true,
    }
  }
];
