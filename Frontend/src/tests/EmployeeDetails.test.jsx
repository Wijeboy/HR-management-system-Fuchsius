import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import EmployeeDetails from '../pages/Employees/EmployeeDetails';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/userService', () => ({
  userService: {
    getUser: vi.fn(),
  },
}));

describe('EmployeeDetails Component Deep Tests', () => {
  it('renders employee details correctly', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    
    userService.getUser.mockResolvedValueOnce({
      data: {
        user: { employeeId: '1', name: 'Alice', email: 'alice@company.com', role: 'employee', department: 'IT', phone: '0771234567' }
      }
    });

    render(<BrowserRouter><EmployeeDetails /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('alice@company.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('0771234567').length).toBeGreaterThan(0);
    });
  });
});
