import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../services/userService';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: 'employee',
    jobTitle: '',
    status: 'Active',
    location: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await userService.getUser(id);
        const u = res?.data?.user;
        if (!u) {
          setError('Employee not found');
          return;
        }
        setForm({
          name: u.name || '',
          email: u.email || '',
          department: u.department || 'Engineering',
          role: u.role || 'employee',
          jobTitle: u.jobTitle || '',
          status: u.status || 'Active',
          location: u.location || '',
          phone: u.phone || '',
          password: '',
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        name: form.name,
        email: form.email,
        department: form.department,
        role: form.role,
        jobTitle: form.jobTitle,
        status: form.status,
        location: form.location,
        phone: form.phone,
      };
      if (form.password) payload.password = form.password;
      await userService.updateUser(id, payload);
      navigate(`/employees/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading employee details...</div>;
  }

  if (error && !form.name) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-gray-600">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-gray-600">Editing Employee ID: {id}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => onChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={(e) => onChange('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => onChange('department', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Engineering</option>
                <option>Sales</option>
                <option>HR</option>
                <option>Finance</option>
                <option>IT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select value={form.role} onChange={(e) => onChange('role', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input value={form.jobTitle} onChange={(e) => onChange('jobTitle', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => onChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={(e) => onChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Password (optional)</label>
              <input value={form.password} onChange={(e) => onChange('password', e.target.value)} type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
