import { useState, useCallback } from 'react';
import { ScanResponse } from '../types';
import { scanURL } from '../api/client';

type ScanState = 'idle' | 'loading' | 'success' | 'error';

export function useScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (url: string) => {
    setState('loading');
    setError(null);
    setResult(null);

    try {
      const response = await scanURL(url);
      setResult(response);
      setState('success');
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setState('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    scan,
    result,
    error,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    state,
    reset,
  };
}
