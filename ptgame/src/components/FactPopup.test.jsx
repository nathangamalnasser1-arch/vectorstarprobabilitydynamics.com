import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactPopup } from './FactPopup';

describe('FactPopup', () => {
  it('shows element name and fact', () => {
    render(
      <FactPopup
        elementName="Hydrogen"
        fact="Test fact text."
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Hydrogen')).toBeInTheDocument();
    expect(screen.getByText('Test fact text.')).toBeInTheDocument();
  });

  it('calls onClose when Continue is clicked', async () => {
    const onClose = vi.fn();
    render(
      <FactPopup elementName="H" fact="Fact." onClose={onClose} />
    );
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
