import { describe, it, expect } from 'vitest';
import { ContentValidationService } from '../src/core/validation/ContentValidationService';

describe('Milestone 16 — Startup Content Validation Service Tests', () => {
  it('validates all data definitions and returns clean report with zero errors', () => {
    const report = ContentValidationService.validateAllContent();
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });
});
