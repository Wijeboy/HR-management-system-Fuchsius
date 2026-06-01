import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

const demoCredentials = [
  { role: 'admin', email: 'admin@company.com', password: 'admin' },
  { role: 'hr', email: 'hr@company.com', password: 'hr' },
  { role: 'manager', email: 'manager@company.com', password: 'manager' },
  { role: 'employee', email: 'employee@company.com', password: 'employee' },
];

const buildMockUser = (credential) => ({
  id: `mock-${credential.role || 'employee'}`,
  _id: `mock-${credential.role || 'employee'}`,
  employeeId: `MOCK-${String(credential.role || 'employee').toUpperCase()}`,
  name:
    credential.role === 'admin'
      ? 'System Admin'
      : credential.role === 'hr'
        ? 'HR Manager'
        : credential.role === 'manager'
          ? 'Team Manager'
          : 'Employee User',
  email: credential.email.trim(),
  department:
    credential.role === 'admin'
      ? 'Administration'
      : credential.role === 'hr'
        ? 'Human Resources'
        : credential.role === 'manager'
          ? 'Operations'
          : 'General',
  role: credential.role || 'employee',
  status: 'Active',
});

const isBackendUnavailable = (error) => !error?.response || error?.code === 'ECONNREFUSED' || String(error?.message || '').includes('Network Error');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const loginWithCredential = async (credential) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (USE_MOCK_BACKEND) {
        login(buildMockUser(credential), `mock-token-${credential.role || 'employee'}`);
        return;
      }

      const response = await authService.login({
        email: credential.email.trim(),
        password: credential.password,
        role: credential.role || undefined,
      });

      const user = response?.data?.user;
      const token = response?.data?.token;

      if (user && token) {
        login(user, token);
        return;
      }

      login(buildMockUser(credential), `mock-token-${credential.role || 'employee'}`);
    } catch (err) {
      if (isBackendUnavailable(err)) {
        login(buildMockUser(credential), `mock-token-${credential.role || 'employee'}`);
        return;
      }

      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (userType) => {
    const u = demoCredentials.find((d) => d.role === userType);
    if (!u) return;

    setEmail(u.email);
    setPassword(u.password);
    setSelectedRole(u.role);
    await loginWithCredential(u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginWithCredential({
      email,
      password,
      role: selectedRole || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="pt-8 pb-6 px-8 flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600">
            <span className="material-symbols-outlined text-[32px]">dataset</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">FUCHSIUS HRMS</h1>
          <p className="mt-2 text-sm text-gray-600 text-center">Enter your credentials to access your workspace</p>
        </div>

        <div className="px-8 pb-4">
          <p className="text-xs font-medium text-gray-500 mb-3 text-center">One-click Role Login</p>
          <div className="grid grid-cols-2 gap-2">
            {[['admin','🔑 Admin'],['hr','👤 HR Manager'],['manager','📊 Manager'],['employee','👨‍💼 Employee']].map(([role, label]) => (
              <button key={role} type="button" disabled={isSubmitting} onClick={() => handleQuickLogin(role)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        <form className="px-8 pb-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900" htmlFor="role">Select Role</label>
            <select className="block w-full rounded-lg border-gray-300 bg-white py-2.5 pl-3 pr-10 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
              id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">Auto detect from account</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Admin</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900" htmlFor="email">Email / Employee ID / Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input className="block w-full rounded-lg border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
                id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input className="block w-full rounded-lg border-gray-300 py-2.5 pl-10 pr-10 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
                id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-600 hover:text-gray-900" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded" id="remember" />
            <label className="ml-2 block text-sm text-gray-700" htmlFor="remember">Remember me for 30 days</label>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">login</span>
            {isSubmitting ? 'Signing in...' : 'Sign in to workspace'}
          </button>

          <div className="pt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-800">
              <div><strong>Admin:</strong> admin@company.com / admin</div>
              <div><strong>HR:</strong> hr@company.com / hr</div>
              <div><strong>Manager:</strong> manager@company.com / manager</div>
              <div><strong>Employee:</strong> employee@company.com / employee</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;