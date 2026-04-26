import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../src/pages/hr/AdminDashboard';

// Mock useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useAuth
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Admin', role: 'HR' },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock APIs — AdminDashboard uses cycleAPI.getAll, userAPI.getAll, cycleAPI.getActive
vi.mock('../src/services/api', () => ({
  cycleAPI: {
    getAll: vi.fn(),
    getActive: vi.fn(),
  },
  userAPI: {
    getAll: vi.fn(),
  },
}));

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAdminDashboard = () => {
    return render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
  };

  it('renders HR Admin Dashboard heading', async () => {
    const { cycleAPI, userAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });
    vi.mocked(userAPI.getAll).mockResolvedValue({ data: { users: [] } });
    vi.mocked(cycleAPI.getActive).mockResolvedValue({ data: { cycles: [] } });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText(/HR Admin Dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays cycle name when cycles are loaded', async () => {
    const { cycleAPI, userAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', year: 2024, status: 'ACTIVE' }] },
    });
    vi.mocked(userAPI.getAll).mockResolvedValue({ data: { users: [] } });
    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('FY 2024-25')).toBeInTheDocument();
    });
  });

  it('displays user role breakdown', async () => {
    const { cycleAPI, userAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });
    vi.mocked(userAPI.getAll).mockResolvedValue({
      data: {
        users: [
          { id: '1', role: 'EMPLOYEE' },
          { id: '2', role: 'EMPLOYEE' },
          { id: '3', role: 'HR' },
        ],
      },
    });
    vi.mocked(cycleAPI.getActive).mockResolvedValue({ data: { cycles: [] } });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('User Breakdown')).toBeInTheDocument();
    });
  });

  it('shows stat cards for total employees and active cycles', async () => {
    const { cycleAPI, userAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });
    vi.mocked(userAPI.getAll).mockResolvedValue({
      data: { users: [{ id: '1', role: 'EMPLOYEE' }] },
    });
    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getByText('Active Cycles')).toBeInTheDocument();
    });
  });
});
