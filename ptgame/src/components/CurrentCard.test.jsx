import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentCard } from './CurrentCard';

describe('CurrentCard', () => {
  it('shows symbol and number when element provided', () => {
    render(<CurrentCard element={{ symbol: 'H', number: 1 }} />);
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows message when no element', () => {
    render(<CurrentCard element={null} />);
    expect(screen.getByText(/All elements placed/)).toBeInTheDocument();
  });
});
