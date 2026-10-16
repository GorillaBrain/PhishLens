import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanHistory } from '../hooks/useScanHistory';
import { ScanResponse } from '../types';

describe('useScanHistory hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockResponse: ScanResponse = {
    url: 'https://example.com/test',
    scan_timestamp: new Date().toISOString(),
    heuristic: {
      risk_score: 15,
      risk_level: 'low',
      findings: [],
      url_components: {
        scheme: 'https',
        hostname: 'example.com',
        port: null,
        path: '/test',
        query_present: false,
        fragment_present: false,
      },
      summary: 'Low risk detected',
      disclaimer: 'Heuristic only',
    },
    virustotal: null,
  };

  it('initializes with empty history when localStorage is empty', () => {
    const { result } = renderHook(() => useScanHistory());
    expect(result.current.history).toEqual([]);
  });

  it('adds scan response to history and saves to localStorage', () => {
    const { result } = renderHook(() => useScanHistory());

    act(() => {
      result.current.addScan(mockResponse);
    });

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].url).toBe('https://example.com/test');
    expect(result.current.history[0].risk_score).toBe(15);
    expect(result.current.history[0].risk_level).toBe('low');

    const stored = JSON.parse(localStorage.getItem('phishlens_history') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].url).toBe('https://example.com/test');
  });

  it('removes a specific scan from history', () => {
    const { result } = renderHook(() => useScanHistory());

    act(() => {
      result.current.addScan(mockResponse);
    });

    const id = result.current.history[0].id;

    act(() => {
      result.current.removeScan(id);
    });

    expect(result.current.history.length).toBe(0);
    const stored = JSON.parse(localStorage.getItem('phishlens_history') || '[]');
    expect(stored.length).toBe(0);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useScanHistory());

    act(() => {
      result.current.addScan(mockResponse);
      result.current.addScan({ ...mockResponse, url: 'https://another.com' });
    });

    expect(result.current.history.length).toBe(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history.length).toBe(0);
    const stored = JSON.parse(localStorage.getItem('phishlens_history') || '[]');
    expect(stored.length).toBe(0);
  });
});
