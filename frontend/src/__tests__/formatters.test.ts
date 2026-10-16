import { describe, it, expect } from 'vitest';
import {
  formatRiskScore,
  truncateURL,
  getSeverityColor,
  getRiskColor,
  getScoreColor,
  getRiskBgClass,
  getSeverityBgClass,
} from '../utils/formatters';

describe('formatters utility', () => {
  it('formats risk score out of 100 correctly', () => {
    expect(formatRiskScore(0)).toBe('0/100');
    expect(formatRiskScore(50.4)).toBe('50/100');
    expect(formatRiskScore(99.8)).toBe('100/100');
  });

  it('truncates URLs exceeding max length with ellipsis', () => {
    const shortUrl = 'https://example.com';
    expect(truncateURL(shortUrl, 30)).toBe(shortUrl);

    const longUrl = 'https://example.com/very/long/nested/path/to/resource/file.html';
    const truncated = truncateURL(longUrl, 25);
    expect(truncated.length).toBeLessThanOrEqual(25);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('returns valid hex colors for severity levels', () => {
    expect(getSeverityColor('info')).toBe('#3b82f6');
    expect(getSeverityColor('low')).toBe('#22c55e');
    expect(getSeverityColor('medium')).toBe('#eab308');
    expect(getSeverityColor('high')).toBe('#ef4444');
    expect(getSeverityColor('critical')).toBe('#dc2626');
  });

  it('returns valid hex colors for risk levels', () => {
    expect(getRiskColor('low')).toBe('#22c55e');
    expect(getRiskColor('medium')).toBe('#eab308');
    expect(getRiskColor('high')).toBe('#ef4444');
  });

  it('returns appropriate color thresholds for scores', () => {
    expect(getScoreColor(15)).toBe('#22c55e');
    expect(getScoreColor(30)).toBe('#22c55e');
    expect(getScoreColor(45)).toBe('#eab308');
    expect(getScoreColor(60)).toBe('#eab308');
    expect(getScoreColor(75)).toBe('#ef4444');
  });

  it('provides Tailwind classes for badges', () => {
    expect(getRiskBgClass('low')).toContain('green');
    expect(getRiskBgClass('medium')).toContain('yellow');
    expect(getRiskBgClass('high')).toContain('red');
    expect(getSeverityBgClass('critical')).toContain('red');
  });
});
