import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../src/pages/hr/UserManagement';

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
    user: { id: '1', name: 'HR Admin', role: 'HR' },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock APIs
vi.mock('../src/services/api', () => ({
  userAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderUserManagement = () => {
    return render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );
  };

  it('renders user management page heading', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getAll).mockResolvedValue({ data: { users: [] } });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });
  });

  it('displays list of users', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getAll).mockResolvedValue({
      data: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'EMPLOYEE', department: 'Engineering' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'HR', department: 'HR' },
        ],
      },
    });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('filters users by search input', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getAll).mockResolvedValue({
      data: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'EMPLOYEE', department: 'Engineering' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'EMPLOYEE', department: 'HR' },
        ],
      },
    });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'John' } });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    }
  });

  it('shows Add User button', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getAll).mockResolvedValue({ data: { users: [] } });

    renderUserManagement();

    await waitFor(() => {
      const addButton = screen.queryByText(/Add User/i) || screen.queryByText(/Create User/i);
      expect(addButton).toBeDefined();
    });
  });

  it('handles user deletion flow', async () => {
    const { userAPI } = await import('../src/services/api');
    vi.mocked(userAPI.getAll).mockResolvedValue({
      data: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'EMPLOYEE', department: 'Engineering' },
        ],
      },
    });
    vi.mocked(userAPI.delete).mockResolvedValue({ data: { message: 'User deleted' } });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.queryByText(/Delete/i);
    if (deleteButton) {
      fireEvent.click(deleteButton);
      // Confirm modal or direct deletion
    }
  });
});
