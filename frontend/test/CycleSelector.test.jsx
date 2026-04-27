import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CycleSelector from '../src/components/CycleSelector';

vi.mock('../src/services/api', () => ({
  cycleAPI: {
    getAll: vi.fn(),
  },
}));

import { cycleAPI } from '../src/services/api';

describe('CycleSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the placeholder option even before cycles load', () => {
    cycleAPI.getAll.mockResolvedValue({ data: { cycles: [] } });
    render(<CycleSelector value="" onChange={() => {}} />);
    expect(screen.getByText(/Select Cycle/i)).toBeInTheDocument();
  });

  it('lists cycles returned by the API', async () => {
    cycleAPI.getAll.mockResolvedValue({
      data: {
        cycles: [
          { id: 'c1', name: 'FY2026', phase: 'GOAL_SETTING', status: 'ACTIVE' },
          { id: 'c2', name: 'FY2025', phase: 'ANNUAL_APPRAISAL', status: 'CLOSED' },
        ],
      },
    });

    render(<CycleSelector value="" onChange={() => {}} />);

    await waitFor(() => expect(screen.getByText(/FY2026/)).toBeInTheDocument());
    expect(screen.getByText(/FY2025/)).toBeInTheDocument();
  });

  it('filters cycles below minPhase', async () => {
    cycleAPI.getAll.mockResolvedValue({
      data: {
        cycles: [
          { id: 'c1', name: 'Phase1', phase: 'GOAL_SETTING', status: 'ACTIVE' },
          { id: 'c2', name: 'Phase2', phase: 'MID_YEAR_REVIEW', status: 'ACTIVE' },
          { id: 'c3', name: 'Phase3', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' },
        ],
      },
    });

    render(<CycleSelector value="" onChange={() => {}} minPhase="MID_YEAR_REVIEW" />);

    await waitFor(() => expect(screen.getByText(/Phase2/)).toBeInTheDocument());
    expect(screen.queryByText(/Phase1/)).not.toBeInTheDocument();
    expect(screen.getByText(/Phase3/)).toBeInTheDocument();
  });

  it('filters by exactPhase', async () => {
    cycleAPI.getAll.mockResolvedValue({
      data: {
        cycles: [
          { id: 'c1', name: 'OnlyOne', phase: 'GOAL_SETTING', status: 'ACTIVE' },
          { id: 'c2', name: 'Other', phase: 'MID_YEAR_REVIEW', status: 'ACTIVE' },
        ],
      },
    });

    render(<CycleSelector value="" onChange={() => {}} exactPhase="GOAL_SETTING" />);

    await waitFor(() => expect(screen.getByText(/OnlyOne/)).toBeInTheDocument());
    expect(screen.queryByText(/Other/)).not.toBeInTheDocument();
  });

  it('calls onChange and onCycleChange with the resolved cycle on selection', async () => {
    cycleAPI.getAll.mockResolvedValue({
      data: { cycles: [{ id: 'c1', name: 'FY2026', phase: 'GOAL_SETTING', status: 'ACTIVE' }] },
    });

    const onChange = vi.fn();
    const onCycleChange = vi.fn();
    render(<CycleSelector value="" onChange={onChange} onCycleChange={onCycleChange} />);

    await waitFor(() => expect(screen.getByText(/FY2026/)).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });

    expect(onChange).toHaveBeenCalledWith('c1');
    expect(onCycleChange).toHaveBeenCalledWith('c1', expect.objectContaining({ id: 'c1' }));
  });

  it('renders an empty list when the API call fails', async () => {
    cycleAPI.getAll.mockRejectedValue(new Error('network'));
    render(<CycleSelector value="" onChange={() => {}} />);
    expect(screen.getByText(/Select Cycle/i)).toBeInTheDocument();
  });
});
