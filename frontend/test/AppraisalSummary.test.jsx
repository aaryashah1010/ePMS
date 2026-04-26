import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppraisalSummary from '../src/pages/employee/AppraisalSummary';

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
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'EMPLOYEE',
    },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock APIs
vi.mock('../src/services/api', () => ({
  cycleAPI: {
    getActive: vi.fn(),
  },
  kpaAPI: {
    getMy: vi.fn(),
  },
  midYearAPI: {
    getMy: vi.fn(),
  },
  appraisalAPI: {
    getMy: vi.fn(),
  },
}));

describe('Appraisal Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSummary = () => {
    return render(
      <BrowserRouter>
        <AppraisalSummary />
      </BrowserRouter>
    );
  };

  it('renders My Appraisal Space heading', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getActive).mockResolvedValue({ data: { cycles: [] } });

    renderSummary();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Appraisal Space/i })).toBeInTheDocument();
    });
  });

  it('shows no active cycle message when no cycles exist', async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getActive).mockResolvedValue({ data: { cycles: [] } });

    renderSummary();

    await waitFor(() => {
      expect(screen.getByText(/No active appraisal cycle found/i)).toBeInTheDocument();
    });
  });

  it('displays cycle name when active cycle is loaded', async () => {
    const { cycleAPI, kpaAPI, midYearAPI, appraisalAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: {
        cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }],
      },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({ data: { kpas: [] } });
    vi.mocked(midYearAPI.getMy).mockResolvedValue({ data: { review: null } });
    vi.mocked(appraisalAPI.getMy).mockResolvedValue({ data: { appraisal: null } });

    renderSummary();

    await waitFor(() => {
      expect(screen.getByText('FY 2024-25')).toBeInTheDocument();
    });
  });

  it('shows Goal Setting, Mid-Year Review, and Annual Appraisal cards', async () => {
    const { cycleAPI, kpaAPI, midYearAPI, appraisalAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: {
        cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }],
      },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({ data: { kpas: [] } });
    vi.mocked(midYearAPI.getMy).mockResolvedValue({ data: { review: null } });
    vi.mocked(appraisalAPI.getMy).mockResolvedValue({ data: { appraisal: null } });

    renderSummary();

    await waitFor(() => {
      // Use getAllByText since these labels also appear in the navbar
      expect(screen.getAllByText('Goal Setting').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mid-Year Review').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Annual Appraisal').length).toBeGreaterThanOrEqual(1);
    });
  });
});
