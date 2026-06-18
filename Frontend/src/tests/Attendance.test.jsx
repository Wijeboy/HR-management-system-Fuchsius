import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AttendanceReports from '../pages/Attendance/AttendanceReports';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { role: 'employee', _id: '123' } })),
}));

describe('AttendanceReports Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AttendanceReports />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
  });
});
