import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoBar } from '../TodoBar';
import type { TodoItem } from '@harnesson/shared';

const items: TodoItem[] = [
  { id: '1', subject: 'Explore project', status: 'pending' },
  { id: '2', subject: 'Write code', status: 'in_progress', activeForm: 'Writing code' },
  { id: '3', subject: 'Test it', status: 'completed' },
];

describe('TodoBar', () => {
  it('renders all todo items', () => {
    render(<TodoBar todos={items} />);
    expect(screen.getByText('Explore project')).toBeInTheDocument();
    expect(screen.getByText('Write code')).toBeInTheDocument();
    expect(screen.getByText('Test it')).toBeInTheDocument();
  });

  it('renders nothing when todos array is empty', () => {
    const { container } = render(<TodoBar todos={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows spinner for in_progress item', () => {
    render(<TodoBar todos={items} />);
    const spinner = screen.getByTestId('todo-spinner-2');
    expect(spinner).toBeInTheDocument();
  });

  it('shows checkmark for completed item', () => {
    render(<TodoBar todos={items} />);
    const check = screen.getByTestId('todo-check-3');
    expect(check).toBeInTheDocument();
  });
});
