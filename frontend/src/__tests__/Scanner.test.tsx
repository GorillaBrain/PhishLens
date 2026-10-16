import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Scanner from '../components/Scanner';

describe('Scanner component', () => {
  it('renders the scanner input and scan button', () => {
    render(<Scanner onScan={vi.fn()} isLoading={false} error={null} />);

    expect(screen.getByPlaceholderText(/Enter a URL to analyze/i)).toBeInTheDocument();
    expect(screen.getByTestId('scan-button')).toBeInTheDocument();
  });

  it('shows error if submitted with empty URL', async () => {
    const user = userEvent.setup();
    const handleScan = vi.fn();
    render(<Scanner onScan={handleScan} isLoading={false} error={null} />);

    const scanButton = screen.getByTestId('scan-button');
    await user.click(scanButton);

    expect(screen.getByText(/Please enter a URL to analyze/i)).toBeInTheDocument();
    expect(handleScan).not.toHaveBeenCalled();
  });

  it('submits trimmed URL when valid URL is entered', async () => {
    const user = userEvent.setup();
    const handleScan = vi.fn();
    render(<Scanner onScan={handleScan} isLoading={false} error={null} />);

    const input = screen.getByTestId('url-input');
    await user.type(input, 'https://example.com/test');
    await user.click(screen.getByTestId('scan-button'));

    expect(handleScan).toHaveBeenCalledWith('https://example.com/test');
  });

  it('displays loading state when isLoading is true', () => {
    render(<Scanner onScan={vi.fn()} isLoading={true} error={null} />);

    expect(screen.getByText(/Scanning.../i)).toBeInTheDocument();
    expect(screen.getByTestId('scan-button')).toBeDisabled();
    expect(screen.getByTestId('url-input')).toBeDisabled();
  });

  it('displays error message when error prop is provided', () => {
    render(<Scanner onScan={vi.fn()} isLoading={false} error="Failed to connect to backend" />);

    expect(screen.getByText(/Failed to connect to backend/i)).toBeInTheDocument();
  });
});
