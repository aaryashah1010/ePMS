import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeDashboard from '../src/pages/employee/Dashboard';

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
      department: 'Engineering',
      employeeCode: 'EMP001',
    },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock userAPI
vi.mock('../src/services/api', () => ({
  userAPI: {
    getReportees: vi.fn(),
    getReviewees: vi.fn(),
    getAppraisees: vi.fn(),
  },
}));

describe('Employee Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <EmployeeDashboard />
      </BrowserRouter>
    );
  };

  it('renders dashboard with user welcome message', () => {
    renderDashboard();
    expect(screen.getByText(/Welcome back, John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    expect(screen.getByText(/EMP001/)).toBeInTheDocument();
  });

  it('renders Employee Space card', () => {
    renderDashboard();
    expect(screen.getByText('Employee Space')).toBeInTheDocument();
  });

  it('navigates to employee summary when Employee Space is clicked', () => {
    renderDashboard();
    const employeeCard = screen.getByText('Employee Space').closest('div');
    fireEvent.click(employeeCard);
    expect(mockNavigate).toHaveBeenCalledWith('/employee/summary');
  });

  it('renders all four role space cards', () => {
    renderDashboard();
    expect(screen.getByText('Employee Space')).toBeInTheDocument();
    expect(screen.getByText('Reporting Officer Space')).toBeInTheDocument();
    expect(screen.getByText('Reviewing Officer Space')).toBeInTheDocument();
    expect(screen.getByText('Accepting Officer Space')).toBeInTheDocument();
  });

  it('displays error when no reportees for reporting officer', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getReportees).mockResolvedValue({ data: { reportees: [] } });

    renderDashboard();
    const reportingCard = screen.getByText('Reporting Officer Space').closest('div');
    fireEvent.click(reportingCard);

    await waitFor(() => {
      expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    });
  });
});
