import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('allows action-specific eyebrow copy', () => {
    render(
      <ConfirmDialog
        open
        title="Issue reserved book?"
        description="This creates an active borrow for the member."
        confirmLabel="Issue book"
        eyebrow="Issue book"
        contentClassName="min-h-[30rem]"
        tone="success"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Issue book')).toHaveLength(2);
    expect(screen.queryByText('Restore access')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('min-h-[30rem]');
  });
});
