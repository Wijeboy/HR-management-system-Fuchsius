import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserAvatar from '../../components/UserAvatar';
import { userService } from '../../services/userService';

const EmployeeDetails = () => {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await userService.getUser(id);
        setEmployee(res?.data?.user || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  if (loading) {
    return <div className="text-gray-600">Loading employee details...</div>;
  }

  if (!employee || error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>

        <div className="bg-white p-6 rounded-xl border border-gray-200 text-gray-600">
          {error || `Employee not found for ID: ${id}`}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-5 pb-6 mb-6 border-b border-gray-100">
          <UserAvatar
            name={employee.name}
            image={employee.profileImage}
            size="2xl"
          />

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.name}
            </h2>
            <p className="text-sm text-gray-500">
              {employee.jobTitle || employee.role}
            </p>
            <p className="text-sm text-gray-500">
              {employee.department}
            </p>

            <span
              className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs font-medium border ${
                employee.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {employee.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Employee ID:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.employeeId}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Name:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.name}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Email:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.email}
            </span>
          </div>

          <div>
            <span className="text-gray-500">System Role:</span>{' '}
            <span className="font-medium text-gray-900 capitalize">
              {employee.role}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Job Title:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.jobTitle || '-'}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Department:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.department}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Status:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.status}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Location:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.location || '-'}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Phone:</span>{' '}
            <span className="font-medium text-gray-900">
              {employee.phone || '-'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link
            to={`/employees/edit/${employee.employeeId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Edit Employee
          </Link>

          <Link
            to="/employees"
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Employees
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
