import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ApplyLeave from '../pages/Leave/ApplyLeave';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { role: 'employee' } })),
}));

describe('ApplyLeave Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <ApplyLeave />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});
