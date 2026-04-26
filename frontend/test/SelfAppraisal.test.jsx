import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SelfAppraisal from '../src/pages/employee/SelfAppraisal';

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
  appraisalAPI: {
    getMy: vi.fn(),
    updateSelf: vi.fn(),
    submit: vi.fn(),
    saveKpaRatings: vi.fn(),
    saveAttributeRatings: vi.fn(),
  },
  kpaAPI: {
    getMy: vi.fn(),
  },
  attributeAPI: {
    getAll: vi.fn(),
  },
  cycleAPI: {
    getAll: vi.fn(),
  },
}));

describe('Self Appraisal Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = async () => {
    const { cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
  };

  it('renders self appraisal page with heading', async () => {
    await setupMocks();
    render(
      <BrowserRouter>
        <SelfAppraisal />
      </BrowserRouter>
    );
    expect(screen.getByText(/Annual Self-Appraisal/i)).toBeInTheDocument();
  });

  it('renders cycle selector dropdown', async () => {
    await setupMocks();
    render(
      <BrowserRouter>
        <SelfAppraisal />
      </BrowserRouter>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('loads KPAs and attributes after cycle selection', async () => {
    const { kpaAPI, attributeAPI, appraisalAPI, cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({
      data: { kpas: [{ id: '1', title: 'Test KPA', weightage: 50 }] },
    });
    vi.mocked(attributeAPI.getAll).mockResolvedValue({
      data: { attributes: [] },
    });
    vi.mocked(appraisalAPI.getMy).mockResolvedValue({
      data: { appraisal: { id: '1', achievements: '', status: 'DRAFT', kpaRatings: [], attributeRatings: [] } },
    });

    render(
      <BrowserRouter>
        <SelfAppraisal />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Test KPA')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Save Draft and Submit buttons after cycle selection', async () => {
    const { kpaAPI, attributeAPI, appraisalAPI, cycleAPI } = await import('../src/services/api');
    vi.mocked(cycleAPI.getAll).mockResolvedValue({
      data: { cycles: [{ id: '1', name: 'FY 2024-25', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' }] },
    });
    vi.mocked(kpaAPI.getMy).mockResolvedValue({ data: { kpas: [] } });
    vi.mocked(attributeAPI.getAll).mockResolvedValue({ data: { attributes: [] } });
    vi.mocked(appraisalAPI.getMy).mockResolvedValue({
      data: { appraisal: { id: '1', achievements: '', status: 'DRAFT', kpaRatings: [], attributeRatings: [] } },
    });

    render(
      <BrowserRouter>
        <SelfAppraisal />
      </BrowserRouter>
    );

    // Wait for cycle options to load, then select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText(/Save Draft/i)).toBeInTheDocument();
      expect(screen.getByText(/Submit for Review/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
