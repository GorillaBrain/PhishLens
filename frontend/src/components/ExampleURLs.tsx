import { Globe, Link2, AlertTriangle, AtSign, ExternalLink } from 'lucide-react';

interface ExampleURLsProps {
  onSelect: (url: string) => void;
}

const examples = [
  {
    url: 'https://www.google.com',
    label: 'Safe Site',
    icon: Globe,
    color: 'text-green-400 border-green-500/20 hover:bg-green-500/10',
  },
  {
    url: 'http://192.168.1.1/login',
    label: 'IP-based',
    icon: Link2,
    color: 'text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10',
  },
  {
    url: 'http://google.login.evil-site.tk/verify',
    label: 'Suspicious',
    icon: AlertTriangle,
    color: 'text-red-400 border-red-500/20 hover:bg-red-500/10',
  },
  {
    url: 'https://bit.ly/abc123',
    label: 'Shortener',
    icon: ExternalLink,
    color: 'text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10',
  },
  {
    url: 'http://example.com@malicious.com',
    label: '@ Symbol',
    icon: AtSign,
    color: 'text-red-400 border-red-500/20 hover:bg-red-500/10',
  },
];

export default function ExampleURLs({ onSelect }: ExampleURLsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium">
        Try an example
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map(({ url, label, icon: Icon, color }) => (
          <button
            key={url}
            onClick={() => onSelect(url)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-transparent transition-colors ${color}`}
            title={url}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
