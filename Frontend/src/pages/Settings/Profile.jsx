// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setDepartment(user.department || '');
    setEmail(user.email || '');
  }, [user]);

  const saveProfile = () => {
    updateUser({ name, department, email });
    setSaved('Profile updated successfully.');
    setTimeout(() => setSaved(''), 2500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input value={user?.role || ''} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={saveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Profile</button>
          {saved && <p className="text-sm text-green-600">{saved}</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
