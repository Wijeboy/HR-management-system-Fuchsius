import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            HR Management System
          </h1>
          <p className="text-primary-100">Streamline Your HR Operations</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Outlet />
        </div>

        <p className="text-center text-primary-100 text-sm mt-6">
          © 2026 HR Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
