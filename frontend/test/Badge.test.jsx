import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../src/components/Badge';

describe('Badge Component', () => {
  it('renders badge with label', () => {
    render(<Badge label="ACTIVE" />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders badge with status SUBMITTED', () => {
    render(<Badge label="SUBMITTED" />);
    expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
  });

  it('renders badge with status DRAFT', () => {
    render(<Badge label="DRAFT" />);
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('renders badge with underscore-separated label and replaces underscores with spaces', () => {
    render(<Badge label="REPORTING_DONE" />);
    expect(screen.getByText('REPORTING DONE')).toBeInTheDocument();
  });

  it('renders badge with unknown label using default styling', () => {
    const { container } = render(<Badge label="UNKNOWN_STATUS" />);
    const badge = container.firstChild;
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('UNKNOWN STATUS');
  });

  it('renders badge with rating label Outstanding', () => {
    render(<Badge label="Outstanding" />);
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
  });
});
