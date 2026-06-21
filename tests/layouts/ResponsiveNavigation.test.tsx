import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import PortalLayout from '@/layouts/PortalLayout';
import { useAuthStore } from '@/store/auth.store';

function renderDashboardLayout() {
  const queryClient = new QueryClient();
  useAuthStore.getState().setAuth(
    { id: 1, email: 'librarian@test.com', role: 'librarian' },
    'token',
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<div>Dashboard content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderPortalLayout() {
  const queryClient = new QueryClient();
  useAuthStore.getState().setAuth(
    { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
    'token',
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/portal/dashboard']}>
        <Routes>
          <Route path="/portal" element={<PortalLayout />}>
            <Route path="dashboard" element={<div>Portal content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('responsive navigation layouts', () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('exposes a mobile staff navigation drawer trigger', () => {
    renderDashboardLayout();

    expect(screen.getByRole('button', { name: 'Open staff navigation' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('exposes a mobile member navigation drawer trigger', () => {
    renderPortalLayout();

    expect(screen.getByRole('button', { name: 'Open member navigation' })).toBeInTheDocument();
    expect(screen.getByText('Portal content')).toBeInTheDocument();
  });
});
