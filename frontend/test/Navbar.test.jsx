import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../src/context/AuthContext';

function renderAt(path, user, logout = vi.fn()) {
  useAuth.mockReturnValue({ user, logout });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HR links for an HR user', () => {
    renderAt('/hr/dashboard', { name: 'Hr Admin', email: 'hr@e.com', role: 'HR' });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cycles')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Attributes')).toBeInTheDocument();
  });

  it('renders MD links for the Managing Director', () => {
    renderAt('/ceo/dashboard', { name: 'CEO', email: 'ceo@e.com', role: 'MANAGING_DIRECTOR' });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage HRs')).toBeInTheDocument();
  });

  it('renders the employee navigation when on the employee space', () => {
    renderAt('/employee/goals', { name: 'Alice', email: 'a@e.com', role: 'EMPLOYEE' });
    expect(screen.getByText('My Appraisal Space')).toBeInTheDocument();
    expect(screen.getByText('Goal Setting')).toBeInTheDocument();
    expect(screen.getByText('Mid-Year')).toBeInTheDocument();
    expect(screen.getByText('Annual Appraisal')).toBeInTheDocument();
  });

  it('renders contextual officer links when path starts with /officer/reporting', () => {
    renderAt('/officer/reporting/dashboard', { name: 'Bob', email: 'b@e.com', role: 'EMPLOYEE' });
    expect(screen.getByText('Reportees Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rate Reportees')).toBeInTheDocument();
  });

  it('shows reviewing-officer wording on /officer/reviewing/*', () => {
    renderAt('/officer/reviewing/ratings', { name: 'Bob', email: 'b@e.com', role: 'EMPLOYEE' });
    expect(screen.getByText('Reviewees Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rate Reviewees')).toBeInTheDocument();
  });

  it('opens the dropdown and signs the user out when clicked', () => {
    const logout = vi.fn();
    renderAt('/employee/dashboard', { name: 'Alice', email: 'alice@e.com', role: 'EMPLOYEE' }, logout);

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('Sign Out'));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders only the Home link on the bare employee dashboard', () => {
    renderAt('/employee/dashboard', { name: 'Alice', email: 'a@e.com', role: 'EMPLOYEE' });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Goal Setting')).not.toBeInTheDocument();
  });
});
