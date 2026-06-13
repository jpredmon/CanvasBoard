import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditModeBanner } from './EditModeBanner';

it('text content is present in the DOM', () => {
  render(<EditModeBanner visible={true} />);
  expect(screen.getByText(/editing — drag cards to rearrange/i)).toBeInTheDocument();
});

it('outer wrapper starts collapsed when visible is false', () => {
  const { container } = render(<EditModeBanner visible={false} />);
  expect(container.firstChild).toHaveClass('max-h-0');
});

it('outer wrapper starts collapsed before rAF fires even when visible is true', () => {
  const { container } = render(<EditModeBanner visible={true} />);
  expect(container.firstChild).toHaveClass('max-h-0');
});
