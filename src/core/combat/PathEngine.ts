export interface Point {
  x: number;
  y: number;
}

export class PathEngine {
  private waypoints: Point[];
  private segmentLengths: number[] = [];
  private totalPathLength: number = 0;

  constructor(waypoints: Point[]) {
    this.waypoints = waypoints;
    this.calculateLengths();
  }

  private calculateLengths(): void {
    this.segmentLengths = [];
    this.totalPathLength = 0;

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.segmentLengths.push(dist);
      this.totalPathLength += dist;
    }
  }

  public getTotalLength(): number {
    return this.totalPathLength;
  }

  public getWaypoints(): Point[] {
    return [...this.waypoints];
  }

  public getPositionAlongPath(distanceCovered: number): {
    x: number;
    y: number;
    reachedEnd: boolean;
  } {
    if (distanceCovered >= this.totalPathLength) {
      const endPoint = this.waypoints[this.waypoints.length - 1];
      return { x: endPoint.x, y: endPoint.y, reachedEnd: true };
    }

    let accumulated = 0;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      const segLen = this.segmentLengths[i];
      if (accumulated + segLen >= distanceCovered) {
        const segDist = distanceCovered - accumulated;
        const ratio = segLen > 0 ? segDist / segLen : 0;
        const p1 = this.waypoints[i];
        const p2 = this.waypoints[i + 1];

        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio,
          reachedEnd: false,
        };
      }
      accumulated += segLen;
    }

    const startPoint = this.waypoints[0];
    return { x: startPoint.x, y: startPoint.y, reachedEnd: false };
  }
}
