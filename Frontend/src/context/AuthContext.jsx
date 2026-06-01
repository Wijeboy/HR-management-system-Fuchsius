import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { getDefaultRouteForRole } from '../utils/roleRouting';

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (USE_MOCK_BACKEND) {
        try {
          const storedUser = localStorage.getItem('user');
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          if (parsedUser) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } finally {
          setIsLoading(false);
        }

        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await authService.getCurrentUser();
        const currentUser = res?.data?.user || null;
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = (userData, token) => {
    if (token) localStorage.setItem('token', token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate(getDefaultRouteForRole(userData?.role), { replace: true });
  };

  const logout = async () => {
    if (!USE_MOCK_BACKEND) {
      try {
        await authService.logout();
      } catch {
        // Ignore logout request failures and clear local state anyway.
      }
    }

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};