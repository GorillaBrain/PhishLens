import { FormEvent, useState, useRef, useEffect } from 'react';
import { Shield, X, Search } from 'lucide-react';
import ExampleURLs from './ExampleURLs';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface ScannerProps {
  onScan: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function Scanner({ onScan, isLoading, error }: ScannerProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a URL to analyze.');
      return;
    }
    if (trimmed.length > 2048) {
      setValidationError('URL is too long. Please enter a shorter URL.');
      return;
    }

    await onScan(trimmed);
  };

  const handleClear = () => {
    setUrl('');
    setValidationError(null);
    inputRef.current?.focus();
  };

  const handleExampleSelect = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setValidationError(null);
    inputRef.current?.focus();
  };

  return (
    <section className="space-y-6" aria-label="URL Scanner">
      {/* Hero text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9]">
          Analyze Any URL for Threats
        </h2>
        <p className="text-[#94a3b8] max-w-xl mx-auto">
          Enter a URL below to check for phishing indicators, suspicious patterns, and potential
          security risks using heuristic analysis.
        </p>
      </div>

      {/* Scanner form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="flex items-center gap-2 p-2 rounded-xl border border-[#334155] bg-[#111827] focus-within:border-[#06b6d4] focus-within:ring-1 focus-within:ring-[#06b6d4]/30 transition-all">
            <Search className="w-5 h-5 text-[#64748b] ml-2 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setValidationError(null);
              }}
              placeholder="Enter a URL to analyze..."
              className="flex-1 bg-transparent text-[#f1f5f9] placeholder:text-[#64748b] outline-none text-sm sm:text-base py-2"
              disabled={isLoading}
              aria-label="URL to analyze"
              data-testid="url-input"
            />
            {url && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1e293b] transition-colors"
                aria-label="Clear URL"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-[#06b6d4] hover:bg-[#22d3ee] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e1a] font-semibold text-sm transition-colors shrink-0"
              data-testid="scan-button"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'Scanning...' : 'Scan'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Validation error */}
      {validationError && (
        <div className="max-w-2xl mx-auto">
          <p className="text-red-400 text-sm text-center" role="alert" data-testid="validation-error">
            {validationError}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSpinner />}

      {/* API Error */}
      {error && !isLoading && (
        <div className="max-w-2xl mx-auto">
          <ErrorMessage message={error} onRetry={() => onScan(url.trim())} />
        </div>
      )}

      {/* Example URLs */}
      {!isLoading && (
        <div className="max-w-2xl mx-auto">
          <ExampleURLs onSelect={handleExampleSelect} />
        </div>
      )}
    </section>
  );
}
