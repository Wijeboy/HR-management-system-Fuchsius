import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import GeneratePayroll from '../pages/Payroll/GeneratePayroll';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { role: 'hr' } })),
}));

describe('GeneratePayroll Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <GeneratePayroll />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});
