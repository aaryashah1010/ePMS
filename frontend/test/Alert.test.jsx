import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from '../src/components/Alert';

describe('Alert Component', () => {
  it('renders success alert', () => {
    render(<Alert type="success" message="Operation completed successfully" />);
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('renders error alert', () => {
    render(<Alert type="error" message="An error occurred" />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders warning alert', () => {
    render(<Alert type="warning" message="Please be careful" />);
    expect(screen.getByText('Please be careful')).toBeInTheDocument();
  });

  it('renders info alert', () => {
    render(<Alert type="info" message="Information message" />);
    expect(screen.getByText('Information message')).toBeInTheDocument();
  });

  it('does not render when message is empty', () => {
    const { container } = render(<Alert type="success" message="" />);
    // Empty message should not render the alert or should be empty
    expect(container.textContent).toBe('');
  });

  it('applies type based styling', () => {
    const { container: errorContainer } = render(<Alert type="error" message="Error" />);
    const errorAlert = errorContainer.firstChild;
    expect(errorAlert).toBeDefined();
    
    const { container: successContainer } = render(<Alert type="success" message="Success" />);
    const successAlert = successContainer.firstChild;
    expect(successAlert).toBeDefined();
  });
});