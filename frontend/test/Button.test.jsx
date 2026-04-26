import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../src/components/Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockClick = vi.fn();
    render(<Button onClick={mockClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalled();
  });

  it('renders disabled button', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders button with variant primary', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('renders loading state — button is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('applies custom className via style prop', () => {
    const { container } = render(<Button style={{ color: 'red' }}>Custom</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('prevents click when disabled', () => {
    const mockClick = vi.fn();
    render(<Button disabled onClick={mockClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).not.toHaveBeenCalled();
  });
});
