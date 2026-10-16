import { ScanResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function scanURL(url: string): Promise<ScanResponse> {
  const response = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An unexpected error occurred' }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function getConfig(): Promise<{ virustotal_available: boolean }> {
  const response = await fetch(`${API_BASE}/api/config`);
  if (!response.ok) throw new Error('Failed to fetch configuration');
  return response.json();
}

export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Backend is not available');
  return response.json();
}
