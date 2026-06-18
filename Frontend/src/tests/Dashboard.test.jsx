import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { role: 'admin', name: 'Test' } })),
}));

describe('AdminDashboard Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});
