import React, { useMemo, useState } from 'react';

const OnboardingTasks = () => {
  const [tasks, setTasks] = useState([
    { id: 'ONB-001', employee: 'Nipun Silva', task: 'Issue company email account', owner: 'IT', dueDate: '2026-03-25', completed: true },
    { id: 'ONB-002', employee: 'Nipun Silva', task: 'Share HR policy handbook', owner: 'HR', dueDate: '2026-03-25', completed: true },
    { id: 'ONB-003', employee: 'Hansi Perera', task: 'Assign laptop and access card', owner: 'IT', dueDate: '2026-03-28', completed: false },
    { id: 'ONB-004', employee: 'Hansi Perera', task: 'Manager introduction meeting', owner: 'Manager', dueDate: '2026-03-29', completed: false },
  ]);

  const progress = useMemo(() => {
    const done = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
        <p className="text-gray-500 mt-1">Track onboarding checklists and completion progress.</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-semibold text-gray-900">{progress.done}/{progress.total} ({progress.pct}%)</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600" style={{ width: `${progress.pct}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">Employee</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">Task</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">Owner</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">Due Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-800">{task.employee}</td>
                  <td className="px-5 py-3 text-sm text-gray-800">{task.task}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{task.owner}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{task.dueDate}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleTask(task.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      {task.completed ? 'Reopen' : 'Mark Done'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTasks;
