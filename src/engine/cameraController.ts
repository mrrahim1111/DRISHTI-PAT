import { SimulationConfig, LockState } from '../types/fsoc';

export interface CameraState {
  panDeg: number;
  tiltDeg: number;
  vPan: number;
  vTilt: number;
  activeFovDeg: number;
  activeCameraId: 'CAM_1_WIDE' | 'CAM_2_FINE';
}

interface LatencyCommand {
  executionTime: number;
  targetPan: number;
  targetTilt: number;
}

export class CameraController {
  private state: CameraState;
  private latencyQueue: LatencyCommand[];
  private pidIntegralAz: number;
  private pidIntegralEl: number;
  private lastErrorAz: number;
  private lastErrorEl: number;

  constructor(initialPan = 0, initialTilt = 0, initialFov = 15) {
    this.state = {
      panDeg: initialPan,
      tiltDeg: initialTilt,
      vPan: 0,
      vTilt: 0,
      activeFovDeg: initialFov,
      activeCameraId: 'CAM_1_WIDE',
    };
    this.latencyQueue = [];
    this.pidIntegralAz = 0;
    this.pidIntegralEl = 0;
    this.lastErrorAz = 0;
    this.lastErrorEl = 0;
  }

  public reset(pan = 0, tilt = 0, fov = 15) {
    this.state = {
      panDeg: pan,
      tiltDeg: tilt,
      vPan: 0,
      vTilt: 0,
      activeFovDeg: fov,
      activeCameraId: 'CAM_1_WIDE',
    };
    this.latencyQueue = [];
    this.pidIntegralAz = 0;
    this.pidIntegralEl = 0;
    this.lastErrorAz = 0;
    this.lastErrorEl = 0;
  }

  public updateAdaptiveFov(lockState: LockState, confidence: number, config: SimulationConfig) {
    if (!config.enableAdaptiveFov) {
      this.state.activeFovDeg = config.baseFovDeg;
      return;
    }

    let targetFov = config.baseFovDeg;

    if (lockState === 'SEARCHING' || lockState === 'LOST') {
      targetFov = config.maxFovDeg;
      this.state.activeCameraId = 'CAM_1_WIDE';
    } else if (lockState === 'ACQUIRING') {
      targetFov = config.baseFovDeg;
      this.state.activeCameraId = 'CAM_1_WIDE';
    } else if (lockState === 'LOCKED' && confidence > 0.75) {
      targetFov = config.minFovDeg;
      this.state.activeCameraId = 'CAM_2_FINE';
    } else if (lockState === 'OCCLUDED_COASTING') {
      targetFov = config.baseFovDeg * 1.3;
      this.state.activeCameraId = 'CAM_1_WIDE';
    }

    const fovSpeed = 4.0;
    if (Math.abs(this.state.activeFovDeg - targetFov) > 0.1) {
      const step = Math.sign(targetFov - this.state.activeFovDeg) * fovSpeed * 0.033;
      this.state.activeFovDeg = Math.max(config.minFovDeg, Math.min(config.maxFovDeg, this.state.activeFovDeg + step));
    }
  }

  public updateSteering(
    currentTime: number,
    dt: number,
    targetAz: number,
    targetEl: number,
    config: SimulationConfig
  ): { panDeg: number; tiltDeg: number; motorEffort: number } {
    if (dt <= 0) dt = 0.033;

    const executionTime = currentTime + (config.cameraDelayMs / 1000.0);
    this.latencyQueue.push({ executionTime, targetPan: targetAz, targetTilt: targetEl });

    let desiredPan = targetAz;
    let desiredTilt = targetEl;

    while (this.latencyQueue.length > 0 && this.latencyQueue[0].executionTime <= currentTime) {
      const cmd = this.latencyQueue.shift()!;
      desiredPan = cmd.targetPan;
      desiredTilt = cmd.targetTilt;
    }

    let commandVelAz = 0;
    let commandVelEl = 0;

    if (config.controlMode === 'PID') {
      const errorAz = desiredPan - this.state.panDeg;
      const errorEl = desiredTilt - this.state.tiltDeg;

      this.pidIntegralAz += errorAz * dt;
      this.pidIntegralEl += errorEl * dt;
      this.pidIntegralAz = Math.max(-10, Math.min(10, this.pidIntegralAz));
      this.pidIntegralEl = Math.max(-10, Math.min(10, this.pidIntegralEl));

      const derivAz = (errorAz - this.lastErrorAz) / dt;
      const derivEl = (errorEl - this.lastErrorEl) / dt;

      this.lastErrorAz = errorAz;
      this.lastErrorEl = errorEl;

      commandVelAz = config.pidKp * errorAz + config.pidKi * this.pidIntegralAz + config.pidKd * derivAz;
      commandVelEl = config.pidKp * errorEl + config.pidKi * this.pidIntegralEl + config.pidKd * derivEl;
    } else {
      const gain = 4.5;
      commandVelAz = (desiredPan - this.state.panDeg) * gain;
      commandVelEl = (desiredTilt - this.state.tiltDeg) * gain;
    }

    const maxV = config.maxMotorVelocityDegPerSec;
    commandVelAz = Math.max(-maxV, Math.min(maxV, commandVelAz));
    commandVelEl = Math.max(-maxV, Math.min(maxV, commandVelEl));

    const maxA = config.maxMotorAccelDegPerSec2;
    const accelAz = Math.max(-maxA, Math.min(maxA, (commandVelAz - this.state.vPan) / dt));
    const accelEl = Math.max(-maxA, Math.min(maxA, (commandVelEl - this.state.vTilt) / dt));

    this.state.vPan += accelAz * dt;
    this.state.vTilt += accelEl * dt;

    this.state.panDeg += this.state.vPan * dt;
    this.state.tiltDeg += this.state.vTilt * dt;

    this.state.panDeg = Math.max(-config.panRangeDeg, Math.min(config.panRangeDeg, this.state.panDeg));
    this.state.tiltDeg = Math.max(-config.tiltRangeDeg, Math.min(config.tiltRangeDeg, this.state.tiltDeg));

    const motorEffort = Math.sqrt(this.state.vPan * this.state.vPan + this.state.vTilt * this.state.vTilt);

    return {
      panDeg: this.state.panDeg,
      tiltDeg: this.state.tiltDeg,
      motorEffort,
    };
  }

  public getState(): CameraState {
    return { ...this.state };
  }
}
