import { URLComponents } from '../types';
import { Globe, Hash, Layers, Lock, Unlock, Server } from 'lucide-react';

interface URLBreakdownProps {
  components: URLComponents;
  originalUrl: string;
}

export default function URLBreakdown({ components, originalUrl }: URLBreakdownProps) {
  const isSecure = components.scheme.toLowerCase() === 'https';

  const rows = [
    {
      label: 'Scheme',
      value: components.scheme,
      icon: isSecure ? (
        <Lock className="w-4 h-4 text-green-400" />
      ) : (
        <Unlock className="w-4 h-4 text-yellow-400" />
      ),
      highlight: !isSecure,
    },
    {
      label: 'Hostname',
      value: components.hostname || '(None)',
      icon: <Globe className="w-4 h-4 text-[#06b6d4]" />,
      highlight: false,
    },
    {
      label: 'Port',
      value: components.port ? String(components.port) : 'Default (implied)',
      icon: <Server className="w-4 h-4 text-[#94a3b8]" />,
      highlight: !!components.port && components.port !== '80' && components.port !== '443',
    },
    {
      label: 'Path',
      value: components.path || '/',
      icon: <Layers className="w-4 h-4 text-[#94a3b8]" />,
      highlight: false,
    },
    {
      label: 'Query Parameters',
      value: components.query_present ? 'Present' : 'None',
      icon: <Hash className="w-4 h-4 text-[#94a3b8]" />,
      highlight: false,
    },
    {
      label: 'Fragment / Hash',
      value: components.fragment_present ? 'Present' : 'None',
      icon: <Hash className="w-4 h-4 text-[#94a3b8]" />,
      highlight: false,
    },
  ];

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293b] space-y-4" data-testid="url-breakdown">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#94a3b8]">
          URL Structural Breakdown
        </h3>
        <span className="text-xs text-[#64748b]">Client-side Safe Inspection</span>
      </div>

      <div className="p-2.5 rounded-lg bg-[#0a0e1a] border border-[#1e293b] overflow-x-auto">
        <code className="text-xs text-[#06b6d4] font-mono break-all">{originalUrl}</code>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
              row.highlight
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                : 'bg-[#0a0e1a]/60 border-[#1e293b] text-[#f1f5f9]'
            }`}
          >
            <div className="flex items-center gap-2">
              {row.icon}
              <span className="text-xs font-medium text-[#94a3b8]">{row.label}</span>
            </div>
            <span className="text-xs font-mono font-semibold max-w-[160px] truncate text-right">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
