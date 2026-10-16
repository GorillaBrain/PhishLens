import { useState, useEffect, useCallback } from 'react';
import { ScanHistoryItem, ScanResponse } from '../types';

const STORAGE_KEY = 'phishlens_history';
const MAX_ITEMS = 50;

function loadHistory(): ScanHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(items: ScanHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be full or unavailable
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addScan = useCallback((response: ScanResponse) => {
    const item: ScanHistoryItem = {
      id: generateId(),
      url: response.url,
      scan_timestamp: response.scan_timestamp,
      risk_score: response.heuristic.risk_score,
      risk_level: response.heuristic.risk_level,
      findings_count: response.heuristic.findings.length,
    };

    setHistory((prev) => {
      const updated = [item, ...prev];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const removeScan = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addScan,
    removeScan,
    clearHistory,
  };
}
