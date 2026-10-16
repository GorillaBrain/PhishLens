export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  score_impact: number;
}

export interface URLComponents {
  scheme: string;
  hostname: string;
  port: string | null;
  path: string;
  query_present: boolean;
  fragment_present: boolean;
}

export interface HeuristicResult {
  risk_score: number;
  risk_level: RiskLevel;
  findings: Finding[];
  url_components: URLComponents;
  summary: string;
  disclaimer: string;
}

export interface VirusTotalResult {
  available: boolean;
  positives: number | null;
  total: number | null;
  scan_date: string | null;
  permalink: string | null;
  error: string | null;
  privacy_notice: string;
}

export interface ScanResponse {
  url: string;
  scan_timestamp: string;
  heuristic: HeuristicResult;
  virustotal: VirusTotalResult | null;
}

export interface ScanHistoryItem {
  id: string;
  url: string;
  scan_timestamp: string;
  risk_score: number;
  risk_level: RiskLevel;
  findings_count: number;
}
