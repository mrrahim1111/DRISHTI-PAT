// Simple Mulberry32 deterministic pseudo-random number generator
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Returns a pseudo-random float between 0.0 and 1.0
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Box-Muller transform for standard Gaussian normal distribution N(0, 1)
  public nextGaussian(mean = 0, stdDev = 1): number {
    const u1 = Math.max(1e-10, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}
