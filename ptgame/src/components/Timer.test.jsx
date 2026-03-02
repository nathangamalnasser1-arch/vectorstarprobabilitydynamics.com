import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timer } from './Timer';

describe('Timer', () => {
  it('shows 00:00.000 when not started', () => {
    render(<Timer running={false} startTime={null} stoppedAt={null} />);
    expect(screen.getByText('00:00.000')).toBeInTheDocument();
  });

  it('shows elapsed time when stoppedAt is set', () => {
    const start = Date.now() - 65000;
    render(<Timer running={false} startTime={start} stoppedAt={start + 65000} />);
    expect(screen.getByText('01:05.000')).toBeInTheDocument();
  });
});
