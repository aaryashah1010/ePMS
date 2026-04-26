import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CycleManagement from '../src/pages/hr/CycleManagement';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'HR Admin', role: 'HR' },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock APIs
vi.mock('../src/services/api', () => ({
  cycleAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    advancePhase: vi.fn(),
    close: vi.fn(),
    getPendingWork: vi.fn(),
  },
}));

describe('Cycle Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCycleManagement = () => {
    return render(
      <BrowserRouter>
        <CycleManagement />
      </BrowserRouter>
    );
  };

  it('renders cycle management page heading', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });

    renderCycleManagement();

    await waitFor(() => {
      expect(screen.getByText(/Cycle Management/i)).toBeInTheDocument();
    });
  });

  it('loads and displays existing cycles', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: {
        cycles: [
          { id: '1', name: 'FY 2024-25', year: 2024, phase: 'GOAL_SETTING', status: 'ACTIVE' },
        ],
      },
    });

    renderCycleManagement();

    await waitFor(() => {
      expect(screen.getByText('FY 2024-25')).toBeInTheDocument();
    });
  });

  it('shows New Cycle button', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });

    renderCycleManagement();

    await waitFor(() => {
      expect(screen.getByText(/\+ New Cycle/i)).toBeInTheDocument();
    });
  });

  it('opens create form when New Cycle is clicked', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({ data: { cycles: [] } });

    renderCycleManagement();

    await waitFor(() => {
      const createButton = screen.getByText(/\+ New Cycle/i);
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Create New Appraisal Cycle/i)).toBeInTheDocument();
    });
  });
});
