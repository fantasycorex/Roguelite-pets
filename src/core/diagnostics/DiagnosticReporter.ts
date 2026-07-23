import { SaveManager } from '../save/SaveManager';

export interface DiagnosticPayload {
  timestamp: string;
  appVersion: string;
  userAgent: string;
  screenResolution: string;
  saveData: unknown;
  recentLogs: string[];
}

export class DiagnosticReporter {
  private static logs: string[] = [];

  public static log(message: string): void {
    const time = new Date().toISOString();
    const entry = `[${time}] ${message}`;
    this.logs.push(entry);
    if (this.logs.length > 50) this.logs.shift();
  }

  public static generateReport(version: string = '0.3.0-beta.1'): DiagnosticPayload {
    return {
      timestamp: new Date().toISOString(),
      appVersion: version,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Headless Environment',
      screenResolution:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '1280x720',
      saveData: SaveManager.loadGame(),
      recentLogs: [...this.logs],
    };
  }

  public static downloadReportJSON(version: string = '0.3.0-beta.1'): string {
    const report = this.generateReport(version);
    return JSON.stringify(report, null, 2);
  }
}
