import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReportChart from '@/components/ReportChart';

describe('ReportChart', () => {
  it('shows a clear empty state when no chart data exists', () => {
    render(<ReportChart type="bar" data={[]} />);

    expect(screen.getByText('No report data yet')).toBeInTheDocument();
  });
});
