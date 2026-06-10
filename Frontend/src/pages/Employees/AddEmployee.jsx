import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';

const departments = ['Engineering', 'Sales', 'HR', 'Finance', 'IT'];
const roles = ['employee', 'manager', 'hr', 'admin'];
const statuses = ['Active', 'Inactive'];

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  department: 'Engineering',
  jobTitle: 'Associate',
  accountRole: 'employee',
  password: '',
  status: 'Active',
  location: 'Colombo',
  phone: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const namePattern = /^[A-Za-z][A-Za-z\s.'-]*$/;

const trimValue = (value) => String(value || '').trim();

const validatePhoneNumber = (value) => {
  const phone = trimValue(value);

  if (!phone) return true;

  const allowedFormat = /^\+?[0-9\s()\-]{7,20}$/;

  if (!allowedFormat.test(phone)) {
    return false;
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return false;
  }

  // Reject fake repeated numbers like 0000000000, 1111111111, 9999999999
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  // Sri Lankan local format: 0771234567 or 0112345678
  if (digits.startsWith('0')) {
    return /^0[1-9]\d{8}$/.test(digits);
  }

  // Sri Lankan international format: +94771234567 or 94771234567
  if (digits.startsWith('94')) {
    return /^94[1-9]\d{8}$/.test(digits);
  }

  // Other international numbers: must not start with 0
  return /^[1-9]\d{9,14}$/.test(digits);
};

const validateEmployeeForm = (form) => {
  const errors = {};

  const firstName = trimValue(form.firstName);
  const lastName = trimValue(form.lastName);
  const email = trimValue(form.email).toLowerCase();
  const password = String(form.password || '');
  const jobTitle = trimValue(form.jobTitle);
  const department = trimValue(form.department);
  const accountRole = trimValue(form.accountRole);
  const status = trimValue(form.status);
  const location = trimValue(form.location);
  const phone = trimValue(form.phone);

  if (!firstName) {
    errors.firstName = 'First name is required.';
  } else if (firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters.';
  } else if (!namePattern.test(firstName)) {
    errors.firstName = 'First name can contain letters, spaces, dots, apostrophes, and hyphens only.';
  }

  if (!lastName) {
    errors.lastName = 'Last name is required.';
  } else if (lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters.';
  } else if (!namePattern.test(lastName)) {
    errors.lastName = 'Last name can contain letters, spaces, dots, apostrophes, and hyphens only.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!department) {
    errors.department = 'Department is required.';
  } else if (!departments.includes(department)) {
    errors.department = 'Select a valid department.';
  }

  if (!jobTitle) {
    errors.jobTitle = 'Job title is required.';
  } else if (jobTitle.length < 2) {
    errors.jobTitle = 'Job title must be at least 2 characters.';
  } else if (jobTitle.length > 60) {
    errors.jobTitle = 'Job title must be less than 60 characters.';
  }

  if (!accountRole) {
    errors.accountRole = 'System role is required.';
  } else if (!roles.includes(accountRole)) {
    errors.accountRole = 'Select a valid system role.';
  }

  if (!password) {
    errors.password = 'Login password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  } else if (/\s/.test(password)) {
    errors.password = 'Password cannot contain spaces.';
  }

  if (!status) {
    errors.status = 'Status is required.';
  } else if (!statuses.includes(status)) {
    errors.status = 'Select a valid status.';
  }

  if (location && location.length > 80) {
    errors.location = 'Location must be less than 80 characters.';
  }

  if (phone && !validatePhoneNumber(phone)) {
    errors.phone = 'Enter a valid phone number, e.g. 0771234567 or +94771234567.';
  }

  return errors;
};

const AddEmployee = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formErrors = useMemo(() => validateEmployeeForm(form), [form]);
  const hasErrors = Object.keys(formErrors).length > 0;

  const getFieldError = (field) => {
    return touched[field] || errors[field] ? errors[field] || formErrors[field] : '';
  };

  const getInputClass = (field) => {
    const fieldError = getFieldError(field);

    return `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
      fieldError
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    }`;
  };

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setServerError('');

    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateEmployeeForm(form));
  };

  const markAllTouched = () => {
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      department: true,
      jobTitle: true,
      accountRole: true,
      password: true,
      status: true,
      location: true,
      phone: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateEmployeeForm(form);
    setErrors(validationErrors);
    markAllTouched();

    if (Object.keys(validationErrors).length > 0) {
      setServerError('Please fix the highlighted fields before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      await userService.createUser({
        name: `${trimValue(form.firstName)} ${trimValue(form.lastName)}`.trim(),
        email: trimValue(form.email).toLowerCase(),
        password: form.password,
        role: form.accountRole,
        department: form.department,
        jobTitle: trimValue(form.jobTitle),
        status: form.status,
        location: trimValue(form.location),
        phone: trimValue(form.phone),
      });

      navigate('/employees');
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const renderError = (field) => {
    const fieldError = getFieldError(field);

    if (!fieldError) return null;

    return <p className="mt-1 text-xs font-medium text-red-600">{fieldError}</p>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new employee account with validated login and profile details.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {serverError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                onBlur={() => onBlur('firstName')}
                type="text"
                placeholder="e.g. John"
                className={getInputClass('firstName')}
              />
              {renderError('firstName')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                onBlur={() => onBlur('lastName')}
                type="text"
                placeholder="e.g. deon"
                className={getInputClass('lastName')}
              />
              {renderError('lastName')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                onBlur={() => onBlur('email')}
                type="email"
                placeholder="employee@company.com"
                className={getInputClass('email')}
              />
              {renderError('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => onChange('department', e.target.value)}
                onBlur={() => onBlur('department')}
                className={getInputClass('department')}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              {renderError('department')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.jobTitle}
                onChange={(e) => onChange('jobTitle', e.target.value)}
                onBlur={() => onBlur('jobTitle')}
                type="text"
                placeholder="e.g. Software Engineer"
                className={getInputClass('jobTitle')}
              />
              {renderError('jobTitle')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.accountRole}
                onChange={(e) => onChange('accountRole', e.target.value)}
                onBlur={() => onBlur('accountRole')}
                className={getInputClass('accountRole')}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
              {renderError('accountRole')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  onBlur={() => onBlur('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  className={`${getInputClass('password')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {renderError('password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => onChange('status', e.target.value)}
                onBlur={() => onBlur('status')}
                className={getInputClass('status')}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {renderError('status')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                onBlur={() => onBlur('location')}
                type="text"
                placeholder="e.g. Colombo"
                className={getInputClass('location')}
              />
              {renderError('location')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                onBlur={() => onBlur('phone')}
                type="tel"
                placeholder="e.g. +94771234567"
                className={getInputClass('phone')}
              />
              {renderError('phone')}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-gray-600">
            Required fields are marked with <span className="text-red-500 font-semibold">*</span>. Employee ID is generated automatically by the system.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              disabled={submitting}
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : 'Add Employee'}
            </button>

            <button
              onClick={() => navigate('/employees')}
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                setForm(initialForm);
                setErrors({});
                setTouched({});
                setServerError('');
              }}
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Reset
            </button>
          </div>

          {hasErrors && Object.keys(touched).length > 0 && (
            <p className="text-xs text-gray-500">
              Please complete the highlighted fields correctly before saving.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
