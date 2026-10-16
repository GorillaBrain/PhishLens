import { Finding } from '../types';
import { getSeverityColor, getSeverityBgClass } from '../utils/formatters';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const color = getSeverityColor(finding.severity);

  const getSeverityIcon = () => {
    switch (finding.severity) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />;
      case 'low':
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div
      className="p-4 rounded-xl bg-[#111827] border border-[#1e293b] hover:border-[#334155] transition-all relative overflow-hidden"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
      data-testid={`finding-card-${finding.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getSeverityIcon()}</div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-[#f1f5f9]">{finding.title}</h4>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getSeverityBgClass(
                  finding.severity
                )}`}
              >
                {finding.severity}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{finding.description}</p>
          </div>
        </div>

        {/* Score impact */}
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center px-2 py-1 rounded bg-[#1e293b] text-xs font-mono font-medium text-[#f1f5f9]">
            +{finding.score_impact} pts
          </span>
        </div>
      </div>
    </div>
  );
}
