import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

vi.mock('../src/services/api', () => ({
  authAPI: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

import { authAPI } from '../src/services/api';

function Probe() {
  const { user, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  it('starts with no token: loading flips to false and user is null', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('loads the user from /me when a token exists in localStorage', async () => {
    localStorage.getItem.mockImplementation((key) => (key === 'epms_token' ? 'tok' : null));
    authAPI.me.mockResolvedValue({ data: { user: { email: 'me@example.com', role: 'HR' } } });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@example.com'));
    expect(authAPI.me).toHaveBeenCalled();
  });

  it('clears storage when /me fails', async () => {
    localStorage.getItem.mockImplementation((key) => (key === 'epms_token' ? 'tok' : null));
    authAPI.me.mockRejectedValue(new Error('401'));

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(localStorage.removeItem).toHaveBeenCalledWith('epms_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('epms_user');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('login persists token + user to localStorage and updates state', async () => {
    authAPI.login.mockResolvedValue({
      data: { token: 'jwt-1', user: { email: 'alice@example.com', role: 'EMPLOYEE' } },
    });

    let captured;
    function LoginProbe() {
      captured = useAuth();
      return null;
    }

    render(<AuthProvider><LoginProbe /></AuthProvider>);
    await waitFor(() => expect(captured.loading).toBe(false));

    await act(async () => {
      await captured.login('alice@example.com', 'pw');
    });

    expect(authAPI.login).toHaveBeenCalledWith('alice@example.com', 'pw');
    expect(localStorage.setItem).toHaveBeenCalledWith('epms_token', 'jwt-1');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'epms_user',
      JSON.stringify({ email: 'alice@example.com', role: 'EMPLOYEE' }),
    );
  });

  it('logout removes both keys and clears the user', async () => {
    let captured;
    function LogoutProbe() {
      captured = useAuth();
      return null;
    }

    render(<AuthProvider><LogoutProbe /></AuthProvider>);
    await waitFor(() => expect(captured.loading).toBe(false));

    act(() => {
      captured.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('epms_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('epms_user');
    expect(captured.user).toBe(null);
  });

  it('useAuth throws when used outside the provider', () => {
    function StandaloneProbe() {
      useAuth();
      return null;
    }
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<StandaloneProbe />)).toThrow(/AuthProvider/);
    errSpy.mockRestore();
  });
});
