import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DataTable from '@/components/DataTable';

const columns = [
  { key: 'name', header: 'Name', render: (row: { name: string }) => row.name },
  { key: 'value', header: 'Value', render: (row: { value: number }) => row.value },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders rows', () => {
    const data = [{ name: 'Alice', value: 42 }, { name: 'Bob', value: 7 }];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading', () => {
    const { container } = render(<DataTable columns={columns} data={[]} isLoading />);
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });
});
