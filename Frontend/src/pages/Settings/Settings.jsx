import React, { useEffect, useState } from 'react';

const Settings = () => {
  const [companyName, setCompanyName] = useState('FUCHSIUS HRMS');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [approvalNotifications, setApprovalNotifications] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hrms_settings');
      if (!raw) return;
      const saved = JSON.parse(raw);
      setCompanyName(saved.companyName || 'FUCHSIUS HRMS');
      setTimezone(saved.timezone || 'Asia/Colombo');
      setWorkStart(saved.workStart || '09:00');
      setWorkEnd(saved.workEnd || '18:00');
      setEmailNotifications(saved.emailNotifications ?? true);
      setApprovalNotifications(saved.approvalNotifications ?? true);
    } catch {
      // Keep defaults if localStorage parsing fails.
    }
  }, []);

  const saveSettings = () => {
    const payload = {
      companyName,
      timezone,
      workStart,
      workEnd,
      emailNotifications,
      approvalNotifications,
    };
    localStorage.setItem('hrms_settings', JSON.stringify(payload));
    setSuccess('Settings saved successfully.');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure application defaults and notification behavior.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
              <option value="Asia/Colombo">Asia/Colombo</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Workday Start</label>
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Workday End</label>
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <label className="flex items-center justify-between text-sm text-gray-700">
            <span>Email notifications for system events</span>
            <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between text-sm text-gray-700">
            <span>Approval and escalation alerts</span>
            <input type="checkbox" checked={approvalNotifications} onChange={(e) => setApprovalNotifications(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveSettings} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save Settings</button>
          {success && <span className="text-sm text-green-600 font-medium">{success}</span>}
        </div>
      </div>
    </div>
  );
};

export default Settings;
