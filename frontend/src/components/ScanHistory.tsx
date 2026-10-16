import { ScanHistoryItem } from '../types';
import { formatDate, getRiskBgClass, truncateURL } from '../utils/formatters';
import { History, Trash2, ArrowUpRight, ShieldCheck, Clock } from 'lucide-react';

interface ScanHistoryProps {
  history: ScanHistoryItem[];
  onSelectUrl: (url: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
}

export default function ScanHistory({
  history,
  onSelectUrl,
  onRemoveItem,
  onClearHistory,
}: ScanHistoryProps) {
  if (history.length === 0) {
    return (
      <div
        className="p-8 rounded-xl bg-[#111827] border border-[#1e293b] text-center space-y-3"
        data-testid="history-empty"
      >
        <div className="w-12 h-12 rounded-full bg-[#1e293b] text-[#64748b] flex items-center justify-center mx-auto">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#f1f5f9]">No Scan History Yet</h3>
        <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
          URLs analyzed during your session will appear here for reference. All records remain stored
          locally inside your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="scan-history">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#06b6d4]" />
          <h2 className="text-lg font-bold text-[#f1f5f9]">Recent Scans</h2>
          <span className="text-xs text-[#64748b]">({history.length} saved)</span>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
          data-testid="clear-history-button"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-[#111827] border border-[#1e293b] hover:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            data-testid={`history-item-${item.id}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0 ${getRiskBgClass(
                  item.risk_level
                )}`}
              >
                {item.risk_level}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-mono text-[#f1f5f9] truncate" title={item.url}>
                  {truncateURL(item.url, 50)}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#64748b] mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(item.scan_timestamp)}</span>
                  <span>•</span>
                  <span>Score: {item.risk_score}/100</span>
                  <span>•</span>
                  <span>
                    {item.findings_count} {item.findings_count === 1 ? 'indicator' : 'indicators'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onSelectUrl(item.url)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs font-medium text-[#06b6d4] transition-colors"
                title="Re-scan this URL"
              >
                <span>Re-scan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-[#1e293b] transition-colors"
                title="Delete this record"
                aria-label="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
