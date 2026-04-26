import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute';

// Mock useAuth directly so we control loading/user state precisely
vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'John', role: 'EMPLOYEE' },
    loading: false,
  })),
  AuthProvider: ({ children }) => children,
}));

describe('ProtectedRoute Component', () => {
  const TestComponent = () => <div>Protected Content</div>;

  it('renders component when user is authenticated', async () => {
    const { useAuth } = await import('../src/context/AuthContext');
    useAuth.mockReturnValue({ user: { id: '1', name: 'John', role: 'EMPLOYEE' }, loading: false });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders with matching required role', async () => {
    const { useAuth } = await import('../src/context/AuthContext');
    useAuth.mockReturnValue({ user: { id: '1', name: 'John', role: 'EMPLOYEE' }, loading: false });

    render(
      <BrowserRouter>
        <ProtectedRoute roles={['EMPLOYEE']}>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state while authenticating', async () => {
    const { useAuth } = await import('../src/context/AuthContext');
    useAuth.mockReturnValue({ user: null, loading: true });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    const { useAuth } = await import('../src/context/AuthContext');
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );
    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
