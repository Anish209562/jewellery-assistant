import { createContext, useContext, useState } from 'react';
import { authService } from '../services/services';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const token = localStorage.getItem('jwl_token');
  const savedUser = localStorage.getItem('jwl_user');

  if (!token || !savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('jwl_token');
    localStorage.removeItem('jwl_user');
    return null;
  }
};

/**
 * Auth Context Provider
 * Manages JWT token and user state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const loading = false;

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('jwl_token', token);
    localStorage.setItem('jwl_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('jwl_token', token);
    localStorage.setItem('jwl_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('jwl_token');
    localStorage.removeItem('jwl_user');
    disconnectSocket();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
