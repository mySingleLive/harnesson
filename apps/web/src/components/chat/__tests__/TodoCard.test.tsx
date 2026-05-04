import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoCard } from '../tool-cards/TodoCard';
import type { TodoItem } from '@harnesson/shared';

const items: TodoItem[] = [
  { id: '1', subject: 'Explore project', status: 'completed' },
  { id: '2', subject: 'Write code', status: 'completed' },
  { id: '3', subject: 'Test it', status: 'completed' },
];

describe('TodoCard', () => {
  it('renders all completed items after expanding', async () => {
    const user = userEvent.setup();
    render(<TodoCard todos={items} />);

    // CollapsibleCard starts collapsed; click to expand
    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Explore project')).toBeInTheDocument();
    expect(screen.getByText('Write code')).toBeInTheDocument();
    expect(screen.getByText('Test it')).toBeInTheDocument();
  });

  it('shows checkmarks for all items after expanding', async () => {
    const user = userEvent.setup();
    render(<TodoCard todos={items} />);

    // CollapsibleCard starts collapsed; click to expand
    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('todo-check-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-check-2')).toBeInTheDocument();
    expect(screen.getByTestId('todo-check-3')).toBeInTheDocument();
  });

  it('renders nothing when todos is empty', () => {
    const { container } = render(<TodoCard todos={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows completed count in badge', () => {
    render(<TodoCard todos={items} />);
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });
});
