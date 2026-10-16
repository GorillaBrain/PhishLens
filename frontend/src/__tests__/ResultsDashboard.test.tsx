import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsDashboard from '../components/ResultsDashboard';
import { ScanResponse } from '../types';

describe('ResultsDashboard component', () => {
  const mockResult: ScanResponse = {
    url: 'http://192.168.1.1/login',
    scan_timestamp: '2026-10-17T03:00:00Z',
    heuristic: {
      risk_score: 50,
      risk_level: 'medium',
      findings: [
        {
          id: 'ip_address',
          title: 'IP Address Used Instead of Domain',
          description: 'The URL uses a raw IP address instead of a domain name.',
          severity: 'high',
          score_impact: 25,
        },
        {
          id: 'scheme_check',
          title: 'Unencrypted HTTP Connection',
          description: 'The URL uses unencrypted HTTP rather than HTTPS.',
          severity: 'medium',
          score_impact: 15,
        },
        {
          id: 'suspicious_path',
          title: 'Sensitive Path Keywords Detected',
          description: 'Path contains credential or verification keywords.',
          severity: 'medium',
          score_impact: 10,
        },
      ],
      url_components: {
        scheme: 'http',
        hostname: '192.168.1.1',
        port: null,
        path: '/login',
        query_present: false,
        fragment_present: false,
      },
      summary: 'Medium risk: Several risk indicators detected.',
      disclaimer: 'This analysis uses heuristic rules and cannot definitively prove a URL is safe or malicious.',
    },
    virustotal: {
      available: false,
      positives: null,
      total: null,
      scan_date: null,
      permalink: null,
      error: null,
      privacy_notice: 'Privacy notice text',
    },
  };

  it('renders risk score, risk level, and summary', () => {
    render(<ResultsDashboard result={mockResult} />);

    expect(screen.getByTestId('score-value')).toHaveTextContent('50');
    expect(screen.getByTestId('risk-level-badge')).toHaveTextContent('SUSPICIOUS');
    expect(screen.getByText(/Medium risk: Several risk indicators detected/i)).toBeInTheDocument();
  });

  it('renders individual findings with titles and descriptions', () => {
    render(<ResultsDashboard result={mockResult} />);

    expect(screen.getByText('IP Address Used Instead of Domain')).toBeInTheDocument();
    expect(screen.getByText('Unencrypted HTTP Connection')).toBeInTheDocument();
    expect(screen.getByText('Sensitive Path Keywords Detected')).toBeInTheDocument();
  });

  it('renders URL breakdown information', () => {
    render(<ResultsDashboard result={mockResult} />);

    expect(screen.getByTestId('url-breakdown')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('/login')).toBeInTheDocument();
  });

  it('displays transparency disclaimer', () => {
    render(<ResultsDashboard result={mockResult} />);

    expect(
      screen.getByText(/This analysis uses heuristic rules and cannot definitively prove/i)
    ).toBeInTheDocument();
  });

  it('shows VirusTotal status indicator when not configured', () => {
    render(<ResultsDashboard result={mockResult} />);

    expect(screen.getByTestId('virustotal-card')).toBeInTheDocument();
    expect(screen.getByText(/VirusTotal API key not configured on backend/i)).toBeInTheDocument();
  });
});
