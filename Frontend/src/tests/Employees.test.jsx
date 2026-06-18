import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import EmployeeList from '../pages/Employees/EmployeeList';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { role: 'admin' } })),
}));

describe('EmployeeList Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <EmployeeList />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});
