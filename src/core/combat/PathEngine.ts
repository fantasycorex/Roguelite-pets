export interface Point {
  x: number;
  y: number;
}

export class PathEngine {
  private primaryWaypoints: Point[];
  private secondaryWaypoints: Point[];
  private primaryLengths: number[] = [];
  private primaryTotalLength: number = 0;
  private secondaryLengths: number[] = [];
  private secondaryTotalLength: number = 0;

  constructor(primaryWaypoints: Point[], secondaryWaypoints?: Point[]) {
    this.primaryWaypoints = primaryWaypoints;
    this.secondaryWaypoints =
      secondaryWaypoints && secondaryWaypoints.length > 0 ? secondaryWaypoints : primaryWaypoints;
    this.calculateLengths();
  }

  private calculateLengths(): void {
    this.primaryLengths = this.computeLengths(this.primaryWaypoints);
    this.primaryTotalLength = this.primaryLengths.reduce((a, b) => a + b, 0);

    this.secondaryLengths = this.computeLengths(this.secondaryWaypoints);
    this.secondaryTotalLength = this.secondaryLengths.reduce((a, b) => a + b, 0);
  }

  private computeLengths(points: Point[]): number[] {
    const lengths: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      lengths.push(Math.hypot(p2.x - p1.x, p2.y - p1.y));
    }
    return lengths;
  }

  public getTotalLength(trackIndex: number = 0): number {
    return trackIndex === 1 ? this.secondaryTotalLength : this.primaryTotalLength;
  }

  public getWaypoints(trackIndex: number = 0): Point[] {
    return trackIndex === 1 ? [...this.secondaryWaypoints] : [...this.primaryWaypoints];
  }

  public getPositionAlongPath(
    distanceCovered: number,
    trackIndex: number = 0,
  ): {
    x: number;
    y: number;
    reachedEnd: boolean;
  } {
    const points = trackIndex === 1 ? this.secondaryWaypoints : this.primaryWaypoints;
    const lengths = trackIndex === 1 ? this.secondaryLengths : this.primaryLengths;
    const totalLen = trackIndex === 1 ? this.secondaryTotalLength : this.primaryTotalLength;

    if (distanceCovered >= totalLen) {
      const endPoint = points[points.length - 1];
      return { x: endPoint.x, y: endPoint.y, reachedEnd: true };
    }

    let accumulated = 0;
    for (let i = 0; i < lengths.length; i++) {
      const segLen = lengths[i];
      if (accumulated + segLen >= distanceCovered) {
        const segDist = distanceCovered - accumulated;
        const ratio = segLen > 0 ? segDist / segLen : 0;
        const p1 = points[i];
        const p2 = points[i + 1];

        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio,
          reachedEnd: false,
        };
      }
      accumulated += segLen;
    }

    const startPoint = points[0];
    return { x: startPoint.x, y: startPoint.y, reachedEnd: false };
  }
}
