import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RatingPage from '../src/pages/officer/RatingPage';

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

// Mock APIs — must include cycleAPI.getAll used by CycleSelector
vi.mock('../src/services/api', () => ({
  appraisalAPI: {
    getTeam: vi.fn(),
    getEmployee: vi.fn(),
    saveKpaRatings: vi.fn(),
    saveAttributeRatings: vi.fn(),
    reportingDone: vi.fn(),
    reviewingDone: vi.fn(),
    acceptingDone: vi.fn(),
  },
  kpaAPI: {
    getEmployee: vi.fn(),
  },
  attributeAPI: {
    getAll: vi.fn(),
  },
  cycleAPI: {
    getAll: vi.fn(),
  },
}));

describe('Rating Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = async () => {
    const { cycleAPI, attributeAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
    vi.mocked(attributeAPI.getAll).mockResolvedValue({ data: { attributes: [] } });
  };

  it('renders rating page with heading', async () => {
    await setupMocks();
    render(
      <BrowserRouter>
        <RatingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Rate Reportees/i)).toBeInTheDocument();
  });

  it('renders cycle selector dropdown', async () => {
    await setupMocks();
    render(
      <BrowserRouter>
        <RatingPage />
      </BrowserRouter>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('loads appraisals after cycle selection', async () => {
    const { appraisalAPI, cycleAPI, attributeAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
    vi.mocked(attributeAPI.getAll).mockResolvedValue({ data: { attributes: [] } });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({
      data: {
        appraisals: [
          {
            id: '1',
            status: 'SUBMITTED',
            user: { id: '2', name: 'John Doe', department: 'Engineering', employeeCode: 'EMP001', reportingOfficerId: '1' },
            kpaRatings: [],
            attributeRatings: [],
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <RatingPage />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows appraisal list card after cycle selection', async () => {
    const { appraisalAPI, cycleAPI, attributeAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
    vi.mocked(attributeAPI.getAll).mockResolvedValue({ data: { attributes: [] } });
    vi.mocked(appraisalAPI.getTeam).mockResolvedValue({ data: { appraisals: [] } });

    render(
      <BrowserRouter>
        <RatingPage />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      // Card title: "Reportees Appraisals (0)"
      expect(screen.getByText(/Reportees Appraisals/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
