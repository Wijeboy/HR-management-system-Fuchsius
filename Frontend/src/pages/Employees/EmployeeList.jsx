import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch = `${employee.name} ${employee.email} ${employee.employeeId} ${employee.jobTitle}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter;
      const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const uniqueDepartments = useMemo(() => {
    return ['All', ...Array.from(new Set(employees.map((e) => e.department)))];
  }, [employees]);

  const removeEmployee = async (employeeId) => {
    try {
      await userService.deleteUser(employeeId);
      setEmployees((prev) => prev.filter((employee) => employee.employeeId !== employeeId));
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
      await userService.updateUser(employeeId, { password: newPassword });
      setSuccess(`Password reset successful for ${employeeId}.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    }
  };

  const toggleStatus = async (employeeId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await userService.updateUser(employeeId, { status: nextStatus });
      const updatedUser = res?.data?.user;
      setEmployees((prev) => prev.map((emp) => (emp.employeeId === employeeId ? { ...emp, ...updatedUser } : emp)));
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
  };

  const exportCsv = () => {
    const header = 'ID,Name,Email,Department,Role,Status';
    const rows = filteredEmployees.map((employee) => [
      employee.id,
      employee.employeeId,
      employee.name,
      employee.email,
      employee.department,
      employee.jobTitle,
      employee.status,
    ].join(','));
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
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">All Employees</h3>
          <p className="text-gray-500 mt-1">Manage access, status, and department details.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCsv} className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-gray-600 font-medium text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined" style={{fontSize: '20px'}}>file_upload</span>
            Export
          </button>
          <Link
            to="/employees/add"
            className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400" style={{fontSize: '18px'}}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee by name, email, role..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>filter_list</span>
            <span className="font-medium">Filter By:</span>
          </div>
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-600/50 transition-colors text-gray-700"
            >
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-600/50 transition-colors text-gray-700"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="ml-auto">
            <button onClick={clearFilters} className="text-sm text-indigo-600 font-medium hover:underline">Clear all</button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="p-4 pl-6 w-12">
                  <input className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" type="checkbox" />
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
                  <td colSpan={7} className="p-6 text-center text-sm text-gray-500">Loading employees...</td>
                </tr>
              )}
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeId} className="group hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <input className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" type="checkbox" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold ring-2 ring-white">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      employee.department === 'Engineering' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : employee.department === 'Sales'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : employee.department === 'HR'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        employee.department === 'Engineering'
                          ? 'bg-purple-500'
                          : employee.department === 'Sales'
                          ? 'bg-blue-500'
                          : employee.department === 'HR'
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }`}></span>
                      {employee.department}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                      employee.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/employees/${employee.employeeId}`} className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="View">
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>visibility</span>
                      </Link>
                      <Link to={`/employees/edit/${employee.employeeId}`} className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="Edit">
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>edit</span>
                      </Link>
                      <button onClick={() => resetPassword(employee.employeeId)} className="text-gray-500 hover:text-amber-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="Reset Password">
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>key</span>
                      </button>
                      <button onClick={() => toggleStatus(employee.employeeId, employee.status)} className="text-gray-500 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="Toggle Status">
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>{employee.status === 'Active' ? 'toggle_on' : 'toggle_off'}</span>
                      </button>
                      <button onClick={() => removeEmployee(employee.employeeId)} className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="Delete">
                        <span className="material-symbols-outlined" style={{fontSize: '20px'}}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-gray-500">No employees match your search/filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
