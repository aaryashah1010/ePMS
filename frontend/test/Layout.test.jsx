import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../src/components/Layout';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'EMPLOYEE' },
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }) => children,
}));

describe('Layout', () => {
  it('renders the navbar and child content', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="page">Page content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.getByText('e-PMS')).toBeInTheDocument();
    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  it('wraps multiple children inside the main element', () => {
    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>One</div>
          <div>Two</div>
        </Layout>
      </BrowserRouter>,
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main.textContent).toContain('One');
    expect(main.textContent).toContain('Two');
  });
});
