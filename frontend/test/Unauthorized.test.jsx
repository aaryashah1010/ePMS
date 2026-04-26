import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Unauthorized from '../src/pages/Unauthorized';

// Mock useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useAuth so Unauthorized doesn't need a real AuthProvider
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'John', role: 'EMPLOYEE' },
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

describe('Unauthorized Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderUnauthorized = () => {
    return render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );
  };

  it('renders Access Denied heading', () => {
    renderUnauthorized();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('displays helpful permission message', () => {
    renderUnauthorized();
    expect(screen.getByText(/permission to view this page/i)).toBeInTheDocument();
  });

  it('provides a navigation button back to dashboard', () => {
    renderUnauthorized();
    const backButton = screen.getByText(/Go to Dashboard/i);
    expect(backButton).toBeInTheDocument();
  });
});
