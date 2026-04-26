import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoalSetting from '../src/pages/employee/GoalSetting';

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
    user: { id: '1', name: 'John Doe' },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock APIs — must include cycleAPI.getAll used by CycleSelector
vi.mock('../src/services/api', () => ({
  kpaAPI: {
    getMy: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    submit: vi.fn(),
  },
  cycleAPI: {
    getAll: vi.fn(),
    getActive: vi.fn(),
  },
}));

describe('Goal Setting Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGoalSetting = async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'GOAL_SETTING', status: 'ACTIVE' }] },
    });

    return render(
      <BrowserRouter>
        <GoalSetting />
      </BrowserRouter>
    );
  };

  it('renders goal setting page with heading', async () => {
    await renderGoalSetting();
    expect(screen.getByRole('heading', { name: /Goal Setting/i })).toBeInTheDocument();
  });

  it('renders cycle selector dropdown', async () => {
    await renderGoalSetting();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('loads and displays existing goals after cycle selection', async () => {
    const { kpaAPI, cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'GOAL_SETTING', status: 'ACTIVE' }] },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({
      data: {
        kpas: [
          { id: '1', title: 'Existing Goal', weightage: 50, status: 'DRAFT' },
        ],
      },
    });

    render(
      <BrowserRouter>
        <GoalSetting />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Existing Goal')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Add New KPA form after cycle selection', async () => {
    const { kpaAPI, cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'GOAL_SETTING', status: 'ACTIVE' }] },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({ data: { kpas: [] } });

    render(
      <BrowserRouter>
        <GoalSetting />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText(/Add New KPA/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
