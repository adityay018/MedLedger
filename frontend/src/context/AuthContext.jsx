import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session from stored token
  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          setStoredToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        setStoredToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error(res.error || 'Authentication failed');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (formData) => {
    setAuthError(null);
    try {
      const res = await api.register(formData);
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setStoredToken(null);
      setUser(null);
      setAuthError(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      // Ignore
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user && user.status === 'APPROVED',
    isPending: user?.status === 'PENDING',
    isSuspended: user?.status === 'SUSPENDED',
    authError,
    login,
    register,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
