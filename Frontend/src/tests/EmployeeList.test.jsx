import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import EmployeeList from '../pages/Employees/EmployeeList';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

describe('EmployeeList Component Deep Tests', () => {
  it('renders employee data correctly', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    
    userService.getUsers.mockResolvedValueOnce({
      data: {
        users: [
          { employeeId: '1', name: 'Alice', email: 'alice@company.com', role: 'employee', department: 'IT' },
          { employeeId: '2', name: 'Bob', email: 'bob@company.com', role: 'manager', department: 'HR' }
        ]
      }
    });

    render(<BrowserRouter><EmployeeList /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});
