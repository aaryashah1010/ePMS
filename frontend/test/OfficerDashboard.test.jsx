import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OfficerDashboard from '../src/pages/officer/Dashboard';

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ roleType: 'reporting' }),
  };
});

// Mock useAuth
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Officer', role: 'REPORTING_OFFICER' },
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
  appraisalAPI: {
    getTeam: vi.fn(),
  },
  userAPI: {
    getReportees: vi.fn(),
    getReviewees: vi.fn(),
    getAppraisees: vi.fn(),
  },
}));

describe('Officer Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderOfficerDashboard = () => {
    return render(
      <BrowserRouter>
        <OfficerDashboard />
      </BrowserRouter>
    );
  };

  it('renders Reporting Officer Dashboard heading', async () => {
    const { cycleAPI, userAPI, appraisalAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });
    vi.mocked(userAPI.getReportees).mockResolvedValue({ data: { reportees: [] } });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({ data: { appraisals: [] } });

    renderOfficerDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Reporting Officer Dashboard/i })).toBeInTheDocument();
    });
  });

  it('loads reportees for reporting officer', async () => {
    const { cycleAPI, userAPI, appraisalAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });
    vi.mocked(userAPI.getReportees).mockResolvedValue({
      data: {
        reportees: [
          { id: '2', name: 'Employee 1', email: 'emp1@example.com' },
          { id: '3', name: 'Employee 2', email: 'emp2@example.com' },
        ],
      },
    });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({ data: { appraisals: [] } });

    renderOfficerDashboard();

    await waitFor(() => {
      expect(userAPI.getReportees).toHaveBeenCalled();
    });
  });

  it('displays stat cards on the dashboard', async () => {
    const { cycleAPI, userAPI, appraisalAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });
    vi.mocked(userAPI.getReportees).mockResolvedValue({ data: { reportees: [] } });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({ data: { appraisals: [] } });

    renderOfficerDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Total Reportees/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Appraisals/i)).toBeInTheDocument();
    });
  });

  it('displays active cycle name', async () => {
    const { cycleAPI, userAPI, appraisalAPI } = await import('../src/services/api');

    vi.mocked(cycleAPI.getActive).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25' }] },
    });
    vi.mocked(userAPI.getReportees).mockResolvedValue({ data: { reportees: [] } });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({ data: { appraisals: [] } });

    renderOfficerDashboard();

    await waitFor(() => {
      expect(screen.getByText('FY 2024-25')).toBeInTheDocument();
    });
  });
});
