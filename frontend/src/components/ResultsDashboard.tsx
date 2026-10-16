import { ScanResponse } from '../types';
import RiskGauge from './RiskGauge';
import FindingCard from './FindingCard';
import URLBreakdown from './URLBreakdown';
import { formatDate } from '../utils/formatters';
import { ShieldCheck, Clock, ExternalLink, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

interface ResultsDashboardProps {
  result: ScanResponse;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { heuristic, virustotal, scan_timestamp, url } = result;
  const { risk_score, risk_level, findings, url_components, summary, disclaimer } = heuristic;

  return (
    <div className="space-y-6" data-testid="results-dashboard">
      {/* Header bar with timestamp and quick summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#111827] border border-[#1e293b]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <Clock className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>Scanned: {formatDate(scan_timestamp)}</span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono">{new Date(scan_timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-sm text-[#f1f5f9] font-medium leading-relaxed">{summary}</p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20">
            <Shield className="w-3.5 h-3.5" />
            {findings.length} {findings.length === 1 ? 'Indicator' : 'Indicators'}
          </span>
        </div>
      </div>

      {/* Main Top Grid: Risk Gauge & URL Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <RiskGauge score={risk_score} level={risk_level} />
        </div>
        <div className="md:col-span-2">
          <URLBreakdown components={url_components} originalUrl={url} />
        </div>
      </div>

      {/* Threat Intelligence / VirusTotal Integration Card */}
      <div
        className="p-5 rounded-xl bg-[#111827] border border-[#1e293b] space-y-3"
        data-testid="virustotal-card"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#06b6d4]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f1f5f9]">
              External Threat Intelligence
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1e293b] text-[#94a3b8] font-mono">
              VirusTotal API v3
            </span>
          </div>

          {virustotal?.available && virustotal.permalink && (
            <a
              href={virustotal.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#06b6d4] hover:text-[#22d3ee] flex items-center gap-1"
            >
              <span>View full VT report</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {virustotal?.available ? (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-[#0a0e1a] border border-[#1e293b]">
              <div>
                <span className="text-xs text-[#94a3b8]">Detection Engines: </span>
                <span
                  className={`text-sm font-bold font-mono ${
                    (virustotal.positives ?? 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {virustotal.positives ?? 0} / {virustotal.total ?? 0}
                </span>
                <span className="text-xs text-[#64748b] ml-1">engines flagged malicious</span>
              </div>
              {virustotal.scan_date && (
                <div className="text-xs text-[#64748b]">
                  Last indexed: {virustotal.scan_date}
                </div>
              )}
            </div>

            <p className="text-xs text-[#64748b] italic leading-relaxed">
              {virustotal.privacy_notice}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-[#0a0e1a]/80 border border-[#1e293b] text-xs text-[#94a3b8] space-y-1">
            <div className="flex items-center gap-2 text-yellow-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {virustotal?.error
                  ? `External lookup unavailable: ${virustotal.error}`
                  : 'VirusTotal API key not configured on backend'}
              </span>
            </div>
            <p className="text-[#64748b] pl-6 leading-relaxed">
              Local heuristic analysis is fully operational. External threat intelligence requires a
              free API key from VirusTotal. Unconfigured external scans are never interpreted as safe.
            </p>
          </div>
        )}
      </div>

      {/* Heuristic Findings Section */}
      <div className="space-y-4" data-testid="findings-section">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f1f5f9] flex items-center gap-2">
            <span>Security Findings & Heuristic Rules</span>
            <span className="text-xs text-[#94a3b8] font-normal">
              ({findings.length} {findings.length === 1 ? 'rule triggered' : 'rules triggered'})
            </span>
          </h3>
        </div>

        {findings.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1e293b] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
            <h4 className="text-sm font-semibold text-[#f1f5f9]">No Suspicious Indicators Detected</h4>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
              This URL passed all 15 heuristic safety checks. Standard domain formatting, HTTPS
              encryption, and normal path structures were observed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        )}
      </div>

      {/* Educational & Transparency Disclaimer */}
      <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1e293b] text-xs text-[#64748b] leading-relaxed space-y-1">
        <span className="font-semibold text-[#94a3b8] uppercase tracking-wider block text-[11px]">
          Analysis Transparency Notice
        </span>
        <p>{disclaimer}</p>
      </div>
    </div>
  );
}
