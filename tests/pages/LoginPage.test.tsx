import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

describe('LoginPage', () => {
  it('links members to public signup', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const signupLink = screen.getByRole('link', { name: 'Create member account' });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
