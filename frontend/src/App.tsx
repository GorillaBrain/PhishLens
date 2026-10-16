import { useState } from 'react';
import Header from './components/Header';
import Scanner from './components/Scanner';
import ResultsDashboard from './components/ResultsDashboard';
import ScanHistory from './components/ScanHistory';
import EducationalSection from './components/EducationalSection';
import Footer from './components/Footer';
import { useScanner } from './hooks/useScanner';
import { useScanHistory } from './hooks/useScanHistory';

export default function App() {
  const [activeView, setActiveView] = useState<'scanner' | 'history' | 'learn'>('scanner');
  const { scan, result, error, isLoading } = useScanner();
  const { history, addScan, removeScan, clearHistory } = useScanHistory();

  const handleScan = async (url: string) => {
    setActiveView('scanner');
    const response = await scan(url);
    if (response) {
      addScan(response);
    }
  };

  const handleSelectHistoryUrl = (url: string) => {
    setActiveView('scanner');
    handleScan(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a] text-[#f1f5f9] selection:bg-[#06b6d4]/20 selection:text-[#06b6d4]">
      {/* Top sticky navigation bar */}
      <Header activeView={activeView} onNavigate={(view) => setActiveView(view as any)} />

      {/* Main container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {activeView === 'scanner' && (
          <div className="space-y-10">
            <Scanner onScan={handleScan} isLoading={isLoading} error={error} />

            {/* Results display */}
            {result && !isLoading && <ResultsDashboard result={result} />}

            {/* If no result yet, show recent scans preview or educational summary */}
            {!result && !isLoading && history.length > 0 && (
              <div className="pt-6 border-t border-[#1e293b]">
                <ScanHistory
                  history={history.slice(0, 5)}
                  onSelectUrl={handleSelectHistoryUrl}
                  onRemoveItem={removeScan}
                  onClearHistory={clearHistory}
                />
              </div>
            )}
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-6">
            <ScanHistory
              history={history}
              onSelectUrl={handleSelectHistoryUrl}
              onRemoveItem={removeScan}
              onClearHistory={clearHistory}
            />
          </div>
        )}

        {activeView === 'learn' && (
          <div className="space-y-6">
            <EducationalSection />
          </div>
        )}
      </main>

      {/* Global disclaimer and author footer */}
      <Footer />
    </div>
  );
}
