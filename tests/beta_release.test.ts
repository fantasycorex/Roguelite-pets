import { describe, it, expect, beforeEach } from 'vitest';
import { HeadlessRunSimulator } from '../src/core/simulation/HeadlessRunSimulator';
import { DiagnosticReporter } from '../src/core/diagnostics/DiagnosticReporter';
import { ShopService } from '../src/core/services/ShopService';
import { InventoryService } from '../src/core/services/InventoryService';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Milestones 21 & 22 — Balance, Performance, Accessibility & Closed Beta Release', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('Milestone 21: HeadlessRunSimulator executes batch runs and returns clean balance report', () => {
    const report = HeadlessRunSimulator.runBatchSimulation(6);
    expect(report.totalRuns).toBe(6);
    expect(report.winRatePercentage).toBeGreaterThanOrEqual(0);
    expect(report.averageCoins).toBeGreaterThan(0);
    expect(report.speciesWinRates.guardian_blob).toBeDefined();
  });

  it('Milestone 21: Economy model validates food costs, item selling refunds, and income bounds', () => {
    const buyResult = ShopService.buyFood('basic_kibble', 50, {});
    expect(buyResult.success).toBe(true);
    expect(buyResult.totalCoins).toBe(40);

    const sellRefund = InventoryService.sellItem(['ruby_pendant'], 'ruby_pendant');
    expect(sellRefund).toBe(35); // 50% of 70g value
  });

  it('Milestone 22: DiagnosticReporter records system events and outputs diagnostic JSON', () => {
    DiagnosticReporter.log('Booting Closed Beta 0.3.0-beta.1');
    DiagnosticReporter.log('Player opened HabitatScene');

    const payload = DiagnosticReporter.generateReport('0.3.0-beta.1');
    expect(payload.appVersion).toBe('0.3.0-beta.1');
    expect(payload.recentLogs.length).toBeGreaterThanOrEqual(2);

    const json = DiagnosticReporter.downloadReportJSON('0.3.0-beta.1');
    expect(json).toContain('0.3.0-beta.1');
  });
});
