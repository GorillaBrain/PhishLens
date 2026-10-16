import { Shield, ScanSearch, History, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function Header({ activeView, onNavigate }: HeaderProps) {
  const navItems = [
    { id: 'scanner', label: 'Scanner', icon: ScanSearch },
    { id: 'history', label: 'History', icon: History },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <header className="border-b border-[#1e293b] bg-[#111827]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20">
              <Shield className="w-6 h-6 text-[#06b6d4]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f1f5f9] leading-tight">PhishLens</h1>
              <p className="text-xs text-[#64748b] leading-tight">URL Security Analyzer</p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === id
                    ? 'bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20'
                    : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e293b]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
