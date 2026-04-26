import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../src/components/ConfirmModal';

describe('ConfirmModal Component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    confirmText: 'Yes',
    cancelText: 'No',
  };

  it('renders when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} isOpen={false} />
    );
    // Modal returns null when isOpen is false
    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal {...defaultProps} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal {...defaultProps} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText('No'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('displays custom button labels', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Cancel"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders with danger variant', () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} variant="danger" />
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
});
