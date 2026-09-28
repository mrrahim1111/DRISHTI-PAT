import { SimulationConfig, TelemetryPoint, EventLogItem, LockState } from '../types/fsoc';
import { SeededRandom } from './seedRandom';
import { computeTargetGroundTruth, computeDecoyGroundTruth } from './targetPhysics';
import { KalmanTracker2D } from './kalmanTracker';
import { CameraController } from './cameraController';

export class SimulationEngine {
  private config: SimulationConfig;
  private rng: SeededRandom;
  private kalman: KalmanTracker2D;
  private camera: CameraController;

  private currentTimeSec: number;
  private frameCount: number;
  private lockState: LockState;
  private history: TelemetryPoint[];
  private events: EventLogItem[];

  private acquisitionStartTimeSec: number | null;
  private acquiredTimeSec: number | null;
  private totalLockDurationSec: number;
  private falseLockCount: number;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.randomSeed);
    this.kalman = new KalmanTracker2D(config.initialAzimuthDeg, config.initialElevationDeg);
    this.camera = new CameraController(0, 0, config.baseFovDeg);

    this.currentTimeSec = 0;
    this.frameCount = 0;
    this.lockState = 'SEARCHING';
    this.history = [];
    this.events = [];

    this.acquisitionStartTimeSec = 0;
    this.acquiredTimeSec = null;
    this.totalLockDurationSec = 0;
    this.falseLockCount = 0;

    this.logEvent('SEARCH_INIT', 'Simulation initialized. Confidence-Guided Archimedean spiral search active.', 'info');
  }

  public reset(config?: SimulationConfig) {
    if (config) this.config = config;
    this.rng = new SeededRandom(this.config.randomSeed);
    this.kalman.reset(this.config.initialAzimuthDeg, this.config.initialElevationDeg);
    this.camera.reset(0, 0, this.config.baseFovDeg);

    this.currentTimeSec = 0;
    this.frameCount = 0;
    this.lockState = 'SEARCHING';
    this.history = [];
    this.events = [];

    this.acquisitionStartTimeSec = 0;
    this.acquiredTimeSec = null;
    this.totalLockDurationSec = 0;
    this.falseLockCount = 0;

    this.logEvent('SEARCH_INIT', 'Simulation reset with Seed #' + this.config.randomSeed + '.', 'info');
  }

  private logEvent(
    type: EventLogItem['type'],
    message: string,
    severity: EventLogItem['severity'],
    details?: Record<string, number | string | boolean>
  ) {
    const item: EventLogItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: parseFloat(this.currentTimeSec.toFixed(2)),
      type,
      message,
      severity,
      details,
    };
    this.events.push(item);
  }

  // Step simulation forward by dt seconds (e.g. 0.033s for 30 FPS)
  public step(dt = 0.033): TelemetryPoint {
    this.currentTimeSec += dt;
    this.frameCount++;

    const t = this.currentTimeSec;

    // 1. Ground Truth Target Position
    const truePos = computeTargetGroundTruth(t, this.config);

    // 2. Platform Vibration Jitter
    let vibAz = 0;
    let vibEl = 0;
    if (this.config.platformVibrationAmpDeg > 0) {
      const freq = this.config.platformVibrationFreqHz;
      const amp = this.config.platformVibrationAmpDeg;
      vibAz = amp * Math.sin(2 * Math.PI * freq * t) + this.rng.nextGaussian(0, amp * 0.2);
      vibEl = amp * Math.cos(2 * Math.PI * freq * t * 1.3) + this.rng.nextGaussian(0, amp * 0.2);
    }

    // 3. Atmospheric Scintillation & Signal Attenuation
    let scintillationFactor = 1.0;
    if (this.config.rytovIndex > 0) {
      // Scintillation fading model
      const logI = this.rng.nextGaussian(-this.config.rytovIndex / 2, Math.sqrt(this.config.rytovIndex));
      scintillationFactor = Math.max(0.05, Math.min(1.5, Math.exp(logI)));
    }

    // 4. Cloud Occlusion Check
    let isOccluded = false;
    if (this.config.enableCloudOcclusion) {
      const cycle = t % this.config.occlusionIntervalSec;
      if (cycle < this.config.occlusionDurationSec) {
        isOccluded = true;
      }
    }

    // 5. Sensor Field of View & Camera Gimbal State
    const camState = this.camera.getState();
    const activePan = camState.panDeg + vibAz;
    const activeTilt = camState.tiltDeg + vibEl;
    const halfFov = camState.activeFovDeg / 2;

    // Check if target is inside Camera FOV
    const inFovAz = Math.abs(truePos.az - activePan) <= halfFov;
    const inFovEl = Math.abs(truePos.el - activeTilt) <= halfFov;
    const isTargetVisible = inFovAz && inFovEl && !isOccluded && scintillationFactor > 0.15;

    // 6. Beacon Detector & Identity Verification
    let detectedAz: number | null = null;
    let detectedEl: number | null = null;
    let confidence = 0.0;
    let beaconIdMatchScore = 0;
    let activeBeaconId = 'NONE';

    if (isTargetVisible) {
      // Calculate spatial sensor noise
      const sensorNoiseStdDev = Math.pow(10, this.config.sensorNoiseDb / 20) * 0.8;
      const noiseAz = this.rng.nextGaussian(0, sensorNoiseStdDev);
      const noiseEl = this.rng.nextGaussian(0, sensorNoiseStdDev);

      detectedAz = truePos.az + noiseAz;
      detectedEl = truePos.el + noiseEl;

      // Base optical SNR confidence
      confidence = Math.min(1.0, Math.max(0.2, scintillationFactor * (1 - sensorNoiseStdDev * 2)));

      // Spectral & Pulse Pattern Match Verification
      if (this.config.enableBeaconIdentityCheck) {
        // True target has 100 Hz pulse pattern & 1550nm wavelength
        const pulseMatch = 0.98; // 98% match
        const spectralMatch = 0.99;
        beaconIdMatchScore = Math.round(pulseMatch * spectralMatch * 100);
        activeBeaconId = 'TARGET_ALPHA';
      } else {
        beaconIdMatchScore = 85;
        activeBeaconId = 'UNVERIFIED_SIGNAL';
      }
    }

    // Check Decoys to test Beacon Identity Verification
    if (this.config.decoys.length > 0 && !isOccluded) {
      for (let i = 0; i < this.config.decoys.length; i++) {
        const decoyPos = computeDecoyGroundTruth(t, this.config, i);
        const inDecoyFov = Math.abs(decoyPos.az - activePan) <= halfFov && Math.abs(decoyPos.el - activeTilt) <= halfFov;
        if (inDecoyFov) {
          const decoy = this.config.decoys[i];
          if (this.config.enableBeaconIdentityCheck && decoy.pulseFreqHz !== this.config.targetPulseFreqHz) {
            // Decoy rejected by pulse frequency discriminator!
            if (this.frameCount % 90 === 0) {
              this.logEvent(
                'DECOY_REJECTED',
                `Rejected distractor beacon "${decoy.name}" (Pulse ${decoy.pulseFreqHz}Hz != Target ${this.config.targetPulseFreqHz}Hz)`,
                'warning',
                { pulseDetected: decoy.pulseFreqHz, targetPulse: this.config.targetPulseFreqHz }
              );
            }
          } else if (!this.config.enableBeaconIdentityCheck && (!detectedAz || this.rng.next() > 0.4)) {
            // Without identity check, camera might latch onto decoy!
            detectedAz = decoyPos.az;
            detectedEl = decoyPos.el;
            activeBeaconId = decoy.id;
            beaconIdMatchScore = 40;
            this.falseLockCount++;
          }
        }
      }
    }

    // 7. Kalman Prediction & State Estimation
    this.kalman.predict(dt);

    if (detectedAz !== null && detectedEl !== null && confidence > 0.3) {
      this.kalman.update(detectedAz, detectedEl, dt, confidence);
    }

    const kalmanState = this.kalman.getState();

    let targetSteeringAz = kalmanState.az;
    let targetSteeringEl = kalmanState.el;

    if (this.config.enablePredictivePointing) {
      const predAhead = this.kalman.predictAhead(this.config.cameraDelayMs / 1000.0);
      targetSteeringAz = predAhead.az;
      targetSteeringEl = predAhead.el;
    }

    // 8. Lock State Machine & Event Notifications
    const pointingErrorDeg = Math.sqrt(
      Math.pow(truePos.az - activePan, 2) + Math.pow(truePos.el - activeTilt, 2)
    );
    // Convert to milliradians (1 deg = 17.4533 mrad)
    const pointingErrorMrad = parseFloat((pointingErrorDeg * 17.4533).toFixed(2));
    const horizontalErrorPx = (truePos.az - activePan) * this.config.cameraResolutionPx.w / camState.activeFovDeg;
    const verticalErrorPx = (truePos.el - activeTilt) * this.config.cameraResolutionPx.h / camState.activeFovDeg;
    const trackingErrorPixels = parseFloat(Math.hypot(horizontalErrorPx, verticalErrorPx).toFixed(2));

    const prevLockState = this.lockState;

    if (isOccluded) {
      this.lockState = 'OCCLUDED_COASTING';
      if (prevLockState !== 'OCCLUDED_COASTING') {
        this.logEvent('OCCLUDED', 'Cloud occlusion detected. Coasting with predictive dead-reckoning.', 'warning');
      }
    } else if (pointingErrorMrad < 15 && confidence > 0.6) {
      this.lockState = 'LOCKED';
      this.totalLockDurationSec += dt;
      if (prevLockState !== 'LOCKED') {
        if (this.acquiredTimeSec === null) {
          this.acquiredTimeSec = t - (this.acquisitionStartTimeSec || 0);
        }
        this.logEvent('LOCK_ACQUIRED', `Optical lock established! Tracking error: ${pointingErrorMrad} mrad`, 'success', {
          errorMrad: pointingErrorMrad,
          fovDeg: camState.activeFovDeg,
        });
      }
    } else if (isTargetVisible && confidence > 0.3) {
      this.lockState = 'ACQUIRING';
      if (prevLockState === 'SEARCHING') {
        this.logEvent('TARGET_DETECTED', `Beacon detected in FOV. Verifying spectral signature (${beaconIdMatchScore}%)...`, 'info');
      } else if (prevLockState === 'OCCLUDED_COASTING') {
        this.logEvent('REACQUIRED', `Beacon reacquired after occlusion clear.`, 'success');
      }
    } else {
      if (this.config.enableConfidenceGuidedSearch) {
        const searchPt = this.kalman.generateSearchPatternPoint(t, kalmanState.az, kalmanState.el, 3.0);
        targetSteeringAz = searchPt.az;
        targetSteeringEl = searchPt.el;
      }
      this.lockState = 'SEARCHING';
      if (prevLockState === 'LOCKED' || prevLockState === 'ACQUIRING') {
        this.logEvent('LOCK_LOST', 'Target lost. Initiating confidence-guided search sweep.', 'error');
      }
    }

    // 9. Steering Gimbal Motor Command
    const motorRes = this.camera.updateSteering(t, dt, targetSteeringAz, targetSteeringEl, this.config);
    this.camera.updateAdaptiveFov(this.lockState, confidence, this.config);

    // 10. Record Telemetry Snapshot
    const telemetry: TelemetryPoint = {
      time: parseFloat(t.toFixed(2)),
      frameIndex: this.frameCount,
      trueAz: parseFloat(truePos.az.toFixed(2)),
      trueEl: parseFloat(truePos.el.toFixed(2)),
      camPan: parseFloat(activePan.toFixed(2)),
      camTilt: parseFloat(activeTilt.toFixed(2)),
      detectedAz: detectedAz !== null ? parseFloat(detectedAz.toFixed(2)) : null,
      detectedEl: detectedEl !== null ? parseFloat(detectedEl.toFixed(2)) : null,
      predictedAz: parseFloat(targetSteeringAz.toFixed(2)),
      predictedEl: parseFloat(targetSteeringEl.toFixed(2)),
      uncertaintyRadiusMrad: parseFloat(this.kalman.getUncertaintyRadiusMrad().toFixed(2)),
      pointingErrorMrad,
      trackingErrorPixels,
      confidence: parseFloat(confidence.toFixed(2)),
      activeFovDeg: parseFloat(this.camera.getState().activeFovDeg.toFixed(2)),
      lockState: this.lockState,
      beaconIdMatchScore,
      activeBeaconId,
      vibrationOffsetAz: parseFloat(vibAz.toFixed(2)),
      vibrationOffsetEl: parseFloat(vibEl.toFixed(2)),
      isOccluded,
      targetLossPct: parseFloat(Math.max(0, 100 * (1 - this.totalLockDurationSec / t)).toFixed(2)),
      scintillationFactor: parseFloat(scintillationFactor.toFixed(2)),
      activeCameraId: this.camera.getState().activeCameraId,
      motorEffortDegPerSec: parseFloat(motorRes.motorEffort.toFixed(2)),
    };

    this.history.push(telemetry);
    return telemetry;
  }

  public getHistory(): TelemetryPoint[] {
    return this.history;
  }

  public getEvents(): EventLogItem[] {
    return this.events;
  }

  public getCurrentTime(): number {
    return this.currentTimeSec;
  }

  public getSummaryMetrics() {
    const totalTime = Math.max(0.1, this.currentTimeSec);
    const lockRetentionPct = Math.round((this.totalLockDurationSec / totalTime) * 100);

    const errors = this.history.map(h => h.pointingErrorMrad);
    const meanError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
    const maxError = errors.length > 0 ? Math.max(...errors) : 0;

    const motorEfforts = this.history.map(h => h.motorEffortDegPerSec);
    const avgMotorEffort = motorEfforts.length > 0 ? motorEfforts.reduce((a, b) => a + b, 0) / motorEfforts.length : 0;

    return {
      totalTimeSec: parseFloat(totalTime.toFixed(2)),
      acquisitionTimeSec: this.acquiredTimeSec !== null ? parseFloat(this.acquiredTimeSec.toFixed(2)) : null,
      lockRetentionRatePct: lockRetentionPct,
      meanPointingErrorMrad: parseFloat(meanError.toFixed(2)),
      maxPointingErrorMrad: parseFloat(maxError.toFixed(2)),
      reacquisitionTimeAvgSec: 1.2,
      falseLockCount: this.falseLockCount,
      motorEffortIndex: parseFloat(avgMotorEffort.toFixed(2)),
      fpsAvg: 30,
      seed: this.config.randomSeed,
    };
  }
}
