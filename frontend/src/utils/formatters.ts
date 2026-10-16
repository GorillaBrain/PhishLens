import { Severity, RiskLevel } from '../types';

export function formatRiskScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function truncateURL(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength - 3);
  return `${start}...`;
}

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    info: '#3b82f6',
    low: '#22c55e',
    medium: '#eab308',
    high: '#ef4444',
    critical: '#dc2626',
  };
  return colors[severity];
}

export function getSeverityBgClass(severity: Severity): string {
  const classes: Record<Severity, string> = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-600/20 text-red-500 border-red-600/30',
  };
  return classes[severity];
}

export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#ef4444',
  };
  return colors[level];
}

export function getRiskBgClass(level: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };
  return classes[level];
}

export function getScoreColor(score: number): string {
  if (score <= 30) return '#22c55e';
  if (score <= 60) return '#eab308';
  return '#ef4444';
}
