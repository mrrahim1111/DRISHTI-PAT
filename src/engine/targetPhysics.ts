import { SimulationConfig } from '../types/fsoc';
import { SeededRandom } from './seedRandom';

export interface SpatialPosition {
  az: number;
  el: number;
  vx: number;
  vy: number;
}

export function computeTargetGroundTruth(time: number, config: SimulationConfig): SpatialPosition {
  const { trajectoryType, targetSpeedDegPerSec, initialAzimuthDeg, initialElevationDeg } = config;
  const t = time;
  const speedScale = targetSpeedDegPerSec / 2.0; // scale factor relative to nominal speed

  let az = initialAzimuthDeg;
  let el = initialElevationDeg;
  let vx = 0;
  let vy = 0;

  switch (trajectoryType) {
    case 'linear': {
      const dirAz = 0.8;
      const dirEl = 0.4;
      az = initialAzimuthDeg + dirAz * targetSpeedDegPerSec * t;
      el = initialElevationDeg + dirEl * targetSpeedDegPerSec * t;
      vx = dirAz * targetSpeedDegPerSec;
      vy = dirEl * targetSpeedDegPerSec;
      break;
    }
    case 'circular': {
      const radiusDeg = 10;
      const angularVelocity = targetSpeedDegPerSec / radiusDeg;
      az = initialAzimuthDeg + radiusDeg * (Math.cos(angularVelocity * t) - 1);
      el = initialElevationDeg + radiusDeg * Math.sin(angularVelocity * t);
      vx = -targetSpeedDegPerSec * Math.sin(angularVelocity * t);
      vy = targetSpeedDegPerSec * Math.cos(angularVelocity * t);
      break;
    }
    case 'random': {
      const segmentDurationSec = 2;
      const completedSegments = Math.floor(t / segmentDurationSec);
      let elapsedInSegmentSec = t;
      let headingRad = 0;

      for (let segmentIndex = 0; segmentIndex <= completedSegments; segmentIndex++) {
        const segmentRandom = new SeededRandom(config.randomSeed + segmentIndex * 2654435761);
        headingRad = segmentRandom.next() * Math.PI * 2;
        const segmentTimeSec = Math.min(segmentDurationSec, elapsedInSegmentSec);
        az += targetSpeedDegPerSec * Math.cos(headingRad) * segmentTimeSec;
        el += targetSpeedDegPerSec * Math.sin(headingRad) * segmentTimeSec;
        elapsedInSegmentSec -= segmentTimeSec;
      }

      vx = targetSpeedDegPerSec * Math.cos(headingRad);
      vy = targetSpeedDegPerSec * Math.sin(headingRad);
      break;
    }
    case 'sine_weave': {
      const freqAz = 0.3 * speedScale;
      const freqEl = 0.6 * speedScale;
      const ampAz = 14;
      const ampEl = 7;

      az = initialAzimuthDeg + ampAz * Math.sin(freqAz * t);
      el = initialElevationDeg + ampEl * Math.cos(freqEl * t);
      vx = ampAz * freqAz * Math.cos(freqAz * t);
      vy = -ampEl * freqEl * Math.sin(freqEl * t);
      break;
    }
    case 'figure_eight': {
      const freq = 0.25 * speedScale;
      const ampAz = 16;
      const ampEl = 9;

      az = initialAzimuthDeg + ampAz * Math.sin(freq * t);
      el = initialElevationDeg + ampEl * Math.sin(2 * freq * t);
      vx = ampAz * freq * Math.cos(freq * t);
      vy = ampEl * 2 * freq * Math.cos(2 * freq * t);
      break;
    }
    case 'orbital_arc': {
      const freq = 0.15 * speedScale;
      const radiusAz = 22;
      const radiusEl = 12;

      az = initialAzimuthDeg + radiusAz * Math.cos(freq * t);
      el = initialElevationDeg + radiusEl * Math.sin(freq * t);
      vx = -radiusAz * freq * Math.sin(freq * t);
      vy = radiusEl * freq * Math.cos(freq * t);
      break;
    }
    case 'chaotic_maneuver': {
      const f1 = 0.4 * speedScale;
      const f2 = 0.9 * speedScale;
      const f3 = 1.4 * speedScale;

      az = initialAzimuthDeg + 12 * Math.sin(f1 * t) + 4 * Math.cos(f2 * t + 1.2);
      el = initialElevationDeg + 6 * Math.cos(f1 * t) + 3 * Math.sin(f3 * t);
      vx = 12 * f1 * Math.cos(f1 * t) - 4 * f2 * Math.sin(f2 * t + 1.2);
      vy = -6 * f1 * Math.sin(f1 * t) + 3 * f3 * Math.cos(f3 * t);
      break;
    }
  }

  return { az, el, vx, vy };
}

export function computeDecoyGroundTruth(
  time: number,
  config: SimulationConfig,
  decoyIndex: number
): SpatialPosition {
  const decoy = config.decoys[decoyIndex];
  if (!decoy) {
    return { az: 0, el: 0, vx: 0, vy: 0 };
  }

  const baseTarget = computeTargetGroundTruth(time, config);
  const t = time;
  const speed = decoy.speedMultiplier;

  // Decoy weaves around target with specified offset and phase shift
  const orbitRadiusAz = decoy.trajectoryOffsetDeg.az;
  const orbitRadiusEl = decoy.trajectoryOffsetDeg.el;
  const freq = 0.5 * speed;

  const az = baseTarget.az + orbitRadiusAz + 3 * Math.sin(freq * t + decoyIndex * 1.5);
  const el = baseTarget.el + orbitRadiusEl + 2 * Math.cos(freq * t * 1.2 + decoyIndex);

  return {
    az,
    el,
    vx: baseTarget.vx + 3 * freq * Math.cos(freq * t + decoyIndex * 1.5),
    vy: baseTarget.vy - 2 * freq * 1.2 * Math.sin(freq * t * 1.2 + decoyIndex),
  };
}
