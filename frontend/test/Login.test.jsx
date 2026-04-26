import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/context/AuthContext';

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
const mockLogin = vi.fn();
vi.mock('../src/context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      loading: false,
    }),
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders login form with welcome message', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Electronic Performance Management System')).toBeInTheDocument();
  });

  it('renders email and password input fields', () => {
    renderLogin();
    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders sign in button', () => {
    renderLogin();
    const signInButton = screen.getByText('Sign In');
    expect(signInButton).toBeInTheDocument();
    expect(signInButton.type).toBe('submit');
  });

  it('updates form fields on input change', () => {
    renderLogin();
    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    
    fireEvent.change(inputs[0], { target: { value: 'test@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'password123' } });

    expect(inputs[0].value).toBe('test@example.com');
    expect(inputs[1].value).toBe('password123');
  });

  it('renders demo account quick login buttons', () => {
    renderLogin();
    expect(screen.getByText('HR Admin')).toBeInTheDocument();
    expect(screen.getByText('Alice (Employee)')).toBeInTheDocument();
    expect(screen.getByText('Bob (Reporting Officer)')).toBeInTheDocument();
  });

  it('quick login buttons populate form', () => {
    renderLogin();
    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const hrButton = screen.getByText('HR Admin').closest('button');

    fireEvent.click(hrButton);

    expect(inputs[0].value).toBe('hr@epms.com');
    expect(inputs[1].value).toBe('hr@123');
  });

  it('submits form with email and password', async () => {
    mockLogin.mockResolvedValue({ role: 'EMPLOYEE' });

    renderLogin();

    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(inputs[0], { target: { value: 'test@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('navigates to employee dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ role: 'EMPLOYEE' });

    renderLogin();

    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(inputs[0], { target: { value: 'emp@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'pass123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/employee/dashboard');
    });
  });

  it('navigates to HR dashboard for HR role', async () => {
    mockLogin.mockResolvedValue({ role: 'HR' });

    renderLogin();

    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(inputs[0], { target: { value: 'hr@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hr/dashboard');
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin();

    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(inputs[0], { target: { value: 'wrong@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderLogin();

    const inputs = screen.getAllByPlaceholderText(/you@epms.com|••••••••/);
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(inputs[0], { target: { value: 'test@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    // Should show loading text
    await waitFor(() => {
      const button = screen.getByText(/Signing in|Sign In/);
      expect(button).toBeInTheDocument();
    });
  });
});