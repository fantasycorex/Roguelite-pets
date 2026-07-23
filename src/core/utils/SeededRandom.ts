/**
 * Deterministic Mulberry32 Pseudorandom Number Generator (PRNG)
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns pseudo-random float in range [0, 1)
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns pseudo-random integer in range [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Picks a random element from array
   */
  public choice<T>(array: T[]): T {
    const idx = Math.floor(this.nextFloat() * array.length);
    return array[idx];
  }

  /**
   * Samples N unique random elements from array without replacement
   */
  public sample<T>(array: T[], count: number): T[] {
    const pool = [...array];
    const result: T[] = [];
    const n = Math.min(count, pool.length);

    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this.nextFloat() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }

    return result;
  }
}
