import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your email to receive reset instructions</p>
        </div>
        <form className="mt-8">
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Send Reset Link
            </button>
            <Link to="/login" className="block text-center text-sm text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
