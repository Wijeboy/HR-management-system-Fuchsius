import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../../components/UserAvatar';
import { userService } from '../../services/userService';

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await userService.getUsers();
        setEmployees(res?.data?.users || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, itemsPerPage]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchableText = `${employee.name || ''} ${employee.email || ''} ${employee.employeeId || ''} ${employee.jobTitle || ''} ${employee.role || ''}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === 'All' || employee.department === departmentFilter;

      const matchesStatus =
        statusFilter === 'All' || employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const uniqueDepartments = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(employees.map((employee) => employee.department).filter(Boolean))
      ),
    ];
  }, [employees]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const showingStart =
    filteredEmployees.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, filteredEmployees.length);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, safeCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  };

  const removeEmployee = async (employeeId) => {
    const confirmDelete = window.confirm(`Delete employee ${employeeId}?`);

    if (!confirmDelete) return;

    try {
      await userService.deleteUser(employeeId);

      setEmployees((prev) =>
        prev.filter((employee) => employee.employeeId !== employeeId)
      );

      setSuccess(`User ${employeeId} deleted.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetPassword = async (employeeId) => {
    const newPassword = window.prompt(`Enter new password for ${employeeId}`);

    if (!newPassword) return;

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      await userService.updateUser(employeeId, {
        password: newPassword,
      });

      setSuccess(`Password reset successful for ${employeeId}.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    }
  };

  const toggleStatus = async (employeeId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    try {
      const res = await userService.updateUser(employeeId, {
        status: nextStatus,
      });

      const updatedUser = res?.data?.user;

      setEmployees((prev) =>
        prev.map((employee) =>
          employee.employeeId === employeeId
            ? { ...employee, ...updatedUser }
            : employee
        )
      );

      setSuccess(`Status updated to ${nextStatus} for ${employeeId}.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  const exportCsv = () => {
    const header = 'ID,Employee ID,Name,Email,Department,Role,Status';

    const rows = filteredEmployees.map((employee) =>
      [
        employee.id,
        employee.employeeId,
        employee.name,
        employee.email,
        employee.department,
        employee.jobTitle || employee.role,
        employee.status,
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'employees.csv';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">All Employees</h3>
          <p className="text-gray-500 mt-1">
            Manage access, status, and department details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-gray-600 font-medium text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
            type="button"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              file_upload
            </span>
            Export
          </button>

          <Link
            to="/employees/add"
            className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              add
            </span>
            Add Employee
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-sm">
            <span
              className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400"
              style={{ fontSize: '18px' }}
            >
              search
            </span>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employee by name, email, role..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <span
              className="material-symbols-outlined text-gray-400"
              style={{ fontSize: '18px' }}
            >
              filter_list
            </span>
            <span className="font-medium">Filter By:</span>
          </div>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-600/50 transition-colors text-gray-700"
          >
            {uniqueDepartments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-600/50 transition-colors text-gray-700"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(event) => setItemsPerPage(Number(event.target.value))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-600/50 transition-colors text-gray-700"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>

          <div className="ml-auto">
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 font-medium hover:underline"
              type="button"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="p-4 pl-6 w-12">
                  <input
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    type="checkbox"
                  />
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee Name
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-6">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-gray-500"
                  >
                    Loading employees...
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.employeeId}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <input
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        type="checkbox"
                      />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={employee.name}
                          image={employee.profileImage}
                          size="lg"
                          className="ring-2 ring-white"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-600 font-mono">
                      #{employee.employeeId}
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {employee.jobTitle || employee.role}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          employee.department === 'Engineering'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : employee.department === 'Sales'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : employee.department === 'HR'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            employee.department === 'Engineering'
                              ? 'bg-purple-500'
                              : employee.department === 'Sales'
                                ? 'bg-blue-500'
                                : employee.department === 'HR'
                                  ? 'bg-green-500'
                                  : 'bg-orange-500'
                          }`}
                        />
                        {employee.department}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                          employee.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>

                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/employees/${employee.employeeId}`}
                          className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title="View"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                          >
                            visibility
                          </span>
                        </Link>

                        <Link
                          to={`/employees/edit/${employee.employeeId}`}
                          className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title="Edit"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                          >
                            edit
                          </span>
                        </Link>

                        <button
                          onClick={() => resetPassword(employee.employeeId)}
                          className="text-gray-500 hover:text-amber-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title="Reset Password"
                          type="button"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                          >
                            key
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            toggleStatus(employee.employeeId, employee.status)
                          }
                          className="text-gray-500 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title="Toggle Status"
                          type="button"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                          >
                            {employee.status === 'Active'
                              ? 'toggle_on'
                              : 'toggle_off'}
                          </span>
                        </button>

                        <button
                          onClick={() => removeEmployee(employee.employeeId)}
                          className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title="Delete"
                          type="button"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                          >
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-gray-500"
                  >
                    No employees match your search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Showing {showingStart} to {showingEnd} of{' '}
            {filteredEmployees.length} filtered employees
            {filteredEmployees.length !== employees.length && (
              <span> from {employees.length} total</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Previous
            </button>

            {pageNumbers[0] > 1 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  type="button"
                >
                  1
                </button>

                {pageNumbers[0] > 2 && (
                  <span className="px-2 text-sm text-gray-400">...</span>
                )}
              </>
            )}

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded-lg text-sm border ${
                  safeCurrentPage === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                type="button"
              >
                {page}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-2 text-sm text-gray-400">...</span>
                )}

                <button
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  type="button"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
