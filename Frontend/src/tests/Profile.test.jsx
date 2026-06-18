import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from '../pages/Settings/Profile';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  authService: {
    updateProfile: vi.fn(),
    updateProfilePhoto: vi.fn(),
    deleteProfilePhoto: vi.fn(),
  },
}));

describe('Profile Component Deep Tests', () => {
  const mockUpdateUser = vi.fn();
  
  const mockUser = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'employee',
    department: 'Engineering',
    phone: '1234567890',
    location: 'Colombo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
  });

  it('renders user information correctly', () => {
    render(<BrowserRouter><Profile /></BrowserRouter>);
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@company.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Colombo')).toBeInTheDocument();
  });

  it('updates profile successfully', async () => {
    authService.updateProfile.mockResolvedValueOnce({
      data: { user: { ...mockUser, name: 'John Updated' } }
    });

    render(<BrowserRouter><Profile /></BrowserRouter>);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'John Updated' } });
    
    const saveBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({
        name: 'John Updated',
        email: 'john@company.com',
        department: 'Engineering',
        phone: '1234567890',
        location: 'Colombo',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ ...mockUser, name: 'John Updated' });
      expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument();
    });
  });

  it('shows error when required fields are missing on save', async () => {
    render(<BrowserRouter><Profile /></BrowserRouter>);
    
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: ' ' } }); // Clear name
    
    const saveBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    });
    expect(authService.updateProfile).not.toHaveBeenCalled();
  });
});
