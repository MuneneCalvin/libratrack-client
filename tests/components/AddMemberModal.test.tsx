import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AddMemberModal from '@/components/modals/AddMemberModal';
import { membersService } from '@/services/members.service';

vi.mock('@/services/members.service', () => ({
  membersService: {
    create: vi.fn(),
  },
}));

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AddMemberModal open onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('AddMemberModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the membership number from the PHP member create response', async () => {
    vi.mocked(membersService.create).mockResolvedValue({
      data: {
        status: 'success',
        data: {
          id: 11,
          email: 'jane@example.com',
          fullName: 'Jane Doe',
          membershipNumber: 'MEM-ABC123',
          joinedAt: new Date().toISOString(),
          isActive: true,
        },
      },
    } as never);

    renderModal();

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Create Member' }));

    await waitFor(() => {
      expect(screen.getByText('MEM-ABC123')).toBeInTheDocument();
    });
  });
});
