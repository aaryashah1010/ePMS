import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../src/components/Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <p>Card Content</p>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders card with title', () => {
    render(
      <Card title="Test Title">
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders card with custom style', () => {
    const { container } = render(
      <Card style={{ padding: '40px' }}>
        <p>Styled Card</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveStyle({ padding: '40px' });
  });

  it('renders card with actions', () => {
    render(
      <Card title="With Actions" actions={<button>Action</button>}>
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText('With Actions')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders card without title — no header section', () => {
    const { container } = render(
      <Card>
        <p>No Title</p>
      </Card>
    );
    expect(screen.getByText('No Title')).toBeInTheDocument();
    // No h2 rendered when no title
    expect(container.querySelector('h2')).not.toBeInTheDocument();
  });
});
