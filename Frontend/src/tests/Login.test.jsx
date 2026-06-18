import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Auth/Login';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('Login Component Deep Tests', () => {
  const mockLoginContext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLoginContext });
  });

  it('renders login form elements correctly', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByText(/FUCHSIUS HRMS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \/ Employee ID \/ Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in to workspace/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = screen.getByLabelText(/Email \/ Employee ID \/ Name/i);
    const passInput = screen.getByLabelText(/Password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@company.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@company.com');
    expect(passInput.value).toBe('password123');
  });

  it('shows error message on invalid login', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    render(<BrowserRouter><Login /></BrowserRouter>);
    
    fireEvent.change(screen.getByLabelText(/Email \/ Employee ID \/ Name/i), { target: { value: 'wrong@company.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'badpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign in to workspace/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(mockLoginContext).not.toHaveBeenCalled();
  });

  it('calls login context function on successful login', async () => {
    authService.login.mockResolvedValueOnce({
      data: { user: { role: 'admin' }, token: 'mock-token-123' }
    });

    render(<BrowserRouter><Login /></BrowserRouter>);
    
    fireEvent.change(screen.getByLabelText(/Email \/ Employee ID \/ Name/i), { target: { value: 'admin@company.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'admin' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign in to workspace/i }));

    await waitFor(() => {
      expect(mockLoginContext).toHaveBeenCalledWith({ role: 'admin' }, 'mock-token-123');
    });
  });

  it('handles quick login buttons', async () => {
    authService.login.mockResolvedValueOnce({
      data: { user: { role: 'hr' }, token: 'mock-token-hr' }
    });

    render(<BrowserRouter><Login /></BrowserRouter>);
    
    const hrQuickLoginBtn = screen.getByText('👤 HR Manager');
    fireEvent.click(hrQuickLoginBtn);

    await waitFor(() => {
      expect(mockLoginContext).toHaveBeenCalledWith({ role: 'hr' }, 'mock-token-hr');
    });
  });
});
