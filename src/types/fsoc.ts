export type TrajectoryType = 'linear' | 'circular' | 'figure_eight' | 'random' | 'spiral' | 'sinusoidal' | 'sine_weave' | 'orbital_arc' | 'chaotic_maneuver';
export type ControlMode = 'PID' | 'KalmanPredictive' | 'RuleBased';
export type LockState = 'SEARCHING' | 'ACQUIRING' | 'LOCKED' | 'OCCLUDED_COASTING' | 'LOST' | 'HANDOFF';
export type ActiveTab = 'mission' | 'config' | 'analytics' | 'events' | 'stability' | 'challenge' | 'globe3d' | 'architecture';

// Official PS Noise Types (Sr. No. 21 — Disturbances)
export type NoiseType = 'none' | 'salt_pepper' | 'gaussian' | 'poisson' | 'salt_pepper+gaussian' | 'all';

// Official PS Atmospheric Conditions (Sr. No. 21.4)
export type AtmosphericCondition = 'clear' | 'haze' | 'fog' | 'rain' | 'low_light';

export interface DecoyConfig {
  id: string;
  name: string;
  pulseFreqHz: number; // e.g. 120 Hz vs true target 100 Hz
  wavelengthNm: number; // e.g. 850nm vs true target 1550nm
  brightnessRatio: number; // 0.5 - 1.5 relative to target
  trajectoryOffsetDeg: { az: number; el: number };
  speedMultiplier: number;
}

export interface SimulationConfig {
  // --- OFFICIAL PS: Camera Parameters (Sr. No. 1–6) ---
  screenSizePx: { w: number; h: number };          // Sr.1: min 2000×2000
  cameraResolutionPx: { w: number; h: number };    // Sr.3: 640×480
  cameraFovDeg: { h: number; v: number };          // Sr.4: default 4°×3°
  cameraUpdateRateHz: number;                      // Sr.5: ≥30 Hz

  // --- OFFICIAL PS: Target Parameters (Sr. No. 7–12) ---
  trajectoryType: TrajectoryType;                  // Sr.12: Straight Line, Circular, Figure-8, Random + optional
  targetSizePx: number;                            // Sr.10: 5–20 px, default 10
  initialTargetLocation: 'random' | 'center' | 'custom'; // Sr.11
  targetSpeedDegPerSec: number;
  initialAzimuthDeg: number;
  initialElevationDeg: number;
  beaconPowerMw: number;
  beaconWavelengthNm: number;
  targetPulseFreqHz: number;

  // --- OFFICIAL PS: Camera Motion Constraints (Sr. No. 13–15) ---
  panRangeDeg: number;
  tiltRangeDeg: number;
  maxMotorVelocityDegPerSec: number;               // Sr.13-14: 5–10 °/s
  maxMotorAccelDegPerSec2: number;
  cameraDelayMs: number;
  baseFovDeg: number;
  minFovDeg: number;
  maxFovDeg: number;

  // --- OFFICIAL PS: Disturbances & Noise (Sr. No. 21) ---
  noiseType: NoiseType;                            // Sr.21.1: Salt&Pepper, Gaussian, Poisson
  noiseSaltPepperPct: number;                      // Sr.21.1: ~10%
  noiseGaussianSd: number;                         // Sr.21.2: max 20 px
  cameraJitterPx: number;                          // Sr.21.3: ±20 px/frame
  atmosphericCondition: AtmosphericCondition;      // Sr.21.4: Clear/Haze/Fog/Rain/Low light
  platformMotionAmpPx: number;                     // Sr.21.5: ±20 px/frame

  // --- Legacy / Extended Simulation Params ---
  rytovIndex: number;
  platformVibrationAmpDeg: number;
  platformVibrationFreqHz: number;
  sensorNoiseDb: number;
  enableCloudOcclusion: boolean;
  occlusionIntervalSec: number;
  occlusionDurationSec: number;

  // Tracking Controller Logic
  controlMode: ControlMode;
  pidKp: number;
  pidKi: number;
  pidKd: number;
  enableConfidenceGuidedSearch: boolean;
  enablePredictivePointing: boolean;
  enableAdaptiveFov: boolean;
  enableBeaconIdentityCheck: boolean;
  enableLockHandoffRecovery: boolean;

  // Distractors
  decoys: DecoyConfig[];

  // Reproducibility
  randomSeed: number;
}

export interface TelemetryPoint {
  time: number; // elapsed seconds
  frameIndex: number;

  // Ground truth
  trueAz: number;
  trueEl: number;

  // Camera orientation
  camPan: number;
  camTilt: number;

  // Detections & Predictions
  detectedAz: number | null;
  detectedEl: number | null;
  predictedAz: number;
  predictedEl: number;
  uncertaintyRadiusMrad: number;

  // Status & Performance
  pointingErrorMrad: number; // angular error in milliradians
  trackingErrorPixels: number; // Sr.17: tracking error in pixels on 640x480 FPA (PS target <= 10 px)
  confidence: number; // 0.0 - 1.0
  activeFovDeg: number;
  lockState: LockState;
  targetLossPct: number; // Sr.18: target loss rate (< 5%)

  // Spectral & ID Match
  beaconIdMatchScore: number; // 0 - 100%
  activeBeaconId: string; // 'TARGET_ALPHA' | 'DECOY_1' | 'NONE'

  // Disturbances state
  vibrationOffsetAz: number;
  vibrationOffsetEl: number;
  isOccluded: boolean;
  scintillationFactor: number;

  // Auxiliary
  activeCameraId: 'CAM_1_WIDE' | 'CAM_2_FINE';
  motorEffortDegPerSec: number;
}

export interface EventLogItem {
  id: string;
  time: number;
  type: 'SEARCH_INIT' | 'TARGET_DETECTED' | 'ID_VERIFIED' | 'LOCK_ACQUIRED' | 'LOCK_LOST' | 'OCCLUDED' | 'HANDOFF_TRIGGERED' | 'REACQUIRED' | 'DECOY_REJECTED';
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  details?: Record<string, number | string | boolean>;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  category: 'Benchmark' | 'Disturbance Test' | 'Decoy Challenge' | 'Extreme Dynamics';
  description: string;
  isOfficialParameter: boolean; // Flag to distinguish official PS values vs configurable proposals
  sourceNote: string;
  config: SimulationConfig;
}

export interface RunEvaluationSummary {
  scenarioName: string;
  timestamp: string;
  totalTimeSec: number;
  acquisitionTimeSec: number | null; // PS: <= 2.0 sec
  reacquisitionTimeAvgSec: number | null; // PS: <= 1.0 sec
  lockRetentionRatePct: number;
  targetLossPct: number; // PS: < 5.0%
  meanPointingErrorMrad: number;
  maxPointingErrorMrad: number;
  meanTrackingErrorPixels: number; // PS: <= 10 pixels
  maxTrackingErrorPixels: number;
  falseLockCount: number;
  motorEffortIndex: number;
  fpsAvg: number; // PS: >= 20 FPS
  meetsPsThresholds: boolean; // Evaluates against all 5 ISRO PS criteria
  seed: number;
}
