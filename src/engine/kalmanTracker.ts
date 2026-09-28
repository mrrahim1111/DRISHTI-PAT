export interface KalmanState {
  az: number;
  el: number;
  vAz: number;
  vEl: number;
  pAz: number; // Covariance variance Az
  pEl: number; // Covariance variance El
}

export class KalmanTracker2D {
  private state: KalmanState;
  private qProcess: number; // Process noise
  private rMeasure: number; // Measurement noise

  constructor(initialAz = 0, initialEl = 0) {
    this.state = {
      az: initialAz,
      el: initialEl,
      vAz: 0,
      vEl: 0,
      pAz: 1.0,
      pEl: 1.0,
    };
    this.qProcess = 0.05; // process uncertainty variance
    this.rMeasure = 0.2; // sensor noise variance
  }

  public reset(az = 0, el = 0) {
    this.state = {
      az,
      el,
      vAz: 0,
      vEl: 0,
      pAz: 1.0,
      pEl: 1.0,
    };
  }

  // Kalman Predict Step given delta time dt (seconds)
  public predict(dt: number): { az: number; el: number } {
    this.state.az += this.state.vAz * dt;
    this.state.el += this.state.vEl * dt;
    this.state.pAz += this.qProcess * dt;
    this.state.pEl += this.qProcess * dt;
    return { az: this.state.az, el: this.state.el };
  }

  // Predict position at latency horizon delta t (e.g. 60ms ahead)
  public predictAhead(latencySec: number): { az: number; el: number } {
    return {
      az: this.state.az + this.state.vAz * latencySec,
      el: this.state.el + this.state.vEl * latencySec,
    };
  }

  // Kalman Update Step with fresh centroid measurement (detectedAz, detectedEl)
  public update(detectedAz: number, detectedEl: number, dt: number, confidence: number) {
    if (dt <= 0) dt = 0.033;

    // Measurement noise scales inversely with confidence
    const dynamicR = this.rMeasure / Math.max(0.1, confidence);

    // Azimuth update
    const kalmanGainAz = this.state.pAz / (this.state.pAz + dynamicR);
    const innovationAz = detectedAz - this.state.az;
    this.state.az += kalmanGainAz * innovationAz;
    this.state.vAz += (kalmanGainAz * innovationAz) / dt * 0.4; // velocity smoothing
    this.state.pAz = (1 - kalmanGainAz) * this.state.pAz;

    // Elevation update
    const kalmanGainEl = this.state.pEl / (this.state.pEl + dynamicR);
    const innovationEl = detectedEl - this.state.el;
    this.state.el += kalmanGainEl * innovationEl;
    this.state.vEl += (kalmanGainEl * innovationEl) / dt * 0.4;
    this.state.pEl = (1 - kalmanGainEl) * this.state.pEl;
  }

  public getState(): KalmanState {
    return { ...this.state };
  }

  // Calculates spatial uncertainty radius in mrad/degrees based on covariance
  public getUncertaintyRadiusMrad(): number {
    const varTotal = Math.sqrt(this.state.pAz + this.state.pEl);
    // Convert degrees to milliradians (1 deg approx 17.45 mrad)
    return Math.max(0.5, varTotal * 17.45);
  }

  // Confidence-Guided Archimedean Spiral Search Generator around last predicted target location
  public generateSearchPatternPoint(time: number, baseAz: number, baseEl: number, uncertaintyRadiusDeg: number): { az: number; el: number } {
    const spiralSpeed = 3.5; // rad/s
    const theta = time * spiralSpeed;
    const r = Math.min(uncertaintyRadiusDeg * 1.5, 0.5 + 0.8 * (theta % (Math.PI * 4)));
    return {
      az: baseAz + r * Math.cos(theta),
      el: baseEl + r * Math.sin(theta),
    };
  }
}
