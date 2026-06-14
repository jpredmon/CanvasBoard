import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => {
  const GoogleAuthProvider = class {
    constructor() {}
  };
  return {
    GoogleAuthProvider,
    signInWithPopup: vi.fn(),
  };
});

import { signInWithPopup } from 'firebase/auth';

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the app heading', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'CanvasBoard' })).toBeInTheDocument();
  });

  it('renders the sign-in button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('calls signInWithPopup when button is clicked', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue({} as never);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalledWith({}, expect.any(Object));
    });
  });
});
